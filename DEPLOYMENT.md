# 公開部署

網站： https://angusma0711.github.io/ipad-presentation/

原始碼存放在 github.com/angusma0711/ipad-presentation。Push 到 `main` 後，GitHub Actions（`.github/workflows/pages.yml`）會：

1. 檢查 Firebase secrets 是否齊全；
2. `pnpm install`；
3. 執行簡報檢查（`scripts/check-decks.mjs`）、TypeScript 及 Vite build；
4. 發布 `dist-pages` 到 GitHub Pages。

在 GitHub → Actions 可查看每次發布結果。失敗時舊版網站會保留。

## 一次性設定

GitHub → Settings → Secrets and variables → Actions → New repository secret，加入六個值（與 `.env.local` 相同）：

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

`.env.local` 不會上傳到 GitHub。Firebase Web config 會出現在網站程式內，屬正常；權限由 Firestore Rules 控制。

## Firestore Rules

修改 `firestore.rules` 後，到 Firebase Console → Firestore → Rules 貼上並按 Publish（或 `npx firebase-tools deploy --only firestore:rules`）。新增簡報不需要改 Rules。

課堂代碼在建立後 24 小時失效，或教師在 iPad 按「結束課堂」後即時失效。

## 本機建置（可選）

`node scripts/build-pages.mjs` 仍可在本機產生 `dist-pages` 及 ZIP 作檢查，但發布不再需要上傳 ZIP。

## 全螢幕及螢幕常亮

投影頁右上角和教師控制台頂部有全螢幕按鈕；每部裝置須自行按按鈕。課堂進行中，投影電腦和 iPad 會要求螢幕保持開啟（Screen Wake Lock；iPad 需 iPadOS 16.4 或以上）。
