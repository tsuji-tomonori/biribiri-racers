# REQ_TECHNICAL_CONSTRAINT_001 AstroとTypeScript

種別: 技術制約 / 出所: ユーザー明示 / 優先度: 必須 / 状態: 実装済み / 版: 1.0

## 要求
配信するゲームはAstroとstrict TypeScriptを使用した静的ビルドで生成する。

## 受け入れ条件
npm ci、npm run check、npm run buildが成功し、distが生成される。手編集した単一HTMLを正本にしない。

## 属性・レビュー
理由: 型検査、責務分離、再現可能なビルドを要求されたため。範囲: src全体。代替: 今回はなし。責任: 保守者。依存: npm lock / Node.js 24。検証可能性・原子性・実現可能性を確認。実行結果は作業報告を参照。
