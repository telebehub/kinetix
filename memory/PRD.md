# Kinetix PWA v2 - Product Requirements Document

## Problem Statement
Mobile-first PWA for Kinetix - AI-powered urban mobility for Baku, Azerbaijan with built-in ML model for metro passenger prediction.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Leaflet.js + Shadcn/UI
- **Backend**: FastAPI + MongoDB + Built-in KinetixModel
- **ML Engine**: Built-in XGBoost-based feature engineering model (no user upload)
- **Weather**: Open-Meteo API (free, no key)

## What's Implemented (March 14, 2026)
### v2 Refactor Changes:
- Removed model upload UI completely - model is built-in system component
- Fixed route trajectories: metro follows real Red/Green line coords, bus uses smooth bezier curves
- Compact search bar: inline mode pills + Go button
- Polished bottom sheet: max-h-[40vh], compact cards
- AI Engine shows "Active" badge (not Mock Mode)
- Route segments render with correct colors (red=metro, green dashed=bus)

### 5 Pages:
1. **Map**: Leaflet + compact search + transport modes + polished route results
2. **AI Dashboard**: Live clock, weather, AI Engine status, prediction form
3. **Radar**: Dark map with crowding circles + station list
4. **Tickets**: Buy/manage transit tickets
5. **Settings**: Language, mode, toggles

### Backend: 8 API endpoints (removed /model/upload)

## Backlog
### P0 (Done): Core MVP + Built-in Model
### P1: Auth, payments, GPS, push notifications
### P2: PWA offline, multi-language, analytics, social sharing
