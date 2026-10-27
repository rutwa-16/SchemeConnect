## 🌿 SchemeConnect 

**SchemeConnect** is a **frontend web application** built for a college project (SEM 2) that serves as a one-stop discovery portal for **Indian Government Welfare Schemes**. Its goal is to help citizens — farmers, students, women, senior citizens, entrepreneurs, and more — find and apply to government programs they are eligible for.

---

### 🎯 Core Purpose
> Bridge the gap between Indian citizens and the hundreds of government welfare schemes they may not know they qualify for.

---

### 📄 Pages & Features

| Page | Description |
|---|---|
| **Home** (`index.html`) | Landing page with hero section, featured scheme cards, stats counter, benefits section, and testimonials |
| **Schemes** (`schemes.html`) | Full browsable catalogue of 40+ government schemes with filtering, sorting, search, save, and modal detail view |
| **AI Assistant** (`chat.html`) | A rule-based AI chatbot that suggests matching schemes based on natural language input (e.g. "I'm a farmer looking for crop insurance") |
| **Eligibility Quiz** (`quiz.html`) | A 5-question interactive quiz (age, gender, income, occupation, state) that recommends matched schemes |
| **Sign In / Profile** (`signin.html`, `profile.html`) | User authentication UI and profile management |
| **About / Contact** (`about.html`, `contact.html`) | Project info and contact form |

---

### ⚙️ Technical Stack

| Layer | Technology |
|---|---|
| **Structure** | HTML5 (semantic, accessible) |
| **Styling** | Vanilla CSS + Bootstrap 5.3 |
| **Scripting** | Vanilla JavaScript (ES6+) |
| **Data** | `schemes.json` — 40 schemes in a structured JSON format |
| **Fonts** | Google Fonts (Inter) + Font Awesome icons |
| **Animations** | Custom CSS animations + WebGL canvas (`premium-3d-stage.js`) |

---

### 🗂️ Data Model
Each scheme in `schemes.json` contains:
- **Name, Category, Ministry** — Identity
- **Description, Benefits, How to Apply** — Content
- **Documents required** — Checklist
- **Eligibility** — gender, min/max age, max income, states
- **Apply Link** — Direct URL to official portal
- **Tags & Featured flag** — For filtering and highlighting

---

### ✨ Notable Features

- **Smart Filtering** — Filter by category, gender, age group, income level, and state simultaneously
- **AI Scheme Advisor** — Rule-based NLP chatbot that maps user intent keywords to scheme categories
- **Eligibility Quiz** — Personalized scheme recommendations in 5 steps
- **Live Scheme Radar** — A floating widget that cycles through random schemes
- **Save / Favorites** — Save schemes to localStorage for later reference
- **Dark Mode + 5 Themes** — Mint Glass, Aurora Pop, Sunset Glow, Ocean Blue, Forest Green
- **Premium 3D Background** — WebGL particle stage for a premium visual feel
- **Keyboard Shortcuts + Command Palette** — Power-user navigation
- **Community Schemes** — Users can add custom schemes via localStorage

---

### 🏗️ Architecture

```
SchemeConnect/
├── index.html           ← Home page
├── pages/               ← All inner pages
├── css/
│   ├── style.css        ← Core design system
│   └── enhancements.css ← Animation & premium effects layer
├── js/
│   ├── main.js          ← Home page schemes logic
│   ├── ai.js            ← AI chatbot engine
│   ├── enhancements.js  ← 76KB of UI enhancements
│   ├── premium-3d-stage.js ← WebGL background
│   └── custom-schemes.js   ← Community scheme management
└── data/
    └── schemes.json     ← Scheme database (40 entries)
```

---

SchemeConnect is a polished, feature-rich static web portal that makes Indian government welfare schemes discoverable, filterable, and accessible to everyday citizens — wrapped in a premium UI with dark mode, AI assistance, and personalized matching.
