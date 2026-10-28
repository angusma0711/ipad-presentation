# P3 第三課 V3：音樂怎樣配合畫面？

以 Angus 提供的14頁 Slide_Preview.pdf 為版面底稿，按《3D_29:10 V3.docx》接入教學互動。原第11頁後新增六步任務圖解，合共15頁。舊PDF、其他草稿不變。

## 教師控制器

在「此頁功能」操作：

- 第3、4頁：播放／重播／暫停蕭邦《降D大調圓舞曲》Op.64 No.1。此公開授權演奏約2分鐘，非課本錄音，並非一定只有一分鐘。
- 第5、6頁：只看天鵝照片、聖桑《天鵝》開首30秒、德布西《月光》開首30秒、暫停。這是經Angus確認的照片替代方案，不是課本天鵝影片。不同錄音不適合把音量數值當作演奏力度的精確比較。
- 第9、10頁：PDF上的Music Maker字樣加上真正按鈕；也可用控制器開啟、選擇速度／力度／五種樂器／風格、試聽30秒、停止、返回。
- 第12頁：六步圖解——看清楚、試一試、一起決定、排練、展示15–30秒、聽回饋。學生一人操作、一人記錄、每人參與；加分挑戰可選。
- 第15頁（原14頁）：可開啟Music Maker及執行慢／弱／鈴鐘／飄浮的15秒手勢檢查。

Music Maker 首次必須在投影電腦按App「開始」載入樂器並啟用音訊，不能以遠端指令繞過瀏覽器音訊政策。控制器只顯示預覽提示，不會再開一個自動發聲的iframe。若在學生iPad獨立開App，該iPad也須按開始。

## 素材及授權

三首MP3為Wikimedia提供的轉碼版本；演奏者、來源及授權詳列 `public/media/p3-lesson3-v3-pdf/audio/credits.json` 及 `CREDITS.txt`。天鵝／月光原檔完整保存，30秒限制只在播放時套用。

內嵌Music Maker源於本機已修改的Music Maker，加入固定命令橋接、離頁停止；沒有上傳／播放廣告影片，沒有學生帳號或學生資料上傳。Tone.js及樂器samples的原有授權保留於vendor，各.md授權另存.txt以供Pages部署保留。

這不是Windows remote-control功能；只控制本課自己的瀏覽器播放器及同源內嵌App。沿用原有課堂action/feedback，不增加後端或改Firestore Rules。

## 驗證範圍

TypeScript及production build由發布流程檢查。實際音量、iPad/Safari音訊啟用、跨裝置試聽及停止仍需在上課設備驗收。沒有把播放器建立成功當作有聲音。

## 學生開啟 Music Maker

第12頁六步小組任務旁新增 Music Maker QR code，可掃描或點擊開啟 https://angusma0711.github.io/music-maker/ 。QR code 保留四格白邊，不使用外部 QR 服務；原有15頁次序及六步活動不變。
