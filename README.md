# 🎧 MBTI Music Recommendation System

> A personality-based music recommendation system built with a **Multi-Agent (Orchestrator + Tools)** architecture.

**Live Demo:** [mbti-music-1.vercel.app](https://mbti-music-1.vercel.app)

**word**[完整詳細介紹](https://drive.google.com/file/d/14DzfiZHM8SuIMVIpkHs1o6PVflTFlgoY/view?usp=drive_link)

---

## 🚀 Overview

Users complete a 10-question personality test, and the system runs multiple specialized agents in parallel to generate a personalized MBTI profile, preference analysis, and curated Spotify song recommendations — all stored persistently in a cloud database.

---

## 🧠 System Architecture

```
User Input (10Q)
      ↓
  Orchestrator
      ├── mbtiTool          → Multi-dimension score → MBTI type
      ├── personalityTool   → Description mapping
      ├── messageTool       → Dynamic recommendation message
      ├── musicTool         → Supabase query + fallback engine
      └── userResultTool    → Persist result to DB, return share ID
      ↓
  Result Page
      ├── Preference analysis (weighted bar chart)
      ├── Spotify Embed playback
      ├── Screenshot export (html2canvas → JPG)
      └── Shareable link (/share/:id via Supabase row ID)
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7 |
| Database | Supabase (PostgreSQL) |
| Music API | Spotify Embed API |
| Deployment | Vercel (CI/CD via GitHub) |
| Screenshot | html2canvas |

---

## ⚙️ Features

- **10-question personality test** with multi-dimension MBTI scoring (E/I, S/N, T/F, J/P)
- **MBTI-based recommendation engine** with compatibility-ranked fallback logic
- **Real-time Spotify playback** via embedded player
- **Preference analysis** with weighted dimension chart
- **Persistent user data storage** in Supabase
- **Screenshot export** — generates a shareable card as JPG
- **Shareable result link** — unique URL per result via Supabase row ID

---

## 🧩 Challenges & Solutions

**Problem:** Supabase array column type mismatch with `.contains()`  
**Solution:** Added client-side filtering + local `songs.json` as fallback

**Problem:** MBTI always returning `ESTJ` regardless of answers  
**Solution:** `mbtiTool` was reading `answers.EI` (string format) while Quiz stored `answers.E / answers.I` (numeric format) — fixed to use numeric comparison directly

**Problem:** Fallback logic recommending ISTJ songs to ESFJ users  
**Solution:** Replaced random fallback with compatibility-ranked selection (counts matching MBTI letters)

**Problem:** Spotify iframes blocked by html2canvas (cross-origin)  
**Solution:** Screenshot target is a hidden card with song titles/artists in pure text — no iframes

---

## 📁 Project Structure

```
src/
├── agents/
│   ├── orchestrator.js      # Main controller
│   ├── mbtiTool.js          # MBTI calculation
│   ├── personalityTool.js   # Description mapping
│   ├── messageTool.js       # Dynamic message
│   ├── musicTool.js         # Song recommendation engine
│   └── userResultTool.js    # DB storage + share ID
├── pages/
│   ├── Home.jsx
│   ├── Quiz.jsx
│   ├── Result.jsx           # Screenshot + share link
│   └── Share.jsx            # Public result view via ID
└── lib/
    └── supabase.js
```

---

## 💡 What I Learned

- **Multi-Agent system design** — Orchestrator pattern for coordinating parallel async tools
- **Full-stack integration** — React frontend + Supabase PostgreSQL + Spotify API
- **Debugging production issues** — score format mismatch, fallback edge cases, iframe cross-origin constraints
- **Shareable content architecture** — persisting results with unique IDs for social sharing
