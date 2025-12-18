# <img src="https://raw.githubusercontent.com/github/explore/main/topics/game/game.png" width="32" /> Game SDK

![version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![build](https://img.shields.io/badge/build-passed-brightgreen.svg)
![license](https://img.shields.io/badge/license-MIT-lightgrey.svg)

A complete frontend SDK for browser and mobile game clients with full AI Games Platform API integration.
Handles authentication, environment detection, device ID, token storage, event system, and provides typed API clients for all backend endpoints.

----

## 🚀 Features

- **Singleton CoreSDK** - Global instance pattern
- **Complete API Coverage** - All AI Games Platform endpoints
- **TypeScript Support** - Full type safety with exported interfaces
- **Auto Authentication** - Guest auth with token caching
- **Environment Detection** - Cordova / Web / Mobile
- **Device ID Management** - Auto-generation + persistent cache
- **API Clients** - Configs
- **Error Tracking** - Sentry integration
- **Production Ready** - ES & UMD bundles

---

## 📁 Project Structure

```
src/
  ApiClient.ts              – HTTP client with token handling (GET, POST, PUT, PATCH, DELETE)
  CoreSDK.ts                – Main SDK singleton with all API clients
  EventBus.ts               – Internal event system
  config.ts                 – Base URL & global settings
  types.ts                  – Core SDK interfaces
  api-types.ts              – API request/response types
  clients/                  – API client implementations
    ConfigsApiClient.ts     – Configuration management
    AbTestsApiClient.ts     – A/B testing
    RemoteConfigsApiClient.ts – Remote configurations
    SegmentsApiClient.ts    – User segmentation
    UsersApiClient.ts       – User management
    HealthApiClient.ts      – Health checks
dist/
  game-sdk.es.js            – ES module bundle (130KB)
  game-sdk.umd.js           – UMD build (83KB)
docs/
  QUICK_START.md            – Get started guide
  API_USAGE.md              – Complete API reference
  FRONTEND_INTEGRATION.md   – React integration examples
  IMPLEMENTATION_SUMMARY.md – Architecture overview
```

---

## 🔧 Installation

```bash
npm install
npm run build
```

Or install in your frontend:

```bash
cd ../game-core-sdk-frontend
npm install ../game-core-sdk
```

---

## 📖 Quick Start

```javascript
import { coreSDK } from "game-sdk";

// Initialize SDK
await coreSDK.init({
  baseUrl: "http://localhost:3000",
  app: "my-game",
  version: "1.0.0"
});

// Use API clients
const config = await coreSDK.configs.init({
  v: "1.0.0",
  scopes: ["gameplay", "ui"]
});
```

---

## 🎯 API Clients

### Configs (`coreSDK.configs`)
```javascript
await coreSDK.configs.init({ v, scopes, segment })
await coreSDK.configs.fetch({ v, scopes })
```

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get started in 5 minutes
- **[API_USAGE.md](./API_USAGE.md)** - Complete API reference with examples
- **[FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)** - React integration guide
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Technical overview

Backend Swagger docs: `http://localhost:3000/api/docs`





