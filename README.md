# 日語複習網站（できる日本語 初級）

初級日語的複習網站：五十音＋第1–5課（2026/10/08–10/28）。
純靜態 HTML／CSS／JS，沒有 build 步驟，用 GitHub Pages 直接發布。唯一的外部資源是 Google Fonts（Noto Sans JP／Noto Sans TC）。

## 功能

- 每一句日語一列：▶ 播放｜複製｜日語｜羅馬拼音｜中文。對話有「播放整段」「複製整段」。
- 單字拆成假名格子，一格一拍（小 ゃゅょ 併入前一格；ん、っ、ー 各佔一格）。
- 上方工具列：拼音開關（整站記住）、語速 1.0／0.75、🎧 跟讀模式、停止。
- 跟讀模式：中文提示（zh-TW 語音）→ 日語 → 停 3 秒 → 日語再一次；最後小測驗：中文出題 → 停 5 秒 → 念答案。可以選「全部」或某一節。
- 每課 6–8 個小遊戲；總考試 20 題（三條命、聽力題、錯題一鍵複製）。
- 發音用瀏覽器內建的 Web Speech API（ja-JP），手機上建議用 Chrome 或 Safari。

## 檔案結構

```
index.html        首頁：所有頁面、每天 15 分鐘、每日課堂列表
kana.html         五十音：平假名、片假名（記法漢字）、六條規則、相似片假名
lesson1.html      第1課 はじめまして：XはYです、自我介紹、4·7·9、日期、年齡
lesson2.html      第2課 買い物・食事：こそあど、樓層和價錢、〜をください、〜つ、の
lesson3.html      第3課 時間・曜日：曜日、時・分、から〜まで、拍
ichinichi.html    10/20 私の1日：〜ます、助詞、どこへも／何も
lesson4.html      第4課 私の国・町：方位、どのくらい、形容詞、否定、あります、に／で、發表
review.html       總複習：助詞總表、最常錯的 12 句、自測 12 題
exam.html         總考試：20 題
notes/            每日課堂整理（Markdown，notes/YYYY-MM-DD.md）；目前有 2026-10-27、2026-10-28
days/             每日課堂頁面（days/YYYY-MM-DD.html），TEMPLATE.html 是範本；目前有 2026-10-27、2026-10-28
assets/style.css  共用樣式（淺色背景、手機 16px 邊距、不橫向捲動）
assets/common.js  共用 JS：say()、複製、拼音開關、跟讀模式、導覽列、小遊戲 G.*
```

## 內容怎麼寫（不用寫 JS）

在 HTML 裡用下面的區塊，`common.js` 會自動變成可播放的列。欄位用 `|` 分開，一行一筆：

```html
<!-- 句子：日語 | 羅馬拼音 | 中文 | 選項（sp=說話人;say=念法） -->
<div class="rows">
私は学生です。 | watashi wa gakusei desu. | 我是學生。
4時です。 | yoji desu. | 4 點。 | say=よじです。
</div>

<!-- 對話：加 dlg，會多出「播放整段」「複製整段」 -->
<div class="rows dlg">
これはいくらですか。 | kore wa ikura desuka. | 這個多少錢？ | sp=客人
</div>

<!-- 單字（假名格子）：假名 | 漢字 | 羅馬拼音 | 中文 | 記法 -->
<div class="vocab">
がっこう | 学校 | gakkou | 學校 | っ 停一拍
</div>

<!-- 小卡片：標籤 | 假名 | 羅馬拼音 | 備註 | 1（標紅） -->
<div class="cards">
4日 | よっか | yokka | | 1
</div>
```

任何元素加上 `data-say="よっか"` 就能點來聽。`<h2 id="...">` 會自動出現在頁面上方的目錄；包在 `<section>` 裡的句子，跟讀模式可以單獨選那一節。

小遊戲（寫在頁面最後的 `window.pageInit` 裡）：

```js
G.mcq('#g1', '標題', '說明', [{ q: '題目', o: ['選項'], a: '正解', say: '聽力題要念的日語', sa: '答完念', ex: '解說' }], { n: 10 });
G.order('#g2', '排句子', '說明', [{ zh: '中文', t: ['私は', '学生', 'です。'], x: ['干擾'], ro: 'romaji' }]);
G.count('#g3', '數拍', '說明', [{ k: 'がっこう', ro: 'gakkou', zh: '學校' }]);
G.flip('#g4', '反義詞翻牌', '說明', [['大きい', 'ookii', '小さい', 'chiisai', '大', '小']]);
G.guess('#g5', '看圖猜詞', '說明', [{ e: '☕', ja: 'コーヒー', ro: 'ko-hi-', zh: '咖啡' }]);
G.exam('#exam', [ /* 和 mcq 一樣的題目，三條命 */ ]);
```

## 新增一天的課堂頁

1. 複製 `days/TEMPLATE.html`，改名成 `days/2026-10-27.html`（日期照實際）。
2. 改標題和內容。注意這一層的路徑是 `../assets/...`（範本已經寫好）。
3. 打開 `assets/common.js`，在最上面的 `DAYS` 加一行：
   ```js
   var DAYS = [
     { date: '2026-10-27', title: '第5課 …', desc: '一句話重點' },
   ];
   ```
   首頁的「每日課堂」就會自動出現這一天。
4. 每頁最後保留：今天的重點、複習提醒（作業／小考）、15 分鐘複習法。
5. `git add . && git commit -m "add 2026-10-27" && git push`，GitHub Pages 約 1 分鐘後更新。

## 羅馬拼音規則

- 助詞 は／へ／を 寫 wa／e／o；助詞和 です 分開寫：watashi no machi wa midori ga ooi desu。
- 長音ー 寫 `-`：ko-hi-；否定寫 ookiku nai desu、kirei ja arimasen。
- ん 在母音或 y 前寫 n'：kin'youbi；っ 重複下一個子音：gakkou、kitte。

## 隱私

這是公開的 repo。自我介紹用 〇〇 代替個人資料（名字、生日、星座、年齡），不放同學名字。課本內容只供個人學習使用。
