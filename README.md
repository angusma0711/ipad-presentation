# iPad-Controlled Presentation V2

新增或修改簡報：見 [DECKS.md](DECKS.md)。發布：見 [DEPLOYMENT.md](DEPLOYMENT.md)。

電腦顯示簡報，iPad 控制同一課堂。六張示範音樂課投影片保存在前端，Firestore 同步導航、小組積分、Pointer、逐頁標記及媒體控制。

## 執行

需要 Node.js 20.19+ 或 22.12+ 及 npm。

```bash
npm install
cp .env.example .env.local
npm run dev
```

開啟 `/start`。未設定 Firebase 時，可開 `/preview/<簡報資料夾名稱>` 預覽，並使用左右方向鍵。此預覽沒有跨裝置同步。

```bash
npm run build
npm run preview
```

若使用 pnpm，可用 `pnpm install`、`pnpm dev`、`pnpm build`。本專案提供 pnpm lockfile。

## Firebase 設定

1. 在 Firebase Console 建立專案。
2. 建立 Cloud Firestore 的 `(default)` database，選擇適合的 region。
3. Authentication → Sign-in method → 啟用 Anonymous。
4. Project settings → Your apps → 新增 Web app。
5. 將 Web app 的六個設定值填入 `.env.local`，欄位名稱見 `.env.example`。重啟 dev server。
6. Firestore → Rules：貼上 `firestore.rules` 並 Publish。不要使用公開 test-mode rules。
7. Authentication → Settings → Authorized domains：加入實際部署網域，如需 localhost 測試也加入 localhost。

可用 Firebase CLI 部署規則和網站（需自行登入及選擇專案）：

```bash
npx firebase-tools login
npx firebase-tools use --add
npm run build
npx firebase-tools deploy --only firestore:rules,hosting
```

`firebase.json` 包含 SPA rewrite，直接開啟 `/present/:sessionId` 或 `/control/:sessionId` 仍會載入應用程式。其他 hosting 平台也必須將這些路徑 rewrite 至 `/index.html`。

## 課堂操作

1. 電腦與 iPad 使用同一網絡；在電腦開啟 dev server 所列的 Network URL，例如 `http://192.168.1.20:5173/start`。iPad 的 localhost 是 iPad 本身。
2. 建立課堂，掃描 QR code 開啟 `/control/ABC234`。
3. 電腦按 Open Presentation 開啟 `/present/ABC234`，可用瀏覽器全螢幕投影。
4. iPad 上一張、下一張或直接選擇；電腦 ArrowRight／Space／ArrowLeft 也會更新雲端狀態。
5. Speaker Notes 僅由控制頁渲染。

## 可靠性與限制

- 使用 `onSnapshot` 與 metadata 判斷 Firebase 同步狀態，不輪詢。瀏覽器 network 狀態只作輔助，Connected 須收到 server snapshot。
- 導航使用 transaction，以雲端最新 slide 計算 delta，避免兩台裝置覆蓋同時發出的相對導航。處理中的操作會鎖定按鈕，鍵盤忽略 held-key repeat。
- 離線控制器停止寫入，不排隊重播舊操作。投影頁保留內容並允許本機鍵盤操作；重連後以雲端最新投影片為準，本機離線移動不補寫。
- Firebase SDK 會處理已建立 listener 的暫時斷線重連。缺少設定、授權失敗及不存在課堂會顯示錯誤；修正設定後需重新載入。完全離線首次載入網站仍需已載入的頁面；此版本不是離線安裝的 PWA。
- 規則禁止未登入存取、列出課堂、刪除課堂，以及修改非導航欄位。任何已匿名登入且知道課堂代碼的人皆可控制該課堂，符合 V1；代碼不是嚴格權限隔離。
- Speaker Notes 不出現在投影 DOM，但內容仍包含在前端程式 bundle；請勿放入敏感個人資料。
- 更改示範投影片數量時，同步修改 rules 的 currentSlide 上限。V1 僅支援 demo-presentation。
- 課堂不自動過期；可於 Console 刪除舊資料。

## 結構

- `src/presentations/`：內容、標題及筆記
- `src/services/`：Firebase、session transaction、共享 subscription hook
- `src/components/`：投影、控制器、導航、狀態
- `src/pages/`：start、present、control routes

## 驗證清單

先配置 Firebase，再用兩個瀏覽器視窗及真實 iPad 測試：

- 建立課堂：6 位代碼、QR code、兩個 URL 正確。
- Controller Next／Previous／slide 5：兩端只移動一次、同一索引。
- 電腦 ArrowRight／Space／ArrowLeft：控制器同步。
- 第 1 張 Previous 和最後一張 Next 無法越界。
- 每張筆記跟隨投影片更新，投影 DOM 沒有筆記。
- 使用 browser DevTools Offline 暫時斷開控制器：停用按鈕、顯示 Offline；電腦可繼續操作；恢復後自動取得最新索引。
- 斷開投影端：鍵盤仍可用；重連後取得雲端索引，不重播舊導航。
- 在 iPad portrait、landscape、手機檢查觸控尺寸、文字及 QR code。
- 錯誤／不存在代碼顯示 Session not found；沒有 Firebase env 不會令投影空白。
- 以未登入 client 存取及非法欄位寫入驗證 rules 的拒絕行為。

實際執行結果見 `VALIDATION.md`；沒有配置 Firebase 前，不能視作已通過雙裝置驗收。

Firebase 行為參考：[Offline data](https://firebase.google.com/docs/firestore/manage-data/enable-offline)、[Security Rules field restrictions](https://firebase.google.com/docs/firestore/security/rules-fields)。

## 這部 Mac 的啟動方式

Firebase 已配置在 .env.local，使用 block-practice 專案及香港 Firestore database。
這部 Mac 沒有系統 npm；可雙擊 start.command，使用現有 Codex bundled Node 啟動。
Terminal 視窗需保持開啟。按 Ctrl+C 停止。每次以 Terminal 顯示的 Network URL 建立課堂，iPad QR code 才會指向電腦。
此 launcher 僅適用這部 Mac；搬到其他電腦請按上面的標準 Node/npm 安裝方式執行。

Security Rules 可用下列指令再次驗證（需已存在的測試課堂代碼）：

    node scripts/check-firebase-rules.mjs ABC234

此測試會新增一個匿名登入使用者，檢查讀取權限及拒絕非法寫入。


## V2 教師工具

- **小組積分**：預設四組，可改組名；按 +1／−1 調整總分（最低 0）。按「顯示投影積分」後，學生看到組名及總分；加減分按鈕只在教師頁出現。
- **Pointer**：選「紅點 Pointer」，在投影片預覽按住或拖曳。放開即消失；斷線時紅點約 2.4 秒後消失。位置以投影片比例同步。
- **畫線／圈選**：選工具及顏色，在預覽畫線；完成一筆後同步到投影。每頁最多 30 筆，可復原上一筆或清除此頁。換頁保留各頁標記。
- **音訊／影片**：展開「此頁音訊／影片」，選來源，輸入路徑或 YouTube 連結，按「將媒體加入此頁」。播放、暫停和重新播放控制投影電腦；教師預覽不播聲音。換頁會停止原頁媒體。

### 放入自己的媒體

1. 將 MP3、WAV、M4A、OGG、MP4、WebM 或 MOV 檔案放入 `public/media`。實際可播放格式取決於投影瀏覽器。
2. 教師頁輸入 `/media/檔案名稱.mp3` 或 `/media/檔案名稱.mp4`。不要輸入 Mac 的完整檔案路徑。
3. 可先用 `/media/demo-beat.wav` 測試音訊，以及 `/media/demo-motion.mp4` 測試影片。YouTube 可輸入一般影片連結、youtu.be 連結或影片 ID。
4. 媒體要隨網站部署；這版沒有直接上傳介面。YouTube 需要網絡且影片允許嵌入。

瀏覽器可能阻擋由遠端操作觸發的有聲播放。教師頁會顯示播放狀態；若被阻擋，在投影電腦按「點此播放／啟用音訊」或影片播放鍵。參考 [MDN autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)。

V2 需要重新發布目前的 `firestore.rules`，新增 `sessions/{id}/teaching` 的規則。積分及標記使用 transaction；離線時操作停用。重連不重播超過 10 秒的播放指令。Pointer 拖曳最多約每秒 5 次寫入，按住不動每秒約 1 次。

標記在學生投影上可見；私人教學提示繼續使用 Speaker Notes。

## localhost QR code 修正

開發模式會在啟動 Vite 時讀取 Mac 的 LAN IPv4；即使用 localhost 開始課堂，Presentation／Controller 及 QR code 也改用 LAN IP，保留實際 port。Mac 與 iPad 需同一 Wi-Fi。換網絡後重啟伺服器並重新建立課堂，讓 IP 更新。Production build 不包含 Mac 的 LAN IP。

## P3 · Pitter Patter 接入（V10）

啟動頁預設選取 P3 的 16 頁教材；原有六頁示範仍可選取，舊課堂依自己的 presentationId 載入。

- 來源：Desktop/Supported documents/3D_Music_Slides，原始教材未修改。
- 學生內容與共用互動模組：src/presentations/pitter。
- 圖片及 Bravura 字型：public/media/3d-music/assets。
- 教師筆記由 ControllerPanel 按 slide ID 載入獨立的 controller-notes chunk；學生投影不載入或渲染筆記。此模式不是敏感資料的權限保護，筆記仍是可取得的前端資產。
- 第 12 頁：教師面板「播放／重播橙色連線」控制學生投影的旋律動畫。超過 10 秒的指令不重播。
- 第 2、14 頁：媒體設定自動填入對應歌曲路徑。請展開「此頁音訊／影片」，補齊錄音後按「將媒體加入此頁」。
- 《採桑曲》：public/media/3d-music/assets/media/cai-sang-qu.mp3。
- Pitter Patter：public/media/3d-music/assets/media/pitter-patter.mp3。
- 目前這兩個錄音尚未提供，不能視為歌曲播放已完成。
- 第 16 頁保留 Air Recorder 的公開連結，需在投影電腦點擊以開新分頁。
- Firestore Rules 同時支援示範六頁及 P3 十六頁，頁碼、Pointer、標記、媒體、feedback 和 action 文件限制依課堂教材判斷。

本次接入是本機版本；GitHub Pages／其他公開 HTTPS 部署尚未進行。手機與 Mac 若受校內 Wi-Fi 裝置隔離限制，本機 QR code 仍可能無法連線。

## P5 · 中國樂器與音色
新增 10 頁教材選項。教師「此頁教學互動」可操作先聽後看、投票、聆聽證據、樂器揭示與音色多選；換頁後返回保留各頁的共享狀態。沿用 Pointer、標記、小組總分及媒體面板。YouTube 來源已填入，須按「將媒體加入此頁」才啟用；曲目未聽核截段，不能當作預選示範。比較頁可選三種樂器逐一重聽。

`/preview/p5` 是單機排版／互動預覽；正式跨裝置操作須從 /start 選教材建立課堂。
P5 與 interaction 文件規則已於使用者批准後發布，實際 Firebase 兩瀏覽器同步已通過。當前驗證結果見 VALIDATION.md，教學依據與驗收條件見 P5_INTEGRATION_PLAN.md。

## P5 重建版（2026-10-14）

10 個教學頁依次為：四類複習、學習重點、琵琶與音色、十面埋伏分析、箏與音色、漁舟唱晚分析、二胡與音色、戰馬奔騰分析、比較、離堂檢視。
先提供名稱及課本音色選項，再聆聽。分析沿用課本第19–21頁題目及選項；箏可切換「開始／後半段」。圖片是課堂延伸插圖，並非課本原圖。教師參考答案只在教師備註顯示。
每輪教師端有 YouTube 播放／暫停和原站連結，投影亦有原站連結。實際聲音由投影電腦播放；YouTube 是否允許嵌入由影片來源決定。
重建後請開始新課堂，避免沿用舊課堂按頁儲存的互動及媒體狀態。Firestore schema 和規則沒有改動，網站仍由本機 Vite 提供，未發布 Firebase Hosting。
