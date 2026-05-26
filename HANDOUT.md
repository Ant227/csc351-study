# CSC351 Study Website — Project Handout

## Overview

A static study website for **CSC351 Application Security** at **KMUTT (King Mongkut's University of Technology Thonburi), SIT faculty**. Built for Block 3 exam prep covering web security topics. The site has lecture notes, 20-question quizzes per topic, and AI-powered feedback using the Anthropic API.

**Live URL:** https://csc351-study.vercel.app  
**GitHub Repo:** https://github.com/Ant227/csc351-study  
**Hosting:** Vercel (serverless functions + static site)

---

## Tech Stack

- **Frontend:** Pure HTML, CSS, JavaScript (no frameworks)
- **Backend:** Vercel serverless function (`api/feedback.js`)
- **AI:** Anthropic API — model `claude-haiku-4-5-20251001`
- **Fonts:** Google Fonts — DM Serif Display, DM Sans, DM Mono
- **Storage:** `localStorage` for quiz score persistence

---

## File Structure

```
csc351-study/
├── index.html              # Home page — topic card grid
├── xss.html                # Lecture 11 — XSS topic page
├── clickjacking.html       # Lecture 13 — Clickjacking topic page
├── sqli.html               # Lecture 12 — SQL Injection topic page (standalone implementation)
├── api/
│   └── feedback.js         # Vercel serverless function — proxies Anthropic API calls
├── shared/
│   ├── style.css           # Shared styles for xss.html and clickjacking.html
│   └── quiz.js             # Shared quiz class for xss.html and clickjacking.html
├── package.json            # Node.js package config (no dependencies)
├── DEPLOYMENT.md           # Deployment guide
└── .gitignore
```

---

## Architecture

### Two separate quiz implementations (important!)

**xss.html and clickjacking.html** use the **shared system**:
- `shared/quiz.js` — `Quiz` class handles rendering, answer selection, grading, AI feedback
- `shared/style.css` — all styling
- Quiz is initialized inline in each HTML file with questions array and a `feedbackPromptFn`

**sqli.html** is a **standalone implementation**:
- Everything is inline — CSS in `<style>`, JavaScript at the bottom of the file
- Has its own `buildQuiz()`, `selectOpt()`, `submitQuiz()`, `getFeedback()` functions
- Uses different data structure: `{q, src, opts, ans, exp}` instead of `{q, source, opts, answer}`

### AI Feedback Flow
```
Browser quiz submit
  → fetch POST /api/feedback  { prompt: "..." }
  → Vercel serverless function (api/feedback.js)
  → Anthropic API (claude-haiku-4-5-20251001)
  → { feedback: "..." }
  → Display in feedback-box div
```

The API key is stored **only in Vercel environment variables** (`ANTHROPIC_API_KEY`). It is never in the code or GitHub.

---

## Pages

### index.html — Home
- Topic card grid (3 active topics + 1 "coming soon")
- Cards are fully clickable (`<a>` tags)
- Shows quiz score badges from localStorage on each card (e.g. "75%")
- Score key format: `score_xss`, `score_sqli`, `score_clickjacking`

### xss.html — Cross-Site Scripting (Lecture 11)
- 3 screens: Notes (`screen-notes`), Quiz (`screen-quiz`), Results (`screen-results`)
- Navigation: `CSC351 / XSS` on left, `← All topics` on right
- Mode bar below nav: `Notes › Quiz › Results`
- 20 questions, uses `shared/quiz.js` and `shared/style.css`
- AI feedback calls `/api/feedback`

### sqli.html — SQL Injection (Lecture 12)
- Same 3-screen layout but uses inline `showTab('learn'|'quiz'|'results')` function
- Inline CSS with custom color variables (`--text: #1a202c`, etc.)
- 20 questions with explanations (`exp` field shown after submission)
- AI feedback calls `/api/feedback` via `getFeedback()` async function
- Has own `retry()` function

### clickjacking.html — Clickjacking (Lecture 13)
- Same structure as xss.html
- Uses `shared/quiz.js` and `shared/style.css`
- 20 questions
- AI feedback calls `/api/feedback`

---

## Design System

### Colors (shared/style.css)
```css
--text-primary: #30313d      /* Main body text */
--text-secondary: #636e7a    /* Secondary text */
--text-tertiary: #8a9099     /* Subtle text */
--accent: #635bff            /* Purple accent */
--border: #e3e8ef
--bg: #f6f8fa
--surface: #ffffff
```

### Colors (sqli.html inline)
```css
--text: #1a202c
--text2: #2d3748
--text3: #718096
--blue: #2563eb
--red: #dc2626
--green: #16a34a
--amber: #b45309
--purple: #7c3aed
```

### Key CSS Classes
- `.nav` — sticky top nav bar
- `.nav-brand` — site title (CSC351 / Topic)
- `.nav-back` — back button (← All topics), right-aligned
- `.mode-bar` — progress indicator below nav
- `.mode-step.active` — active step in red
- `.topic-card` — home page card
- `.score-badge` — score percentage badge on cards
- `.feedback-box` — AI feedback display area
- `.feedback-loading` — spinner while waiting for AI

---

## Serverless Function — api/feedback.js

```javascript
module.exports = async (req, res) => {
  // POST only
  // Reads { prompt } from req.body
  // Reads ANTHROPIC_API_KEY from process.env
  // Calls https://api.anthropic.com/v1/messages
  // Model: claude-haiku-4-5-20251001
  // Returns { feedback: "..." } on success
  // Returns { error: "..." } on failure
};
```

**Critical:** The model must be `claude-haiku-4-5-20251001` (or any claude 4.x+ model). This Anthropic account does NOT have access to claude-3.x models. Using claude-3-5-sonnet or similar will return `not_found_error`.

---

## Vercel Setup

- Project name: `csc351-study`
- GitHub repo: `Ant227/csc351-study`, branch: `main`
- Root directory: `./`
- Environment variable: `ANTHROPIC_API_KEY` = (key set in Vercel dashboard)
- Auto-deploys on every push to `main`

**To add/update API key:**
1. Go to vercel.com → Project → Settings → Environment Variables
2. Edit `ANTHROPIC_API_KEY`
3. Redeploy

---

## What Has Been Completed

1. **Home page** (`index.html`) with 3 clickable topic cards and score badges
2. **XSS page** (`xss.html`) — full notes + 20-question quiz + AI feedback
3. **SQL Injection page** (`sqli.html`) — full notes + 20-question quiz + AI feedback
4. **Clickjacking page** (`clickjacking.html`) — full notes + 20-question quiz + AI feedback
5. **Shared quiz engine** (`shared/quiz.js`) — Quiz class, transitions, mode tracking
6. **Secure API proxy** (`api/feedback.js`) — serverless function on Vercel
7. **Score persistence** — localStorage saves scores, shown on home page
8. **Consistent navigation** across all pages
9. **Scroll-to-top** when switching between screens
10. **Deployment** to Vercel with secure environment variable

---

## Known Issues / TODO

- **Shellshock topic** (Lecture 14) — card shows "Coming soon" on home page, not yet built
- **sqli.html** uses a different implementation than the other two pages — inconsistent codebase. If adding more topics, consider refactoring sqli.html to use `shared/quiz.js`
- **Score badge math** — home page assumes 20 questions per topic (`pct = score / 20 * 100`). If question count changes, update `index.html` line 88
- **No loading state** on notes → quiz transition beyond the fade

---

## How to Add a New Topic

1. Copy `xss.html` as a new file (e.g. `shellshock.html`)
2. Update the title, lecture number, nav breadcrumb
3. Replace the notes content
4. Replace the `questions` array with 20 new questions
5. Update the `feedbackPromptFn` to mention the new topic
6. Add a new topic card in `index.html` (copy an existing `<a class="topic-card">` block)
7. Add the new topic key to the `topics` array in `index.html` script

---

## How to Run Locally

```bash
cd /Users/ant/Desktop/ApplicationSecurityWebsite/csc351-study
python3 -m http.server 5500
# Visit http://localhost:5500
```

Note: AI feedback won't work locally because `api/feedback.js` needs Vercel's runtime. The site and quizzes work fine locally; only the AI feedback requires the deployed Vercel URL.
