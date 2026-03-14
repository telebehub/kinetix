# Kinetix PWA - Product Requirements Document

## Original Problem Statement
Build a mobile-first PWA for "Kinetix" - AI-powered urban mobility for Baku, Azerbaijan. Predicts public transport crowding using ML and suggests optimal routes. Google Maps-like but more modern UI.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Leaflet.js + Shadcn/UI
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **ML Engine**: XGBoost model extracted from Jupyter notebook (mock fallback)
- **Weather**: Open-Meteo API (free, no key needed)

## User Personas
1. **Daily Commuter** - Uses metro/bus, wants to avoid crowding
2. **Tourist** - Navigating Baku transit for first time
3. **Data Analyst** - Using AI predictions for transit planning

## Core Requirements
- Full-screen interactive Leaflet map centered on Baku
- Route search with origin/destination, transport mode filters
- AI-powered route comparison (Standard vs Smart Route)
- ML model upload and passenger prediction
- Live crowding radar
- Ticket management
- Real-time Baku weather and clock

## What's Been Implemented (March 14, 2026)
### Pages (5 total):
1. **Map Page**: Leaflet map, floating search bar, transport pills (Bus/Metro/AI Mix), polyline routing, AI bottom sheet
2. **AI Dashboard**: Live Baku clock, weather widget, model status, file upload (.ipynb/.joblib/.json), ML prediction form
3. **Live AI Radar**: Dark-themed map with crowding circles, station list sorted by crowding, filter by metro/bus
4. **Tickets Page**: Buy tickets (single/daily/weekly/monthly), metro/bus/combined, ticket card list
5. **Settings Page**: Language (AZ/EN/RU), preferred mode, notifications, dark mode, comfort priority, accessibility

### Backend Endpoints:
- GET /api/locations - Baku metro/bus locations
- POST /api/routes/find - AI route finding
- GET /api/radar/live - Live crowding data
- GET/POST /api/tickets - Ticket CRUD
- GET/PUT /api/settings - Settings CRUD
- GET /api/model/status - ML model status
- POST /api/model/upload - Upload notebook/model files
- POST /api/model/predict - Passenger prediction
- GET /api/weather/baku - Live Baku weather

### ML Engine:
- KinetixPredictor class (extracted from notebook)
- MockPredictor fallback (feature-based simulation)
- Notebook extraction pipeline
- XGBoost model support

## Prioritized Backlog
### P0 (Must Have - Done):
- [x] Map with Leaflet
- [x] Route search & comparison
- [x] Bottom navigation (5 pages)
- [x] ML prediction endpoint
- [x] Weather integration
- [x] Live clock

### P1 (Should Have - Next):
- [ ] Real AI model training pipeline
- [ ] User authentication
- [ ] Payment integration for tickets
- [ ] Push notifications for crowding alerts
- [ ] Geolocation (GPS) for current location

### P2 (Nice to Have):
- [ ] Offline PWA support (service worker)
- [ ] Multi-language content (full AZ/RU translations)
- [ ] Historical analytics dashboard
- [ ] Social sharing of routes
- [ ] Dark mode toggle

## Next Tasks
1. Train XGBoost model with real passenger data and upload .joblib
2. Add user authentication (JWT or Google OAuth)
3. Implement real-time WebSocket for radar updates
4. Add PWA manifest & service worker for offline support
5. Integrate BakuCard payment system for tickets
