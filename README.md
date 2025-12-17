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
- **Built-in EventBus** - `on`, `once`, `off`, `emit`
- **API Clients** - Configs, A/B Tests, Remote Configs, Segments, Users, Health, Auth, KV Storage, Events, Profile
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
    UsersApiClient.ts       – User management (uses authUrl)
    HealthApiClient.ts      – Health checks
    AuthApiClient.ts        – Authentication (uses authUrl)
    KVApiClient.ts          – Key-Value storage
    EventsApiClient.ts      – Event tracking
  profile/                  – Profile module
    Profile.ts              – User profile management (uses authUrl)
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
  baseUrl: "https://configs.artintgames.com",    // Main API server
  authUrl: " https://auth.artintgames.com",    // Auth service (users, profile, auth)
  app: "my-game",
  version: "1.0.0"
});

// Use API clients
const config = await coreSDK.configs.init({
  v: "1.0.0",
  scopes: ["gameplay", "ui"]
});

const tests = await coreSDK.abTests.getActive();
console.log("Active A/B tests:", tests);
```

---

## 🎯 API Clients

### Configs (`coreSDK.configs`)
```javascript
await coreSDK.configs.init({ v, scopes, segment })
await coreSDK.configs.fetch({ v, scopes })
```

### A/B Tests (`coreSDK.abTests`)
```javascript
await coreSDK.abTests.getAll()
await coreSDK.abTests.getActive()
await coreSDK.abTests.getById(id)
await coreSDK.abTests.getVariant(id)
await coreSDK.abTests.create({ key, name, groups, filters, startDate, endDate })
await coreSDK.abTests.update(id, data)
await coreSDK.abTests.patch(id, partial)
await coreSDK.abTests.delete(id)
```

### Remote Configs (`coreSDK.remoteConfigs`)
```javascript
await coreSDK.remoteConfigs.getAll()
await coreSDK.remoteConfigs.getById(id)
await coreSDK.remoteConfigs.create({ key, scope, name, value, dataType, description })
await coreSDK.remoteConfigs.update(id, data)
await coreSDK.remoteConfigs.delete(id)
await coreSDK.remoteConfigs.refresh()
```

### Segments (`coreSDK.segments`)
```javascript
await coreSDK.segments.getAll()
await coreSDK.segments.getById(id)
await coreSDK.segments.getUserSegments()
await coreSDK.segments.create({ key, name, description, filters })
await coreSDK.segments.update(id, data)
await coreSDK.segments.delete(id)
```

### Users (`coreSDK.users`) - uses authUrl
```javascript
await coreSDK.users.getAll()
await coreSDK.users.getById(id)
await coreSDK.users.search(query)
await coreSDK.users.create({ email, username, password })
await coreSDK.users.update(id, data)
await coreSDK.users.delete(id)
```

### Health (`coreSDK.health`)
```javascript
await coreSDK.health.getVersion()
await coreSDK.health.check()
await coreSDK.health.detailed()
```

### Auth (`coreSDK.auth`)
```javascript
await coreSDK.auth.guest(deviceId)
await coreSDK.auth.login({ email, password })
await coreSDK.auth.register({ email, username, password })
await coreSDK.auth.logout()
await coreSDK.auth.getMe()
await coreSDK.auth.refresh()
await coreSDK.auth.health()  // Auth service health check
```

### KV Storage (`coreSDK.kv`)
```javascript
await coreSDK.kv.list()
await coreSDK.kv.get(key)
await coreSDK.kv.set(key, value)
await coreSDK.kv.delete(key)
```

### Events (`coreSDK.events`)
```javascript
await coreSDK.events.getAll()
await coreSDK.events.send({ name, data, timestamp })
```

### Profile (`coreSDK.profile`)
```javascript
await coreSDK.profile.getMe()
await coreSDK.profile.getByGid(gid)
await coreSDK.profile.update(payload)
await coreSDK.profile.getSummary(gid)
await coreSDK.profile.getSummaryBatch(gids)
```

---

## 🔑 Event System

```javascript
// Subscribe to events
coreSDK.on("core:initialized", (params) => {
  console.log("SDK ready", params);
});

// Emit custom events
coreSDK.emit("game:finish", { score: 100 });
```

---

## 📚 Documentation

- **[QUICK_START_DEMO.md](./QUICK_START_DEMO.md)** - Run Demo.html locally
- **[EXAMPLES.md](./EXAMPLES.md)** - Ready-to-use code examples for browser console
- **[API_USAGE.md](./API_USAGE.md)** - Complete API reference
- **[FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)** - React integration guide
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Technical overview

Backend Swagger docs: `https://configs.artintgames.com/api/docs`





