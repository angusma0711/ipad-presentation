# I-board Windows 電腦控制 — 本機 MVP

## 狀態與架構

本機開發版，尚未發布網站或 Firestore Rules。這是固定按鈕遙控，不包含桌面串流、滑鼠或任意鍵盤輸入。

教師控制器 → Firebase Auth / Firestore → 可見的 Windows WPF 接收程式 → Windows API。

控制器位於「額外功能 · Windows 電腦控制」，預設收起。接收程式僅透過 outbound HTTPS 連線，不需要開啟路由器 port。不同網絡需雙方可連線 Firebase；學校網絡實測尚未完成。

## 簡短操作指南

1. 取得學校 IT 對該 Windows 電腦及 portable 程式的批准。未批准前不要執行。
2. 在獲批准的 Windows x64 電腦啟動接收程式，確認執行許可。
3. 在接收程式輸入 Firebase project ID 及對應 Web API key；只留本次記憶體，不儲存。不要貼到聊天、文件或截圖。
4. 本機選擇 Chrome、PDF/HTML/EPUB 電子課本，設定固定 YouTube HTTPS 網址，以及三個唯一視窗標題關鍵字。設定不會上傳。
5. 按「產生配對碼」。在 iPad 教師控制器展開額外功能，輸入完整64字元配對碼；5分鐘有效。可在電腦複製後以獲批准方式輸入 iPad；本版本沒有跨裝置剪貼簿或 QR。
6. 核對兩端8位確認號碼一致，在 Windows 按「允許控制」。確認號碼不是配對憑證。
7. 用固定按鈕切換／開啟教學程式、播放暫停及調節音量。查看完成結果；「已接收」不代表操作完成。
8. 暫停時按電腦「停止遙控」；結束時「解除配對」並關閉程式。關閉即停止本機接收。每次程式啟動及1小時到期後須重新配對。

## 建置及 portable package

使用 .NET 10 SDK（WPF、Windows x64）。目標以受支援的 Windows 11 x64 為先；學校的實際 Windows 版本、SmartScreen、AppLocker、權限及媒體支援尚待確認。不要繞過學校限制。

在本資料夾執行：

```text
dotnet publish IBoard.Companion.csproj -c Release -r win-x64 --self-contained true -o artifacts/win-x64
```

輸出 `artifacts/win-x64/IBoard.Companion.exe`；交付時把整個輸出資料夾壓縮。Self-contained 包含 .NET runtime，不代表可繞過 IT 政策或保證毋須管理員權限。未做 code signing，不能稱為已驗證安全／已獲學校批准。macOS 上交叉編譯不等於 Windows 執行測試。不要啟用 trimming。

建置時需下載 Microsoft targeting/runtime packs。此專案沒有額外 NuGet 應用程式套件。正式可重現發行應在批准的 build machine 記錄確切 SDK / runtime patch，並先完成下列驗收。

## 雲端設定（待批准發布）

沿用現有 Firebase 專案，啟用 Anonymous Authentication 及預設 Firestore；保留現有課堂規則，合併 repo 的 `firestore.rules`。新 collection：`remoteDevices/{opaqueDeviceId}`，命令固定於 `commands/current`。不需要 Cloud Functions、service account 私鑰、新 Hosting 或付費升級。

既有前端設定名稱：

- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

不新增 GitHub secret。接收程式使用對應 project ID / Web API key 與獨立匿名 UID，ID/refresh tokens 僅在記憶體。若專案強制 App Check 或限制 API key client，需另行評估原生 client 相容性，不應關閉保護作為測試捷徑。

## 授權與操作語意

- 32 bytes 隨機配對碼，SHA-256 後作 opaque record locator；原碼不進 URL、不保存、不輸出到 log。只有電腦明確允許的 controller UID 可發命令，課堂碼不授予 OS 控制。
- 單次 claim、5分鐘 redemption、1小時控制期限；解除後舊紀錄不可重新啟用。接收程式每次啟動產生新匿名身份及配對碼。
- 固定 action 白名單，cloud message 不接受路徑、URL、shell 或自訂參數。本機檔案內容、桌面、clipboard、按鍵紀錄不會上傳。
- 一次一項指令，10秒有效，Rules 接受1–15秒時間窗；issue / ack 採 server timestamps。接收端參考 HTTPS server time，再檢查 expiry、identity、allowAfter。
- 執行前以 updateTime precondition 接收指令，再核對最新允許狀態；本機記錄已處理 ID。網絡不確定、斷線及重連會停止本機控制，須電腦重新允許；不自動重試操作。此機制不保證 exactly-once；若 OS 操作後 ack 失敗，結果可能未知，應先查看電腦。
- 「停止」立即禁止後續本機執行，即使雲端失敗亦然。已送交 OS 的操作不能撤回。關閉程式後 iPad 可能需最多約12秒 heartbeat timeout 才顯示離線。
- 接收程式每2秒輪詢，5秒 heartbeat；通常有秒級延遲，這不是低延遲 remote desktop。
- 開啟 Chrome／課本只回報已要求啟動；不保證已置前。視窗標題必須唯一，Windows 可拒絕前景切換。
- 播放／暫停為 Windows media key，可能作用於其他 active media session，不保證特定 YouTube 分頁。音量按鍵每次一步，由 Windows 控制步幅與上下限；不讀取或聲稱精確音量百分比。
- 不關閉 Chrome，不終止其他程式，不保存 unattended access。

## 免費額度與限制

Firestore 官方免費額度：每日50,000 reads、20,000 writes、20,000 deletes、1 GiB 儲存、每月10 GiB outbound；由整個專案共用。超出免費額度需要啟用 billing 才能增加用量，不應假設無限免費。

估計每個接收端每小時約3,600個 document GET、最多720個 heartbeat writes，另加命令、listeners 及 Rules dependent reads；實際以 Firebase Usage 為準。不要整天開啟，也不要未批准便升級 Blaze。舊配對紀錄不會自動刪除；它們過期後不能發出可執行指令，但需在後續維護清理。

## 驗證紀錄與 Windows 驗收

Mac 本機：TypeScript 檢查及 Vite production bundle 通過；瀏覽器預覽確認面板預設收起、配對輸入隱藏、空值時不能提交。既有課堂 Rules 區塊保留，remote controls 只加到 general teacher tools。這不等於所有教學功能已完成 runtime regression。

尚未完成：Firestore emulator Rules 編譯／授權測試（本機缺 Java runtime）、Windows 實際執行、iPad-to-Windows 配對、不同網絡驗證。正式發布前必須完成，不能把 source review 當作安全測試通過。

Windows 批准後，使用可丟棄教學視窗逐項測試：未配對／錯 UID／錯 target／malformed／過期不得執行；5分鐘配對到期；允許及撤銷；Chrome、YouTube、課本及返回簡報；media 實際作用範圍；音量上下限；duplicate 不重播；斷線及重連不重播；停止／退出即停止；接收不等於完成；不同網絡；既有換頁、積分、timer、pointer、drawing 及媒體回歸。

## 官方參考

- https://firebase.google.com/docs/firestore/quotas
- https://firebase.google.com/docs/reference/rest/auth
- https://firebase.google.com/docs/firestore/use-rest-api
- https://learn.microsoft.com/en-us/dotnet/core/deploying/single-file/overview
- https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setforegroundwindow
- https://dotnet.microsoft.com/en-us/platform/support/policy

未經 Angus 明確批准，不 publish、部署 Rules、commit 或 push。
