# V1 本機驗證紀錄

日期：2026-10-05（香港）。依使用者確認，先完成本機專案和設定指南，尚未建立 Firebase。

## 已通過

- TypeScript：tsc -b，exit code 0。
- Production：Vite build 成功，69 modules，輸出 dist/。JS 822.41 kB，gzip 251.84 kB；有 bundle size warning，沒有 build error。
- Vite dev server 成功啟動 http://localhost:5173。
- 實際瀏覽器 /start 正常顯示；按建立課堂，在缺少設定時顯示清楚錯誤並恢復按鈕。
- /present/DEMOAA 本機示範：缺少 Firebase 時保持第一張可見。
- 實際鍵盤：Left 在第一張保持 1/6；Right 到 2/6；Space 到 3/6；連續 Right 到 6/6，額外 Right 保持 6/6；Left 回到 5/6。
- 投影頁只渲染學生內容，瀏覽器 accessibility tree 沒有 Speaker Notes。
- /control/DEMOAA（無效代碼含 O）顯示 Session not found。
- /control/ABC234（格式有效、Firebase 未設定）顯示 Offline、設定錯誤、停用導航及教師筆記，沒有崩潰。
- 控制頁 viewport 768×1024：無橫向溢出；導航按鈕 52–52.5px 高。
- 390×844 手機：無橫向溢出；所有按鈕至少 52px 高。
- 1024×768 橫向：無橫向溢出。
- 投影頁 console error log：空。

控制器畫面見 controller-ipad.png。這是未設定 Firebase 的狀態，不代表已連線。

## 尚未驗證

- Firebase Anonymous Authentication、session creation、collision retry、QR code 實際生成和掃描。
- Mac／iPad Firestore 雙向同步、控制器 Next／Previous／直接跳頁。
- 真實斷線與自動重連、同時導航時 transaction 衝突處理。
- Security Rules 在 Firebase 的部署及拒絕非法讀寫。
- 真實 iPad Safari 操作、QR code 相機掃描。

這些項目必須在 Firebase 設定完成後按 README 清單驗收；目前不能宣稱完整 V1 已通過驗收。

## 執行環境備註

此環境沒有系統 npm，使用 bundled Node 和 pnpm 安裝。初次下載 Firebase 套件逾時，延長 fetch timeout 後完成下載。pnpm 報告跳過三個 dependency build scripts；已直接使用安裝的 TypeScript／Vite executable 完成 typecheck、production build 和 dev server 驗證。一般安裝 Node/npm 的電腦可按 README 使用 npm scripts。

## Firebase 實際驗證更新（2026-10-05）

已在使用者確認後完成：
- Firebase 專案：block-practice。
- Anonymous Authentication Enabled。
- Standard edition、(default) Firestore database，region asia-east2（香港）。
- 已發布本專案 firestore.rules。
- .env.local 已配置；此檔受 .gitignore 排除。

Safari 真實 Firestore session QRSX2Z：
- 成功建立課堂及 QR code。
- Controller 顯示 Connected，Next 1 → 2，投影同步到 2。
- 投影鍵盤 Right 2 → 3，Controller 同步到 3，筆記更新。
- Controller Previous 3 → 2。
- 直接選擇 slide 5；投影及 Controller 顯示 5。
- 使用 Firebase 官方 disableNetwork 暫停 Controller 的 Firestore 網絡：顯示 Reconnecting、停用導航、保留 slide 5。
- Controller 斷線期間投影鍵盤 Left 將雲端切到 slide 4。
- enableNetwork 恢復後，沒有 refresh；Controller 自動顯示 Connected 及 slide 4，不重播舊導航。
- 此次測試是 Firestore SDK 網絡停用，沒有切斷電腦 Wi-Fi。真實 iPad Wi-Fi 斷線及相機掃碼仍需實機驗收。

Security Rules 測試：
- scripts/check-firebase-rules.mjs QRSX2Z 執行成功。
- 未登入讀取拒絕；匿名登入讀取允許。
- 列出 sessions 拒絕。
- currentSlide=99 拒絕。
- 修改 presentationId 拒絕。

發現及處理：
- 改用 authStateReady 等待還原既有匿名登入，避免每次開新頁面都重新登入。
- Codex 內建瀏覽器的 Firebase auth 請求 network-request-failed；Safari 真實連線測試成功。
- 測試使用 Safari 分頁；初次 SDK 連線與背景分頁更新有延遲，尚未量測真實 Mac／iPad 的延遲。

先前「尚未建立 Firebase」紀錄保留為初次本機測試歷史；本節為最新結果。
- Safari Connected 狀態下，slide 6 的 Next 停用；slide 1 的 Previous 停用。
- 暫時的 network-check UI 已移除。
- authStateReady 修正後再次通過 TypeScript 檢查。
- 最終 TypeScript 與 production build 再次通過，測試 UI 已移除。
- 已建立區域網絡試用課堂 2A9QJX；QR code 指向 http://192.168.5.52:5174/control/2A9QJX。
- Safari 保留該課堂的起始頁及 QR code，待使用者在實際 iPad 掃描。

## V2 狀態（2026-10-05）

已實作四組積分、教師預覽 Pointer、逐頁學生可見畫線／圈選、原生音訊／影片及 YouTube 遙控播放。

- TypeScript `tsc -b`：通過。
- Vite production build：通過，仍有 bundle 大小提示。
- `scripts/check-teaching.mjs`：媒體來源驗證、標記資料防護及預設積分通過。
- 內置瀏覽器課堂 `2A9QJX`：原有 root session 顯示 Connected，教師工具 UI 已載入。
- V2 Firestore listener：目前顯示 `Missing or insufficient permissions`。新的本機 rules 尚待發布；不能視為 V2 同步已通過。
- Safari native automation：重設工具後仍逾時；用戶確認 Mac 已解鎖。
- 新增 `scripts/check-teaching-firebase.mjs`，發布 rules 後可檢查真正 production service 的並發積分、逐頁標記、Pointer、媒體指令及規則拒絕行為。尚未執行。
- 真實雙裝置 Pointer、繪圖、音訊／影片播放及 YouTube：待 Rules 發布後驗收。


### V2 後續驗證完成（2026-10-05）

- Safari 已恢復操作，切換至 angusma0711 帳戶的 Block practice，Console 顯示 Rules Published success。
- `check-teaching-firebase.mjs` 全部通過。使用實際 production teachingService，驗證四次並發加分不遺失、改名、0 分下限、Pointer 跨 client 讀取、逐頁標記／復原／清除、媒體指令／feedback。負分、越界 Pointer、超量標記及外部音訊來源被 rules 拒絕。
- 原有 `check-firebase-rules.mjs QRSX2Z` 全部通過：未登入拒絕、登入可讀、不可列出課堂、越界 slide 及修改 presentationId 被拒絕。
- 瀏覽器實測 QRSX2Z：教師 +1 → 投影總分 1；投影 DOM 沒有教師加分 controls 和 Speaker Notes。
- 教師預覽拖曳畫線 → 投影 SVG polyline 1；換到第 2 頁為 0，返回第 1 頁恢復 1；復原後為 0。
- 音訊：示範 WAV metadata 8 秒，首次遠端播放被 autoplay policy 阻擋；投影按啟用音訊後 paused=false；教師暫停後 paused=true；重新播放成功。
- 本機 H.264 MP4：8 秒，教師播放後 paused=false，教師頁 feedback 播放中。
- YouTube：IFrame API 就緒，影片框載入；播放時 YouTube 顯示登入／機器人檢查，error 150 正確回報到教師頁。不能視為 YouTube 成功播放。
- Pointer 教師預覽拖曳流程及 backend 寫入已測；真實 iPad 按住 Pointer 的延遲、觸控和 classroom usability 仍需用戶實機試用。
- 瀏覽器 viewport override 未生效（實際仍 1280px），因此本次不宣稱真實 iPad 尺寸已驗收。
- 截圖：firebase-v2-rules.png。

- 最後 TypeScript 及 production build 通過；Safari 已建立新的乾淨課堂 AHBMZN，LAN QR code 在啟動頁供用戶試用。

### localhost QR 修正

localhost:5173/start 建立 R5PHWG，頁面顯示兩個連結均使用 192.168.5.52:5173。同一 control 變數同時供 QRCodeSVG 和控制連結使用。LAN 控制頁載入成功。TypeScript 通過。截圖 ipad-lan-fixed.png。iPad 跨裝置網絡可達性仍需實機確認。

## P3 V10 接入（2026-10-12）

- 保留六頁 demo-presentation，新增 g3d-pitter-patter-recorder-ag（16 頁），以課堂 presentationId 決定內容、頁數及導航限制。
- TypeScript 與 production build 通過；歌曲素材未提供。
- Firebase Console 已發布新 Rules；Firebase SDK 成功建立 P3 課堂 GYJLPU。
- 內置瀏覽器教師面板 Connected；直跳第 12 頁 → 投影 12/16，下行旋律譜和 Bravura 記號正確顯示。
- 教師「播放／重播橙色連線」→ 投影四句動畫完成，status 為「四句畫好了」，四條 pp-draw-line 的 strokeDashoffset 都為 0px。
- 教師直跳第 16 頁 → 投影 16/16，Air Recorder 連結保留正確網址；再回到封面。
- 教師 Notes 在控制頁出現，投影 DOM 未出現教師提示。
- 課堂建立首次在內置瀏覽器遇到 Firestore unavailable；改由 SDK 建立課堂成功。之後瀏覽器讀取、導航和 action 寫入已成功。
- 此次未重跑完整 V2 積分／繪圖／媒體驗收，也未完成真實 iPad 或學校 Wi-Fi 測試。
- 尚未部署 GitHub Pages／公開 HTTPS。當前伺服器 Network URL 為 http://10.82.129.57:5173，換網絡會變更。
- 截圖：p3-integrated-melody.png、p3-rules-published.png。

## P5 接入進度（2026-10-13）
- registry 已新增 p5-chinese-instruments，10 頁；保留 P3 預設與 demo。
- 內容、情境大圖、真實樂器照片、教材音色選項及證據句式已移植到 scoped React 元件。
- Controller 工具及 preview 共用 interaction 狀態；新增 interaction-{slide} listener／transaction 及本機 rules。
- P5 notes 以獨立 controller chunk 載入；student deck 無 notes 和 teacherAnswers。
- TypeScript 與 production build 通過；bundle 大小提示仍在。
- Playwright 本機驗證：複習揭示、情境展示、證據階段、琵琶音色多選通過，無 pageerror；三張渲染截圖見 qa/p5。
- 以上是本機驗證，尚未證明 Firebase 兩端同步。新版 rules 尚未發布／驗證，實際 iPad 未驗收。
- 本機預覽 /preview/p5 明確標示沒有跨裝置同步。

- 全部 10 頁 × 四種 viewport（805×763、1024×768、1366×768、1920×1080）共 40 個顯示狀態通過圖片載入與內容邊界檢查；見 qa/p5/layout-results.json。
- Firebase Console 已載入 Block practice 原有規則並準備 P5 草稿。點擊 Publish 被自動審批拒絕：持久安全規則變更需要明確批准。草稿未發布，尚無 P5 實際同步驗收。
- 補充本機整合驗證：實際 PresentationView 同時載入測試 WAV 與四組總分；投影 DOM 無 notes，互動階段切換不重建 audio／不重設 currentTime。修正音訊框裁切與遮蓋教學按鈕問題，將本機音訊改為底部細條並預留空間。此檢查沒有測 Firebase；測試 WAV 不是教材音樂。見 qa/p5/media-layout-results.json 及 audio-and-scores.png。

### P5 規則發布及 Firebase 驗證（2026-10-13）
使用者明確批准後，Firebase Console 已成功發布規則；建立 P5 課堂 HRZGJN。
- 實際 production service：互動文件保存、音色多選、非法選項／越界拒絕、並發積分、Pointer 跨 client 讀取、逐頁標記、undo／clear、媒體 command／feedback 通過。負分、越界 Pointer、超量標記、外部 audio 路徑拒絕。
- 獨立 Chromium 教師／投影 context：複習揭示、翻頁、情境 B 選擇、證據階段、總分、畫線／undo、音色選擇及投影 reload 恢復均通過。投影 DOM 無 Speaker Notes。結果見 qa/p5/sync-results.json。
- 先前瀏覽器 Connected timeout 是測試 selector 未包含狀態圓點；修正 selector 後成功。Node Pointer 測試補入 browser-only online 狀態和公開 projectId，未更改 production runtime 行為。
- 真實 iPad／學校 Wi-Fi 觸控與可達性仍未驗收；瀏覽器模擬不可視為實機測試。教材音樂沒有授權本機錄音／已聽核截段；測試 WAV／MP4 僅驗證播放機制。
- 最後瀏覽器驗證：Pointer 按住出現／放開消失；本機測試 WAV 和 MP4 的遠端播放、暫停、重播通過（投影端允許 native play 作瀏覽器啟用）。見 qa/p5/live-media-results.json。未宣稱 YouTube 實際曲目播放成功。
- 修正影片／YouTube 面板與積分並用時教材頂部裁切；補驗影片+積分版面無頂部裁切，最終 TypeScript／production build 通過。

## P5 教學流程調整（2026-10-14）
- P1 初始教材內容只有上方「複習中國樂器四大類」標題，iPad「揭示下一類」依序顯示四類，每次一類。沿用現有合法 phase／revisionRevealed 狀態，不修改 Firebase 規則。
- 真實 Firebase 教師／投影通過 0→1→2→3→4 揭示及 reload 恢復，四類後按鈕停用；結果見 qa/p5/revision-step-results.json。
- P2–9 保留版面，調整聆聽目標：以音色辨認樂器；情境圖片輔助氣氛及音樂元素的討論，不以氣氛直接辨認樂器。揭示答案前先口述猜想。
- 過渡按鈕縮短；40 個頁面／viewport 版面檢查再次通過，TypeScript／production build 通過。

## 2026-10-14 P5 教學流程重建
- 已直接核對課本印刷頁19–21：音色選項、琵琶音樂元素、箏兩段情境選項、二胡意境題。
- 72 個頁面／狀態與螢幕尺寸組合檢查通過，見 qa/p5/rebuilt-layout.json。
- 真實 Firestore 兩個獨立瀏覽器測試通過：四類逐項揭示、音色多選及重載保留、課本分析／情境／理由、箏前後段切換及重載、二胡意境圖片、YouTube 連結與遠端播放器設定。見 qa/p5/rebuilt-sync.json。
- TypeScript 和 Vite production build 通過。實體 iPad、學校網絡及 YouTube 實際可聽播放未驗證。
- PPT 為21張、可編輯文字與內嵌圖片，YouTube 為外部超連結。已逐張檢視渲染，package/layout/import檢查通過；未在 Microsoft PowerPoint 實機驗證。


## GitHub Pages publication — 2026-10-14

- Deployment: https://github.com/angusma0711/ipad-presentation/actions/runs/38517527788 — completed successfully.
- Public entry: https://angusma0711.github.io/ipad-presentation/ — Start UI loaded.
- P3 public image URL resolved under /ipad-presentation/media; naturalWidth > 0.
- Public controller GYJLPU displayed Connected, confirming Firebase listener access.
- In-app browser createSession failed with Firestore unavailable; REST navigation failed with Failed to fetch and reverted to confirmed page. This also occurred in local in-app browser earlier; Safari successfully created a local session then. Public Safari/iPad writes remain unverified.
- No billing upgrade performed. Firebase Hosting OAuth failed; GitHub Pages publishes the website, existing Firebase continues to provide synchronization.


## Fullscreen publication — 2026-10-14

- TypeScript and GitHub Pages build passed.
- Deployment run 38525348481 completed successfully.
- Public projector page displays the fullscreen button; clicking it changed the button to Exit, and clicking Exit returned it to Enter. Physical iPad fullscreen remains unverified.
- Google Doc link points to the public #/start route and includes fullscreen instructions.
