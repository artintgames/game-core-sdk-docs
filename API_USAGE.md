# Game Core SDK - API Usage Guide

This SDK provides complete API interaction with the AI Games Platform services including configuration management, A/B testing, user authentication, and more.

## Installation

```bash
npm install game-sdk
```

## Initialization

```typescript
import { coreSDK } from 'game-sdk';

await coreSDK.init({
    app: 'my-game',
    version: '1.0.20',
    baseUrl: 'https://configs.artintgames.com',      // Configs service URL (optional)
    authUrl: 'https://auth.artintgames.com',       // Auth service URL (optional)
    sentryDsn: 'your-sentry-dsn',           // optional
});
```

### Initialization Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `app` | string | No | Application name |
| `version` | string | No | Application version |
| `baseUrl` | string | No | Base API URL (must include /v1) |
| `authUrl` | string | No | Auth API URL (must include /v1) |
| `sentryDsn` | string | No | Sentry DSN for error tracking |

## API Clients

The SDK exposes the following API clients through the `coreSDK` instance:

### 1. Configs API (`coreSDK.configs`)

Initialize and fetch configurations:

```typescript
// Initialize configuration
const config = await coreSDK.configs.init({
  v: '1.0.0',
  scopes: ['gameplay', 'ui'],
  segment: 'premium'
});

// Fetch configuration updates
const updatedConfig = await coreSDK.configs.fetch({
  v: '1.0.0',
  scopes: ['gameplay']
});
```

### 2. KV API (`coreSDK.kv`)

Initialize and fetch configurations:

```typescript
// Fetch all key-value pairs
const kvList = await coreSDK.kv.list();

// Example response
// {
//   items: [
//     { key: "settings.volume", value: "80" },
//     { key: "progress.level", value: "5" }
//   ]
// }
```


## Browser Support

The SDK works in all modern browsers that support:
- ES6 Modules
- Fetch API
- LocalStorage
- Promises/async-await

For legacy browser support, use appropriate polyfills.

## UMD Build

For script tag inclusion:

```html
<script src="/game-sdk.umd.js"></script>
<script>
    const sdk = window.coreSDK;
    sdk.init({
        app: 'my-game',
        version: '1.0.0',
        baseUrl: 'http://localhost/v1'
    }).then(() => {
        console.log('SDK ready');
    });
</script>
```

---

**Last Updated**: December 2025
**Version**: 1.0.20
