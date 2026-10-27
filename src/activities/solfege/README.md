# 唱名解鎖

現有 React 19 / Vite 7 i-board 活動，路徑 `/activities/solfege`，首頁有入口。單機投影操作；活動不使用 Firebase、登入、學生資料或跨裝置同步。沿用原有導航、按鈕及 FullscreenButton，其他簡報／控制器／資料規則未改動。

## 啟動

專案根目錄執行 `npm install`（首次需要）及 `npm run dev`，開啟終端顯示網址的 `/activities/solfege`。這部 Mac 可雙擊根目錄 `start.command`，開啟 `http://localhost:5174/activities/solfege`。終端須保持開啟。本次預覽另在 `http://127.0.0.1:5186/activities/solfege` 運行。

## 原圖核對

來源：使用者提供的 IMG_5634.jpeg，小二上學期音樂科考試範圍第 3 項。原圖只在本機保留，不包含於公開 repository 或網站。

1000 × 320 SVG，按原圖的相對位置等比例重建，沒有重現攝影透視傾斜：

| 元素 | SVG y | 對應原圖 |
| --- | --- | --- |
| 上線 | 150 | mi 穿過的線 |
| 下線 | 230 | do 下方的線 |
| do | 190 | 兩線正中間 |
| mi | 150 | 上線 |
| sol | 110 | 上線上方半個線距 |
| d 定位 | 190 | 左端空心橢圓內的 d，位於兩線間 |

空心橢圓無符桿，無譜號、加線或固定答案顏色。d 的文字與「定位」小標識別它，與右方作答音符區分。原圖只在第一個橢圓內印 d，其餘兩個未印唱名；mi/sol 依使用者指定的 do/mi/sol 範圍與該二線譜逐級位置判讀。

`Solfege`（唱名）、`STAFF_MAPPING`（譜面座標）、`REFERENCE_MIDI`（參考音高）獨立。預設 C4/E4/G4 不影響譜面位置。

## 音色與遊戲視覺

使用真鋼琴錄音取樣：Versilian Studios / VSCO 2，經 tonejs-instruments 提供（CC BY 3.0）。從本機 music-maker 專案取出 A3、C4、D#4、F#4、A4、C5 六個原始 MP3，逐一核對 SHA-256，合共約 1.15 MB；隨 Vite 打包，不依賴外部音訊服務。來源與授權見 `assets/piano/CREDITS.md`、`manifest.json`，教師設定亦有 attribution。

Web Audio 解碼並快取錄音，使用最近音高的取樣配合 playbackRate 移調、峰值標準化和短起音／收音包絡。移除了泛音合成器，載入失敗時顯示提示，不偷偷改回合成音。錄音全部準備好才排程；若等待期間重試、重播、換題或離開，generation token 會取消舊播放。

只在點擊建立／resume AudioContext；先起音、學生歌唱，再手動播放答案。各音等長，慢速 1.05 秒／正常 0.72 秒一音，音長為間隔的 84%，尾端留短空隙。高亮共用 AudioContext 時鐘。重播／換題／重試／重設／改調或速度／隱藏頁面／離開活動皆停止聲音及動畫；generation token 避免過期 resume 重啟。

美術參考使用者本機專案 `Running Singing game`：閱讀 Sing & Run v1.0 README、v0.9 ART-DIRECTION 並檢視背景。沿用暖金、青綠、奶油白與旋律大道背景；`assets/boulevard.webp` 複用該專案 `prototype-v0.9/assets/boulevard.webp`（約 39 KB）。六站音符跑道、戴耳機的小跑手、終點鎖及徽章為本活動 SVG。小跑手在收集時跑步前進，完成六站舉手；重試不前進。只在教師完成題目後前進，支持 reduced-motion。沒有引入咪高峰、碰撞、生命值或自動跑動。

## 2026-10-27 驗證

- TypeScript `tsc -b`、Vite production build 通過。
- 現有 5 份簡報 check-decks 通過；既有兩首歌曲缺檔仍產生 4 個提示，非本次新增問題。
- 1,000 輪抽題檢查：6 題、只含 do/mi/sol、階段音數正確、相鄰題目不完全相同。
- Chromium 實際操作：開始無自動音訊、顯示／隱藏、重試保持題目且隱藏答案、同事件連按三次只收集一次、手動換題、六題完成、四音最後挑戰、重設歸零、組別文字修改、首頁往返。
- SVG DOM 與原圖目視核對：恰好兩條線、do/mi/sol/do 的 y=190/150/110/190、d y=190、空心音符、對應唱名。
- 原生 AudioBufferSource 排程測試：起音一音、三音答案、正常／慢速等間隔、逐音高亮、重播停止舊音、重試清除高亮、離開停止全部音訊。+2 半音的 do 使用 D#4 錄音下移一個半音；已驗證 playbackRate、真錄音長度及正常／慢速排程。另延遲取樣請求、按重試後放行，確認不會播放過期音訊。
- 刻意移除 Web Audio：出現簡短提示，仍可完成六題及最後挑戰。
- 1280×720、1920×1080、1024×768 無文件水平／垂直捲動；390×844 無水平捲動。桌面及手機正式譜面截圖已目視檢查。

重跑：Vite 啟動於 5186 port，安裝 playwright 後執行 `node scripts/verify-solfege.cjs`；可用 `PLAYWRIGHT_MODULE` 指定 Playwright 安裝路徑。測試輸出 `solfege-1280.png` 等截圖。

尚未實測：實體 Safari/iPad 音訊啟用、觸控及全螢幕、真實揚聲器的錄音播放音量／輸出延遲、真實課堂學生歌唱、其他教材完整回歸及 Firebase 雙裝置操作。Chromium headless 的音訊排程及波形通過不等於真人聽音驗證。

依使用者標註，已移除開始頁的「只練習 do、mi、sol…」及「教師控制 · 不限時 · 不扣分」兩段文字。

## 投影角色放大更新

角色改用使用者 Running Singing game 既有插畫素材（來源見 `assets/runner/SOURCE.md`），並非新生成的 Higgsfield 圖像。Higgsfield 本次請求因「Requires basic plan or higher」遭拒，未建立生成工作。

取代小型 SVG 人形，以四張跑步姿勢每 110ms 輪替；每次完成題目移動 1.4 秒，到站停下，六站完成後換慶祝姿勢。角色可見高度約為原先三倍，並預載六張本機 PNG；reduced-motion 模式直接到站。跑道增高，另調整 1024×768 版面以保持主要操作不用捲動。

## 單一場景投影版

移除跑道及譜面兩個卡片背景、邊框與陰影；全頁共用旋律大道背景。跑道改為 CSS 全寬定位，避免 SVG 等比例縮放造成左右留白，實際跑道約佔視窗 79%。角色圖框最低 220px 高（透明留白後可見約 176px），手機為 208px 圖框。譜面保留相同座標，僅將 viewBox 裁至 y=75–320，減少上方留白及放大音符。教師控制按鈕仍有實色背景。

已驗證四格換幀、1.4 秒到站停止、六題完整流程及 1280×720 / 1920×1080 / 1024×768 / 390×844 排版。
