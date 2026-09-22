# SkyCast MVP Readiness Audit

This document assesses the current state of `skycast-next` against the P0 MVP goals.

## Core Features Status

| Feature | Status | Notes |
| :--- | :--- | :--- |
| **Core Weather** | ✅ `WORKING` | Dashboard, Location Search, and weather fetching via Open-Meteo work robustly. |
| **WeatherGPT** | ✅ `WORKING` | Streamed AI chat and context extraction is fully implemented. |
| **Domain Agents** | ⚠️ `PARTIAL` | Deterministic router and basic tools (Agriculture, Alerts) exist. Needs clear UI selection and full 7-domain support (Aviation, Marine, Urban, Research) configured. |
| **Multi-Model Forecast** | ❌ `MISSING` | Currently only uses default Open-Meteo model. Needs `gfs_seamless`, `ecmwf_ifs04`, `icon_seamless` integration and comparison UI/chart. |
| **Multilingual** | ❌ `MISSING` | English-only currently. Needs UI for language preference and AI prompt adjustment to enforce Marathi/other languages. |
| **Voice Input** | ❌ `MISSING` | Microphone button + Web Speech API integration is required on the chat interface. |
| **Voice Output** | ❌ `MISSING` | Speech Synthesis for AI responses is missing. |
| **Map** | ✅ `WORKING` | Basic MapLibre GL JS integration exists. |
| **Alerts** | ✅ `WORKING` | Official IMD CAP alerts + heuristic risks are fully implemented. |
| **Responsive UI** | ⚠️ `PARTIAL` | Mostly responsive, but needs polish across all new MVP features. |
| **Button/Interaction Audit**| ⚠️ `PARTIAL` | Need to ensure all visible buttons (especially in Chat/Dashboard) are wired up. |
| **Vercel Readiness** | ⚠️ `PARTIAL` | Needs final build checks, `.env.example` validation, and ensuring no server-only leaks to client. |

## P0 Implementation Priorities

1. **Domain Agents UI & Support**: Add the 7 domains to the deterministic router and provide a UI to manually select them.
2. **Multi-Model Forecast**: Update `WeatherService` (or create a new method) to fetch multiple models from Open-Meteo and build the `Forecast Intelligence` UI.
3. **Multilingual Support**: Add language selector (client-side state) and pass it to WeatherGPT system prompt.
4. **Voice I/O**: Implement Web Speech API in the chat component.
5. **UI Polish & Button Audit**: Wire up all interactions, ensure smooth demo flow.
6. **Vercel Checks**: Final test of production build and env vars.
