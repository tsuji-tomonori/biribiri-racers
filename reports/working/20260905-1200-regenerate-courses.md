# 全コース画像の周回化

## 指示・要件・判断
旧GOALを案内板で覆う処置を廃止し、全画像をImageGenで再生成してマップを整合させる。既存5テーマ・左のスタート位置・分岐・道幅を維持し、旧アーチ・柱・外向き出口を自然な道路と外壁へ置換した。生成モードは組み込みImageGenの画像参照編集。生成PNGは1254×1254、WebP quality 92に形式変換して採用した。

## 実施作業
- 全5コースの画像を置換。左にSTART / FINISHを直接描き、旧ゴール箇所を連続した道路にした。
- プレビュー・レース・ミニマップのLAP案内板と型・座標・CSSを削除。重複するSTART / FINISHパネルも削除。
- 全コースの旧出口ポリゴンを閉鎖。シティの下部外壁、キャンディの右下カーブを新しい画像の道路端に合わせた。
- 画像内の紛らわしい進行矢印を除去。ゲームの案内矢印は実経路から生成する。
- 旧出口が走行可能領域でないことの5回帰テストと、全コース画像の切替・寸法・隠蔽なしを確認するE2Eを追加。

## 生成プロンプトの要点
各既存course-N.webpを1枚参照。square top-down CLOSED LAP CIRCUIT、exact framing / road geometry / widths / islands / decorations、REMOVE GOAL arch / pillars / downward exit、reconstruct continuous road sweeping LEFT、close outer guardrail、left checkerboard as START / FINISH、no overlay / minimap / vehicles / HUD / extra exitを指定。パステルは追加編集で色付き逆向き矢印のみ除去。全結果を1254px原寸で目視し、旧アーチ・出口が残っていないことを確認。

## 検証
ローカル: 型検査・68 unit・coverage・build成功。physics/geometry/sessionの行・関数100%、分岐94%。全5コース×4機種のCPU/プレイヤー相当走行とガーデン別分岐の完走を含む。
CI E2E・公開画面: 確認中。

## fit・制約
画像の隠蔽でなく画像そのものを更新した。衝突形状は画像から手動で合わせたポリゴンであり、画像ピクセルからの自動衝突生成ではない。旧出口の閉鎖は回帰テストで検証する。spec-recoveryは新規の仕様復元タスクではないため専用validatorは対象外。
