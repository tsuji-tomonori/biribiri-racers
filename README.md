# ビリビリレーサーズ

1人で遊ぶ、押してためて離してダッシュする見下ろし型レーシングゲーム。
Astro + strict TypeScriptで構築し、GitHub ActionsからGitHub Pagesに配信します。

公開先: https://tsuji-tomonori.github.io/biribiri-racers/

## 遊び方

1. 5コースから選び、「CPUとレース」または「フリー走行」を選ぶ。
2. 自動で加速。左右キー / A・Dで旋回。
3. Spaceを押して減速・チャージ。離すとダッシュ。
4. 壁に触れるとスタートへ戻る。一周してスタートラインに最初に戻ったレーサーの勝利。初回通過や逆走はゴールになりません。サンダーガーデンの分岐はどちらも走れます。

タッチ画面には左右とPUSHボタンを表示します。Escは一時停止、Rはスタートへ戻る、Vは全体表示切替。標準マッピングのゲームパッドは左スティックとAボタンに対応しています（実機確認は未実施）。

CPUは3台、難易度は2段階。やさしい旋回補助は初期ONです。練習は単独走行。画像読込に失敗した場合は開始せず、再読み込みを案内します。フォーカスを失うと自動で停止します。

## マシン

| マシン | 得意なこと | 苦手なこと |
|---|---|---|
| 青・スパーク | バランスのよい走り | 特化型ほどの強みはない |
| 桃・ソニック | 高い最高速 | 旋回が弱く、早めの減速が必要 |
| 緑・リーフ | 小回りとグリップ | 最高速は低め |
| 黄・ボルト | 短いチャージと長い強力ダッシュ | 通常走行は遅い |

CPUにも同じ機体性能と壁判定を適用します。接触時は0.3秒の感電表示後にスタートへ戻り、0.75秒の復帰待機を経て走行を再開します。動きを抑える設定では画面を揺らしません。

## 開発

Node.js 24 / npm。画像・フォント・スクリプトの外部CDNは不要。

```sh
npm ci
npm run dev
# http://localhost:4321/biribiri-racers/
```

```sh
npm run check
npm run format:check
npm run test:coverage
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

`npm run preview`でビルド結果を確認できます。E2Eは本番ビルドを起動し、375・768・1440pxで実際に操作します。CPU完走とプレイヤーのキー入力完走も検証します。本番コードにはテスト用の移動・勝利フックを含みません。

## 公開と構成

Pages設定のSourceは **GitHub Actions**。mainへのpushで型検査、整形、単体テスト、ビルド、E2Eを行い、すべて成功した場合のみ公開します。公開後はビルドSHAと公開URL上の操作を検証します。PRでは公開しません。

- `src/components` / `src/pages`: Astro UIと静的HTML生成
- `src/game`: DOM非依存の走行・勝敗、入力、Canvas描画、音声
- `public/assets`: ImageGenで周回用に再生成した5コースとオリジナルマシン画像
- `tests`: VitestとPlaywright
- `docs`: 現行仕様・設計・公開手順
- `tasks` / `reports`: 作業・検証記録

この版は1人用のサンプルです。オンライン、ローカル2人対戦、アカウント、サーバー保存は含みません。過去のtasks/reportsは履歴であり、現行仕様はREADMEとdocsを参照してください。
