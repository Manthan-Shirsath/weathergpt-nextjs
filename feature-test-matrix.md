# SkyCast Feature/Behavior Test Matrix

| Feature | Expected Behavior | Current Implementation | Test Type | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Weather Data Layer** | Fetches data, maps to canonical schema, caches, handles stale fallback | Service calls Open-Meteo via provider, validates via Zod, handles errors | API / Integration | `IMPLEMENTED` |
| **WeatherGPT Chat** | Accepts user input, retains context, streams AI response | Uses AI SDK v7 `streamText` & `useChat`, parts-based UIMessages | Component / Integration | `IMPLEMENTED` |
| **AI Routing** | Routes query to correct domain (General, Agriculture, Aviation, etc.) | Deterministic keyword/regex matching on user prompt | Unit | `IMPLEMENTED` |
| **Context Extractor** | Persists location and temporal references across chat turns | Regex/heuristic extraction from message history | Unit | `IMPLEMENTED` |
| **AI Tools (Weather/Location)**| Resolves coordinates, fetches weather, returns structured JSON | Native AI SDK `tool()` definitions calling WeatherService | API / Integration | `IMPLEMENTED` |
| **AI Tools (Alerts)** | Calculates threshold-based risks from current weather | Heuristic evaluation (Temp >=40C, Rain >=70%) | Unit | `APPROXIMATION` |
| **AI Tools (Agriculture)** | Recommends actions based on weather | Rule-based advice via tool | Unit | `APPROXIMATION` |
| **Location Search** | Geocodes input, shows dropdown, selects location, updates context | Client component using Open-Meteo geocoding API, debounced | Component | `IMPLEMENTED` |
| **Dashboard UI** | Renders current weather, metrics, daily forecast | Server components mapping canonical schema to UI | Component | `IMPLEMENTED` |
| **Alerts UI** | Displays active weather risks based on location | Renders threshold-based heuristic risks, marked as approximation | Component | `APPROXIMATION` |
| **Map UI** | Loads interactive map for selected location | MapLibre GL JS client component, OSM tiles | Component | `IMPLEMENTED` |
| **Map Overlays (Radar/Wind)**| Shows weather layers on map | Controls exist but are disabled/deferred | Component | `DEFERRED` |
| **Authentication** | Users can log in and save preferences/locations | Guest access only | N/A | `DEFERRED` |
| **Official IMD Alerts** | Fetches authoritative alerts from IMD | Not integrated, using threshold approximations | N/A | `DEFERRED` |
| **WebSockets/Realtime** | Live updates for chat and alerts | AI streaming via HTTP; true realtime push deferred | N/A | `DEFERRED` |

## Summary
The core Weather Data Layer, Deterministic AI Routing, Context Extraction, and base Dashboard/Chat UIs are `IMPLEMENTED`. Specialized domains (Alerts, Agriculture) currently rely on heuristic `APPROXIMATION`s. Advanced features like Map Overlays, Auth, and WebSockets are `DEFERRED`.
