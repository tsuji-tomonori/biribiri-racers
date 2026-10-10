# ChatGPT Sitesでのマルチプレイ公開

状態: done
タスク種別: 機能追加

## 依頼

既存のビリビリレーサーズをマルチプレイできるようにし、ChatGPT Sitesで公開する。

## 受け入れ条件と完了条件

- [x] 既存8コース、画像、操作、1人用の遊び方を引き継ぐ。
- [x] 2〜10人が部屋コードで参加し、準備完了後に同時スタートできる。
- [x] サーバーが入力を検証し、共通TypeScript物理で走行と順位を判定する。
- [x] 部屋はD1に保存し、別端末から同じ状態を取得できる。
- [x] 他参加者のトークンを返さず、ホスト専用操作と不正入力を拒否する。
- [x] 対応範囲の型検査・テスト・ビルドを実施する。ブラウザー環境がない場合は未検証と記録する。
- [x] Sites公開成功と実URLを確認する。
- [x] GitHubへのPR・受け入れ条件コメント・作業報告を残す。

## 方針

既存AstroゲームのUI・走行処理を維持。Sites向けVinext APIとD1永続化を追加する。Sites版は同一オリジンHTTPで部屋状態を定期取得し、入力予測は既存クライアントを使う。AWS向けWebSocket接続は維持する。

## 結果

公開先: https://biribiri-racers-online.tsujitomonori.chatgpt.site
PR: https://github.com/tsuji-tomonori/biribiri-racers/pull/24
119テストと配備先2参加者のAPI同期が成功。ブラウザー実機は未検証。
