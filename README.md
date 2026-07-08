# Lorebound

**Turning Curriculum into Playable Worlds** - an AI-powered curriculum-to-game compiler built for the SciBlitz AI Challenge 2026 (Track C: Education and Accessibility).

Lorebound ingests textbook chapters, syllabus PDFs, or pasted curriculum text and compiles them into deep, multi-phase interactive learning games. The compiler, not any single game, is the product: it detects the dominant knowledge structure (timeline, process, cause-effect, or comparison) and selects the matching mechanic automatically.

## Highlights

- **4 game mechanics**, each with **4 interactive phases** per level (~30+ minutes of gameplay per session)
- **Groq-powered AI compiler** with multi-model orchestration, payload validation, and best-result selection
- **Learning guide pipeline** with subtopics, source-grounded passages, and adaptive study depth
- **Written assessments** with Groq-backed answer evaluation and heuristic fallback
- **View Source** transparency: every challenge links back to the original curriculum passage
- **Laravel API + Admin panel** for samples, compilations, sessions, and analytics
- **Standalone frontend** works offline with a local heuristic compiler fallback
- **Universal visual asset pack** tooling for curriculum-themed scene imagery

## Game Mechanics

| Structure | Game | Phases per Level |
|-----------|------|------------------|
| Sequential / Timeline | **Timeline Builder** | Build, Date Detective, Sequence Mastery, Era Finale |
| Cyclical / Process | **Process Loop** | Navigate, Reorder, Parameter Sim, Chain Lock |
| Cause-and-Effect | **Cause-Effect Chain** | Link, Ripple Predictor, Chain Assembly, Inference Boss |
| Comparative | **Comparison Sorter** | Sort, Trap Hunter, Memory Match, Policy Debate |

**Engagement features:** streak bonuses, phase progress HUD, session depth tracker, level-up transitions, confetti FX, grounded feedback overlays, and narrative scene theming.

## Playable Curriculum Games

These four are full working games (not AI demos). Paste/PDF + Groq is for live AI compile testing.

| Game | Mechanic | Topic |
|------|----------|-------|
| Bangladesh Liberation War 1971 | Timeline Builder | History and Civil Studies, Grade 9-10 |
| The Water (Hydrological) Cycle | Process Loop | Earth Science and Biology, Grade 8 |
| The Green Revolution and Ecology | Cause-Effect Chain | Environmental Science, Grade 11-12 |
| Photosynthesis vs. Respiration | Comparison Sorter | Cellular Bio-Chemistry, Grade 10 |

## Project Structure

```
Lorebound/
├── backend/                         # Laravel API + Admin + MySQL
│   ├── app/
│   │   ├── Http/Controllers/Api/    # REST API
│   │   ├── Http/Controllers/Admin/  # Admin panel
│   │   ├── Models/
│   │   └── Services/
│   │       ├── Compiler/            # Classification, generation, assessments
│   │       └── Groq/                # Groq LLM client and prompts
│   ├── database/seeders/data/       # Demo chapter payloads
│   ├── public/app/                  # Frontend served at /app/
│   └── routes/api.php
├── assets/universal_library/        # Visual asset manifests (images rebuilt via tools/)
├── tools/                           # Sample sync and image library scripts
├── index.html                       # Standalone frontend entry
├── app.js                           # App coordinator and compiler harness
├── games.js                         # Multi-phase game renderers
├── understand.js                    # Learning guide and book reader UI
├── assessments.js                   # Written assessment flow
├── api.js                           # API client
└── composer.phar                    # Local Composer binary (optional)
```

## Quick Start

### 1. Database

Create a MySQL database:

```sql
CREATE DATABASE lorebound CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Copy and configure the backend environment:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lorebound
DB_USERNAME=root
DB_PASSWORD=your_password

# Optional: enables AI compilation via Groq Cloud
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_MODEL_FALLBACKS=openai/gpt-oss-120b,openai/gpt-oss-20b,llama-3.1-8b-instant
```

Without `GROQ_API_KEY`, the system uses an enhanced local heuristic compiler.

### 2. Backend Setup

```bash
cd backend
php ../composer.phar install --no-dev --no-interaction
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### 3. Access

| URL | Description |
|-----|-------------|
| http://127.0.0.1:8000/app/ | Main frontend (compiler + games) |
| http://127.0.0.1:8000/admin | Admin panel (dashboard, samples, compilations, sessions) |
| http://127.0.0.1:8000/api/v1/health | API health check |

**Admin login:** `admin@lorebound.test` / `password`

The admin panel (`/admin`) includes Dashboard metrics, Sample Chapters, Compilations, and Game Sessions. Tables use `admin.css` for aligned columns, compact action buttons, and truncated long titles.

## Compiler Pipeline

```
Input (PDF / Text)
  -> Text Extraction (PDF.js client-side)
  -> Structural Classification (Groq LLM or heuristic)
  -> Mechanic Selection (Timeline / Process / Cause-Effect / Comparison)
  -> Learning Guide Generation (subtopics, passages, study depth)
  -> Grounded Game Payload Generation (Groq LLM or local fallback)
  -> Written Assessments (Groq evaluation with heuristic fallback)
  -> Multi-Phase Game Renderer
  -> Session Summary + Analytics
```

**AI model routing:** Auto mode orchestrates active Groq text-generation models, validates each candidate payload, and selects the strongest result based on dominant confidence and payload quality (prompt version `v5.1-groq-rich-engagement`).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/samples` | List sample chapters |
| GET | `/api/v1/samples/{slug}` | Get sample detail |
| POST | `/api/v1/samples/{slug}/compile` | Compile from preloaded sample |
| POST | `/api/v1/compile` | Compile pasted text |
| POST | `/api/v1/compile/pdf` | Compile extracted PDF text |
| GET | `/api/v1/compilations` | List saved compilations |
| GET | `/api/v1/compilations/{uuid}` | Get a saved compilation |
| DELETE | `/api/v1/compilations/{uuid}` | Delete a saved compilation |
| POST | `/api/v1/sessions` | Save game session results |
| POST | `/api/v1/evaluate` | Evaluate a written assessment answer |

## Standalone Frontend (no backend)

Open `index.html` directly in a browser. The app uses the local compiler fallback if the API is unavailable. All four game mechanics and multi-phase gameplay work without a server.

## Universal Visual Asset Pack

Lorebound includes a tooling pipeline to build a reusable image bank for curriculum contexts (war, history, body, ocean, energy, tech, nature, math, civics, industry) using neutral, non-documentary visuals.

- Config: `tools/image_library/topics.json`
- Downloader: `tools/image_library/download_universal_images.mjs`
- Output folder: `assets/universal_library/`

Quick run (no API key):

```bash
node tools/image_library/download_universal_images.mjs --total 800
```

Sources: Wikimedia Commons and LoremFlickr. Kept images are verified (keyword relevance, minimum file size, and image content-type).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, JavaScript (4 multi-phase game engines) |
| Backend | Laravel 13 (PHP 8.3+) |
| Database | MySQL 8+ (SQLite supported for local dev) |
| AI | Groq Cloud, multi-model auto routing |
| PDF | PDF.js (client-side extraction) |

## Team

Team Alpha
