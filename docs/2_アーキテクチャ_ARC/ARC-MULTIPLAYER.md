# 匿名対戦の構成と状態
種別: ARC / 更新: 2026-09-06 / 対象: BR-ROOM-001〜BR-DOC-001

CloudFrontの既定originはOAC付き非公開S3。`/api/*`はHTTP APIからFastAPI/Mangum Lambdaへ、`/event/realtime`はAppSync Events WebSocketへ、`/event`はAppSync HTTPへ転送する。動的behaviorはキャッシュ無効、viewer Hostを除くヘッダーを転送する。AppSyncの接続認証内のhostはHTTP endpointを使う。静的サイトはAWS用buildでbase `/`、API `/api`。GitHub Pages向けbuildは従来のbaseを維持する。

DBはDynamoDBの単一オンデマンドテーブルのみ。Redis、RDS、常駐ゲームサーバーは使わない。ルームの最大10人という境界を利用し、状態をversion付きの1項目として条件付きPutする。状態はJSONをzlib圧縮し、展開後128 KiBを上限にする。TTLは4時間で固定し、DynamoDBの遅延削除を待たずAPIも期限判定する。状態更新とDynamoDB Streams生成は同じ書き込みに対応し、配信失敗で確定済み順位が巻き戻らない。通知Lambdaはバッチ内の各ルームの最新versionだけを配信する。失敗は3回再試行後SQSへ保存しCloudWatch alarmで検出する。SQSは再処理用でDBではない。

1参加者あたり最大5回/秒に入力をまとめて送る。ブラウザは120 Hzで予測描画し、同じ入力をPythonでも120 Hzで計算する。位置、壁接触回数、ギミック状態、チェックポイントはサーバー計算結果から配信する。クライアントは確定状態に未確認入力だけを再適用する。APIは1秒以上の入力、現在時刻+100 msより先のシミュレーション、古いraceId、飛んだseq、位置・ゴールの直接指定を拒否する。重複seqは再実行しない。全8コースのデータはTypeScriptから自動exportし、両言語を同一入力で比較する。

レース開始はホスト操作、2人以上・全員準備完了が必要。3秒後に全員共通のstartAtで開始する。最下位が確定する残り1人の時点で結果を確定する。通信の到着順（DynamoDBの更新成功順）でゴールを順位付けするカジュアル対戦であり、ネットワーク遅延補償を伴う競技用判定ではない。切断30秒でリタイア、残る参加者のheartbeatで判定し、ホストも移譲する。全員切断した部屋はTTLで消える。GPは開始時メンバーで8コースを順番に進め、途中入室を拒否する。フリーではレース間に再参加・コース変更ができる。得点は15,12,10,8,6,5,4,3,2,1、リタイアは0点。

ログイン画面は設けず、作成・参加時に256 bitのランダムトークンを発行する。ブラウザはsessionStorageに保持し、DynamoDBはハッシュだけを保持する。状態レスポンス・配信にはハッシュを含めない。閲覧・更新・AppSync購読はその部屋の有効トークンを要求し、他ルーム・ワイルドカード購読を拒否する。配信権限はLambdaのIAMのみ。既存の購読接続は退出操作でクライアントが閉じる方式であり、悪意あるクライアントの既存ソケットを強制失効する機能はこの版にはない。名前などのルーム情報を秘密情報として扱う用途には使わない。

公開endpointはhealth/config/作成/参加。API Gatewayは全体300 request/秒・burst500、Lambda予約同時実行数、DynamoDB最大2000 RRU/WRUで上限を設ける。作成6回/分・参加30回/分のDynamoDBカウンタはAPI Gatewayのsource IPに適用する。CloudFront経由ではedgeのIP単位になり共有されるため、多数の部屋を同時運用する際は信頼できるviewer IP伝達と制限値を別途調整する。1ルーム10人の小規模対戦を想定した設計であり、実AWSの同時多数ルーム負荷・遅延は未計測。競合再試行と状態全体の書き込みが先に限界となる場合は、同じDynamoDB内でプレイヤー状態を分割する。

生成設計は `docs/design/generated/fastapi` と `docs/design/generated/cdk/BiribiriMultiplayer`にあり、手書き本文から生成していない。FastAPIはDynamoDB専用のプロジェクトadapterでOpenAPI・operation AST/contract・要件/test trace・source digestを生成する。標準SQL adapterは非該当。SQLの不存在を明示し、DynamoDBのトランザクション意味論はこの文書とテストで補う。CDKはDev-standard標準generatorがsynth templateの完全なbytesに紐づく文書を生成する。`--check`は既存文書を書き換えない。

参照: [AppSync認可](https://docs.aws.amazon.com/appsync/latest/eventapi/configure-event-api-auth.html)、[WebSocket protocol](https://docs.aws.amazon.com/appsync/latest/eventapi/event-api-websocket-protocol.html)。
