# 🎧 MBTI 音樂推薦系統

> 根據人格特質推薦音樂，支援 **AI 動態生成模式** 與 **經典靜態模式** 雙軌並行。

**線上展示：** [mbti-music-1.vercel.app](https://mbti-music-1.vercel.app)

**完整介紹：** [說明文件](https://drive.google.com/file/d/14DzfiZHM8SuIMVIpkHs1o6PVflTFlgoY/view?usp=drive_link)

---

## 🚀 系統概述

使用者完成 10 題情境式測驗，系統根據五維音樂特徵（valence、energy、danceability、tempo、acousticness）計算 MBTI 人格，並推薦最相符的歌曲。提供兩種模式：AI 引擎模式（Gemini 動態生成題目與分析）與經典模式（靜態題庫 + 本地計算）。

---

## 🧠 系統架構

```
使用者輸入（10 題）
      ↓
  quizOrchestrator
      ├── [AI 模式]  geminiService → 動態生成題目 / MBTI 分析
      └── [經典模式] quiz_bank.json → 靜態題庫（20 題隨機抽 10）
      ↓
  五維特徵平均值計算（musicMath.js）
      ↓
  analysisService
      ├── MBTI 類型推斷（energy / acousticness / valence / tempo）
      ├── 人格描述（musicPersona、summary、likes、dislikes）
      └── musicService → Cosine Similarity 歌曲匹配
      ↓
  結果頁面
      ├── MBTI 人格分析卡片
      ├── Spotify 嵌入播放器
      ├── 截圖匯出（html2canvas → JPG）
      └── 可分享連結（/share/:id via Supabase）
```

---

## 🛠 技術棧

| 層級 | 技術 |
|---|---|
| 前端 | React 19、React Router v7、Framer Motion |
| AI | Google Gemini 2.5 Flash |
| 資料庫 | Supabase（PostgreSQL）|
| 音樂 API | Spotify Embed API |
| 歌曲推薦 | Cosine Similarity（本地計算）|
| 截圖 | html2canvas |
| 部署 | Vercel（GitHub CI/CD）|

---

## ⚙️ 功能特色

- **雙模式切換** — AI 引擎模式（Gemini 動態題目）與經典模式（靜態題庫）
- **多語言歌曲庫** — 中文、英文、韓文三個 CSV 歌曲資料集
- **Cosine Similarity 推薦** — 基於五維特徵向量匹配最相符歌曲
- **Gemini API 備援機制** — 429 自動 retry（指數退避）、quota 耗盡自動換 key、503 直接 fallback 本地題庫
- **localStorage 快取** — 題目快取 30 分鐘，減少 API 呼叫
- **截圖分享卡** — 純文字隱藏卡片（繞過 iframe 跨域限制）
- **永久分享連結** — 結果儲存 Supabase，唯一 ID 對應分享頁

---

## 📁 專案結構

```
src/
├── core/
│   ├── geminiService.js      # Gemini AI 題目生成 / MBTI 分析（含 retry + key rotation）
│   ├── analysisService.js    # 分析流程協調
│   ├── musicService.js       # 歌曲推薦引擎（CSV + Supabase）
│   └── quizOrchestrator.js   # 題目載入（AI 優先，fallback 本地）
├── modules/
│   ├── ai-engine/
│   │   ├── MainQuiz.jsx      # AI 模式測驗頁
│   │   └── UnifiedResult.jsx # 結果頁（含截圖分享）
│   └── classic-mode/
│       ├── Quiz.jsx          # 經典模式測驗頁
│       ├── Loading.jsx       # 分析載入頁
│       ├── Result.jsx        # 結果展示頁
│       └── Share.jsx         # 公開分享頁
├── helpers/
│   ├── musicMath.js          # Cosine Similarity 計算
│   └── quizConfig.js         # 題目設定
├── components/common/
│   ├── ProgressBar.jsx
│   └── SpotifyIframe.jsx
├── agents/                   # V1 多代理人工具（orchestrator + tools）
└── pages/
    └── Home.jsx
public/
├── quiz_bank.json            # 靜態題庫（20 題）
└── songs/
    ├── CH_1.csv              # 中文歌曲庫
    ├── EN_1.csv              # 英文歌曲庫
    └── KPOP_1.csv            # 韓文歌曲庫
```

---

## 🔀 路由結構

| 路徑 | 頁面 | 說明 |
|---|---|---|
| `/` | Home | 首頁，模式選擇 |
| `/quiz` | ClassicQuiz | 經典模式測驗 |
| `/loading` | ClassicLoading | 分析載入中 |
| `/result` | ClassicResult | 經典模式結果 |
| `/share/:id` | ClassicShare | 公開分享頁 |
| `/v2` | MainQuiz | AI 引擎測驗 |
| `/v2/result` | UnifiedResult | AI 引擎結果 |

---

## 🧩 遇到的問題與解法

**問題：** Gemini API 429 / 503 / quota 耗盡導致服務中斷  
**解法：** 三層錯誤處理：429 指數退避 retry（15s→30s→60s）、quota 耗盡自動切換備用 key、503 直接 throw 並 fallback 本地題庫

**問題：** MBTI 無論如何都回傳 `ESTJ`  
**解法：** `mbtiTool` 讀取 `answers.EI`（字串），而 Quiz 儲存 `answers.E / answers.I`（數字），修正為直接比較數字格式

**問題：** Supabase 陣列欄位與 `.contains()` 型別不匹配  
**解法：** 改為客戶端過濾 + 本地 CSV 作為備援

**問題：** Spotify iframe 被 html2canvas 跨域封鎖  
**解法：** 截圖目標改為隱藏純文字卡片，不含 iframe

---

## 💡 學習收穫

- **多代理人系統設計** — Orchestrator 模式協調並行非同步工具
- **AI 服務可靠性** — retry、key rotation、graceful fallback 的實作
- **向量相似度推薦** — 基於 Cosine Similarity 的輕量本地推薦引擎
- **全端整合** — React 前端 + Supabase PostgreSQL + Spotify API + Gemini AI
- **可分享內容架構** — 唯一 ID 持久化結果，支援社群分享
