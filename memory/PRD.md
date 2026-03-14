# Kinetix PWA v3 - Product Requirements Document

## Problem Statement
Mobile-first PWA for Kinetix - AI-powered urban mobility for Baku, Azerbaijan with built-in ML model, full i18n, dark mode, and persistent settings.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Leaflet.js + Shadcn/UI
- **Backend**: FastAPI + MongoDB + Built-in KinetixModel (XGBoost)
- **i18n**: 3 languages (AZ, EN, RU) via translations.js + SettingsContext
- **Theme**: Dark/Light mode via CSS variables + SettingsContext
- **Weather**: Open-Meteo API (free)
- **Persistence**: MongoDB + localStorage dual-write

## What's Implemented (March 14, 2026)

### Settings System (v3):
- **Language**: AZ/EN/RU instant switching across all 5 pages, 150+ translation keys
- **Dark Mode**: Full dark theme - map tiles, cards, inputs, nav, all pages
- **Preferred Mode**: Bus First/Metro First/AI Optimized affects route behavior
- **Comfort Priority**: Adjusts crowding stats favoring comfort routes
- **Accessibility**: Toggle with info note, affects route parameters
- **Notifications**: Browser permission request + preference storage
- **Persistence**: Settings saved to MongoDB + localStorage, restored on app load
- **SettingsContext**: Central state providing t(), isDark, tc(), updateSettings()

### Core Features:
- 5 fully functional pages (Map, AI Dashboard, Radar, Tickets, Settings)
- Built-in AI model (no upload needed)
- Geographically accurate metro/bus route polylines
- Live Baku weather + clock
- Ticket purchase system
- Live crowding radar

### Backend: 8 API endpoints
- /api/locations, /api/routes/find, /api/radar/live
- /api/tickets, /api/tickets/purchase
- /api/settings (GET/PUT)
- /api/model/status, /api/model/predict
- /api/weather/baku

## Test Results: Backend 100%, Frontend 100%, Integration 100%

## Backlog
### P1: Auth, payments, GPS, push notifications, WebSocket radar
### P2: PWA offline, full accessibility data, analytics, social sharing
