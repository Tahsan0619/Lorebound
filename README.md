# Lorebound

**Turning Curriculum into Playable Worlds** — an AI-powered curriculum-to-game compiler built for the SciBlitz AI Challenge 2026 (Track C: Education & Accessibility).

Lorebound ingests textbook chapters, syllabus PDFs, or pasted curriculum text and compiles them into **deep, multi-phase interactive learning games**. The compiler — not any single game — is the product: it detects the dominant knowledge structure (timeline, process, cause-effect, or comparison) and selects the matching mechanic automatically.

## Highlights

- **4 game mechanics**, each with **4 interactive phases** per level (~30+ minutes of gameplay per session)
- **Groq-powered AI compiler** (Llama 3.3 70B) with grounded content generation and heuristic fallback
- **View Source** transparency — every challenge links back to the original curriculum passage
- **Laravel API + Admin panel** for samples, compilations, and session analytics
- **Standalone frontend** works offline with a local compiler fallback

## Game Mechanics

| Structure | Game | Phases per Level |
|-----------|------|------------------|
| Sequential / Timeline | **Timeline Builder** | Build → Date Detective → Sequence Mastery → Era Finale |
| Cyclical / Process | **Process Loop** | Navigate → Reorder → Parameter Sim → Chain Lock |
| Cause-and-Effect | **Cause-Effect Chain** | Link → Ripple Predictor → Chain Assembly → Inference Boss |
| Comparative | **Comparison Sorter** | Sort → Trap Hunter → Memory Match → Policy Debate |

**Engagement features:** streak bonuses, phase progress HUD, session depth tracker, level-up transitions, confetti FX, and grounded feedback overlays.

## Demo Sample Chapters

| Demo | Mechanic | Topic |
|------|----------|-------|
| Internet & Computing Revolution | Timeline | Computer Science • Grade 9–12 |
| Blood Journey Through the Human Heart | Process Loop | Biology • Grade 7–8 |
| Ocean Plastic Pollution Chain | Cause-Effect | Marine Ecology • Grade 8–10 |
| Renewable Energy vs Fossil Fuels | Comparison | Energy & Civics • Grade 9–11 |

## Project Structure

```
Lorebound/
├── backend/                      # Laravel API + Admin + MySQL
│   ├── app/
│   │   ├── Http/Controllers/Api/       # REST API
│   │   ├── Http/Controllers/Admin/   # Admin panel
│   │   ├── Models/
│   │   └── Services/
│   │       ├── Compiler/               # Classification & generation pipeline
│   │       └── Groq/                   # Groq LLM client
│   ├── database/migrations/
│   ├── database/seeders/data/        # Demo chapter payloads
│   ├── public/app/                   # Frontend served at /app/
│   └── routes/api.php
├── index.html                      # Standalone frontend entry
├── app.js                          # App coordinator & compiler harness
├── games.js                        # Multi-phase game renderers
├── api.js                          # API client
├── fx.js                           # Visual effects helpers
├── styles.css, animations.css
└── composer.phar                   # Local Composer binary (optional)
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

# Optional — enables AI compilation via Groq Cloud
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
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
| http://127.0.0.1:8000/admin | Admin panel |
| http://127.0.0.1:8000/api/v1/health | API health check |

**Admin login:** `admin@lorebound.test` / `password`

## Compiler Pipeline

```
Input (PDF / Text)
  → Text Extraction (PDF.js client-side)
  → Structural Classification (Groq LLM or heuristic)
  → Mechanic Selection (Timeline / Process / Cause-Effect / Comparison)
  → Grounded Content Generation (Groq LLM or local fallback)
  → Multi-Phase Game Renderer
  → Session Summary + Analytics
```

**AI model:** Llama 3.3 70B via Groq Cloud (prompt version `v4.0-groq-deep-engagement`)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/samples` | List sample chapters |
| GET | `/api/v1/samples/{slug}` | Get sample detail |
| POST | `/api/v1/samples/{slug}/compile` | Compile from preloaded sample |
| POST | `/api/v1/compile` | Compile pasted text |
| POST | `/api/v1/compile/pdf` | Compile extracted PDF text |
| POST | `/api/v1/sessions` | Save game session results |

## Standalone Frontend (no backend)

Open `index.html` directly in a browser. The app uses the local compiler fallback if the API is unavailable. All four game mechanics and multi-phase gameplay work without a server.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, JavaScript (4 multi-phase game engines) |
| Backend | Laravel 13 (PHP 8.3+) |
| Database | MySQL 8+ (SQLite supported for local dev) |
| AI | Groq Cloud — Llama 3.3 70B |
| PDF | PDF.js (client-side extraction) |

## Team

BabunToo Academy — University of Frontier Technology Bangladesh (UFTB)
