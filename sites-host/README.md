# ChatGPT Sites配信

既存Astroゲームを、SitesのVinext starterとD1に組み込むための配信アダプター。AWS向けAPIと通信方式も残す。

## 準備と更新

1. Sitesスキルの`project-setup.mjs`で空のSites checkoutを準備する。
2. 新規時のみ`create_site`で登録し、返されたIDを`.openai/hosting.json`へ保存する。
3. starterの依存を`install-dependencies.mjs`でインストールする。
4. 本リポジトリで次を実行する。

```sh
npm ci
npm run check
npm test
PUBLIC_SITE_BASE=/ PUBLIC_API_BASE=/api npm run build
node scripts/prepare-sites.mjs /absolute/path/to/site-checkout
```

5. Sites checkoutを型検査し、Sitesの`build-site.mjs`でビルドする。
6. Sitesの`site-workflow.mjs`でsourceを同期し、返されたSHAとarchiveを使って保存・公開する。

登録済みcheckout以外への準備は拒否する。prepareはSite IDを維持し、D1 bindingを`DB`へ設定する。`sites-host/app`、`db`、`drizzle`をSitesへコピーし、`src/sites`と依存する共通物理、Astro出力も移す。`lib/game-html.ts`は生成物なので直接編集しない。

## 保存・同期・アクセス

- 同一オリジン`/api`。待機中は1秒、レース中は200msおきに部屋を読み取る。通信時間分の遅延はある。自分のマシンは共通物理で予測する。
- 参加者ごとのランダムトークンをBearerで送る。サーバーにはSHA-256のみ保存し、配信する部屋状態には含めない。
- ホストのみ設定変更・開始・次戦へ進行できる。2人以上、全員準備完了で3秒後に開始。
- D1はversionを条件とするCAS更新を行う。複数Workerからの同時更新を上書きしない。D1 sessionはprimaryから読み始める。
- サーバーが120Hzの共通物理で入力を再計算し、順序・再送・入力範囲・実時間上限・ゴールを検証する。
- 部屋は作成から4時間で失効。30秒無応答で退出。ホスト退出時は交代する。コースの制限時間で結果を確定する。
- 作成・参加はIPのハッシュ単位で毎分30回まで。期限切れの部屋と古いレート記録は参加操作時に削除する。
- 意図した匿名公開APIは設定・ヘルス・作成・参加。部屋の参照と操作には参加トークンが必要。名前は参加者が任意に入力し、他参加者へ表示される。
- schema変更はDrizzleで新規migrationを生成する。適用済みSQL・journal・snapshotを編集しない。Sitesが公開時にmigrationを適用する。

## 検証範囲

`tests/unit/sites.test.ts`は部屋権限・定員・競合・再送・不正入力・実完走・順位・期限・HTTP・実SQLiteを検証する。`polling.test.ts`は2つのClientによるHTTP参加・同時開始・移動共有を検証する。FastAPI/CDK generatorはSitesのTypeScript routeを対象としていないため、Sites APIは生成設計書の対象外。

ブラウザー実機の通信遅延と操作感は、別途2端末で確認する。200ms定期取得のため、高遅延回線では相手のマシン表示に遅れが出る。
