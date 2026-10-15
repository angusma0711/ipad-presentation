# P5 接入與教學改善

## 現況（2026-10-13）
來源教材：../P5_Interactive_Music，10 頁，含三輪情境選擇、樂器揭示、多選音色、比較及離堂檢視。
現有 registry 支援 demo 與 P3；P5 尚未註冊。現有 Firestore rules 只容許兩個教材 ID。
既有 action 文件只有 draw-contour，不能直接表達 P5 的持續頁內狀態。

## 教學設計依据與落實
- IES：以主動回憶促進學習；四大類複習先提問，再揭示方法與例子，避免學生只讀答案。
- IES：圖片與語言解說結合；情境與真實樂器圖片保留，教師口述解釋，不增加長段文字。
- Cambridge multimedia learning：排除無關內容、用提示突出必要資訊；保留一頁一任務及分階段揭示，教師 notes 不進入投影 DOM。
- 聆聽 assessment：A/B/C 選擇必須附可聽證據；情境解讀不設固定唯一答案。音色按教材三個選項多選。
來源： https://ies.ed.gov/ncee/wwc/PracticeGuide/1
來源： https://assets.cambridge.org/97811076/10316/excerpt/9781107610316_excerpt.pdf
上述原則支持設計方向；不能據此宣稱此簡報已實證提升學生學習成效。

## 完成條件
1. registry 新增 P5 可選教材，不改 P3／demo 預設及既有課堂。
2. 保留最新 10 頁內容、配色、圖片放大、句式、音色選项。
3. Controller 同步頁內揭示階段、A/B/C、音色多選，重連呈現最新狀態；獨立 command 不可代替持續狀態。
4. 既有 Pointer、每頁標記、四組總分、音訊／影片與 feedback 在 P5 可用。
5. notes 以獨立 controller chunk 載入，學生投影不載入／渲染。
6. rules 支援 P5 10 頁及頁內狀態，拒絕越界／非法欄位，不弱化既有權限。
7. build、兩瀏覽器控制／投影同步、斷線重連、notes DOM、標記／積分／媒體測試；實機 iPad 觸控驗收與瀏覽器模擬分開記錄。
8. YouTube 被禁止嵌入及 autoplay 阻擋須有實際 fallback；無授權本機曲目不可宣稱音樂已聽核。

## 實作方向
沿用 React PresentationView 與現有 Firestore teaching 子文件。P5 student 元件採同一份已確認內容資料，頁內狀態由新的每頁 interaction 文件保存；Controller 顯示情境階段和多選音色工具。媒體由現有 MediaPlayer 單一控制，不在預覽播放。
原始 HTML 保持獨立可用；接入所需改動與教學改動同步記錄，避免複製版本漂移。

## 當前狀態
註冊、React 呈現、Controller 互動、持續狀態 service／hook、notes 分離、YouTube 來源與 fallback、本機 rules 已實作。40 個版面狀態通過。使用者已明確批准，Firestore 規則發布成功，實際 Firebase 兩瀏覽器同步驗證已通過；實機 iPad／校內 Wi-Fi 仍需驗收。
