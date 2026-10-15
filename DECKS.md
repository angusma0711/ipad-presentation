# 新增或修改簡報

每份簡報是 `src/presentations/` 內的一個資料夾。資料夾名稱就是簡報 ID（只可用小楷英文、數字及 `-`）。不需要改任何程式碼或 Firestore Rules。

## 新增簡報

1. 複製 `src/presentations/_template`，改名，例如 `p4-rhythm`。
2. 修改資料夾內的 `deck.json`。
3. 把圖片和錄音放入 `public/media/p4-rhythm/`，並把 `assetBase` 設為 `/media/p4-rhythm/`。
4. 本機執行 `npm run check`（或 `pnpm check`）檢查格式和檔案。
5. 開 `/preview/p4-rhythm` 預覽（不需 Firebase）。
6. Commit 並 push 到 GitHub，網站會自動建置及發布。

以 `_` 開頭的資料夾（例如 `_template`）不會出現在網站。

## deck.json

```json
{
  "title": "P4 · 節奏遊戲",
  "order": 3,
  "assetBase": "/media/p4-rhythm/",
  "slides": [
    {
      "id": "cover",
      "title": "封面",
      "notes": "只在 iPad 顯示的教師筆記。",
      "html": "<h1>節奏遊戲</h1><img src=\"./images/drum.jpg\" alt=\"鼓\">",
      "media": [{ "kind": "audio", "src": "./audio/beat.mp3" }],
      "actions": []
    }
  ]
}
```

| 欄位 | 說明 |
|---|---|
| `title` | 開始頁選單顯示的名稱 |
| `order` | 選單排序，小的排先 |
| `assetBase` | 媒體資料夾；`./` 開頭的路徑以此為起點 |
| `htmlClass` | （可選）包住投影片 HTML 的 class，配合 `styles.css` |
| `slides[].id` | 每張投影片獨一無二的 ID；建立後不要改，否則該頁的標記和互動會遺失 |
| `slides[].title` | iPad 顯示的標題 |
| `slides[].notes` | 教師筆記，只在 iPad 顯示（注意：網站檔案可被下載，不要放私人資料） |
| `slides[].html` | 投影片內容 |
| `slides[].media` | 此頁教材媒體：`audio`、`video`（`./` 或 `/media/` 路徑）或 `youtube`（11 位影片 ID）。iPad 會顯示「播放」按鈕，由投影電腦播放 |
| `slides[].actions` | （可選）iPad 按鈕：`{"id":"draw-contour","label":"播放動畫"}` 會在投影頁按下 `data-action="draw-contour"` 的元素 |

## 進階

- `styles.css`：放在簡報資料夾內，載入該簡報時套用。請用 `htmlClass` 限定範圍，以免影響其他簡報。
- `plugin.tsx`：需要特別互動時才使用，例如 P5 的自訂版面與 iPad 互動按鈕。見 `p5-chinese-instruments/plugin.tsx` 及 `src/presentations/types.ts`。

## 檢查

`npm run check` 會：

- 格式錯誤（缺少 title、ID 重複、媒體格式錯）→ 停止建置；
- 找不到圖片或錄音 → 只顯示 ⚠️ 提示，仍可發布。
