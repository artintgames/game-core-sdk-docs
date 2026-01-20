# Game SDK

![version](https://img.shields.io/badge/version-1.0.80-blue.svg)
![license](https://img.shields.io/badge/license-MIT-lightgrey.svg)

Frontend SDK for browser and mobile game clients. Full integration with AI Games Platform API.

---

## Files

| File | Format | Size | Usage |
|------|--------|------|-------|
| `game-sdk.es.js` | ES Module | ~63KB | Modern bundlers (Vite, Webpack, Rollup) |
| `game-sdk.umd.js` | UMD | ~62KB | Script tag, legacy bundlers |

---

## Installation

### ES Module (recommended)

```javascript
import { coreSDK } from './game-sdk.es.js';
```

### UMD (script tag)

```html
<script src="game-sdk.umd.js"></script>
<script>
  // Global variable available
  const { coreSDK } = window.GameSDK;
</script>
```

---

## Quick Start

### ES Module

```javascript
import { coreSDK } from './game-sdk.es.js';

await coreSDK.init({
  configUrl: 'https://api.example.com/configs',
  authUrl: 'https://api.example.com/auth',
  profileUrl: 'https://api.example.com/profile',
  app: 'my-game',
  version: '1.0.0'
}, () => {
  console.log('SDK ready!');
});

// Load configs
const configs = await coreSDK.initConfigs({
  version: '1.0.0',
  scopes: ['gameplay', 'ui']
});

const maxLives = configs.get('gameplay.maxLives');
```

### UMD (HTML page)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Game</title>
</head>
<body>
  <script src="game-sdk.umd.js"></script>
  <script>
    const { coreSDK } = window.GameSDK;

    async function startGame() {
      await coreSDK.init({
        configUrl: 'https://api.example.com/configs',
        authUrl: 'https://api.example.com/auth',
        profileUrl: 'https://api.example.com/profile',
        app: 'my-game',
        version: '1.0.0'
      });

      console.log('SDK initialized!');
    }

    startGame();
  </script>
</body>
</html>
```

---

## Initialization

### coreSDK.init(options, onAuthReady?)

Initialize the SDK with service URLs and configuration.

```javascript
await coreSDK.init({
  // Required: Backend service URLs
  configUrl: 'https://api.example.com/configs',   // Configs service (port 3000)
  authUrl: 'https://api.example.com/auth',        // Auth service (port 3001)
  profileUrl: 'https://api.example.com/profile',  // Profile service (port 3002)

  // Required: Application info
  app: 'my-game',
  version: '1.0.0',

  // Optional
  sentryDsn: 'https://xxx@sentry.io/123',  // Error tracking
  skipAuth: false                           // Skip auto guest login
}, () => {
  // Called when auth is ready
  console.log('Auth ready! Can use protected API.');
});
```

### Options

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `configUrl` | string | Yes | Configs service URL |
| `authUrl` | string | Yes | Auth service URL |
| `profileUrl` | string | Yes | Profile service URL |
| `app` | string | Yes | Application identifier |
| `version` | string | Yes | App version (semver) |
| `sentryDsn` | string | No | Sentry DSN for error tracking |
| `skipAuth` | boolean | No | Skip automatic guest auth (default: false) |

---

## Authentication

### Guest Login

```javascript
await coreSDK.loginAsGuest();
```

### Google Sign-In

```javascript
// Get Google ID token
const { credential } = await coreSDK.getGoogleIdToken();

// Login with token
await coreSDK.loginWithGoogle(credential);

// Or with One Tap prompt
const { credential } = await coreSDK.getGoogleIdToken({ useOneTap: true });
await coreSDK.loginWithGoogle(credential);
```

### Email Sign-In

```javascript
// Step 1: Request verification code
const { rid } = await coreSDK.signinWithEmail('user@example.com');

// Step 2: Confirm code (6-digit code sent to email)
const authResponse = await coreSDK.confirmCode(rid, 123456);
```

### Check Auth Status

```javascript
// Simple checks
const isAuth = coreSDK.isAuthenticated();  // true/false
const isGuest = coreSDK.isGuest();         // true/false

// Detailed status
const status = coreSDK.getAuthStatus();
// {
//   isAuthenticated: true,
//   authType: "google",      // "guest" | "google" | "email" | "apple" | "unknown"
//   isAnonymous: false
// }
```

### Logout

```javascript
await coreSDK.logout();
```

---

## Configs API

### Initialize Configs

Load configs with segment and A/B test assignment.

```javascript
const configs = await coreSDK.initConfigs({
  version: '1.0.0',
  scopes: ['gameplay', 'ui', 'monetization'],
  values: {                    // Optional: user context for filtering
    country: 'US',
    isPremium: true,
    level: 50
  }
});
```

### Fetch Additional Configs

```javascript
const configs = await coreSDK.fetchConfigs({
  version: '1.0.0',
  scopes: ['social', 'events']
});
```

### Get Config Values

```javascript
// Direct access (cached)
const maxLives = coreSDK.getConfig('gameplay', 'maxLives');
const allGameplay = coreSDK.getConfigsByScope('gameplay');

// Get segment and A/B test
const segment = coreSDK.getSegment();           // "premium"
const { ab, abG, abExp } = coreSDK.getABTest(); // { ab: "test_v2", abG: "control", abExp: 1698345600000 }
```

### ConfigResult Helper

`initConfigs()` and `fetchConfigs()` return a `ConfigResult` object with helper methods:

```javascript
const configs = await coreSDK.initConfigs({ version: '1.0.0', scopes: ['gameplay'] });

// Get value by path (supports dot-notation)
configs.get('gameplay.maxLives');           // 3
configs.get('gameplay.rewards.daily');      // { coins: 100 }
configs.get('gameplay.items[0].name');      // "sword"

// Type-safe get
configs.get<number>('gameplay.maxLives');   // 3 (typed as number)

// Check existence
configs.has('gameplay.maxLives');           // true
configs.has('gameplay.notExists');          // false

// Get all keys (flat format)
configs.keys();
// ['gameplay.maxLives', 'gameplay.rewards', 'ui.theme']

// Get all values
configs.values();
// [3, { daily: { coins: 100 } }, 'dark']

// Get entire scope
configs.getScope('gameplay');
// { maxLives: 3, rewards: { daily: { coins: 100 } } }

// Get all configs
configs.getAll();
// { gameplay: {...}, ui: {...} }

// Get metadata (segment, A/B test)
configs.getMeta();
// { segment: 'premium', ab: 'test_v2', abG: 'control', abExp: 1698345600000 }

// Get raw response
configs.raw();
// Original ConfigResponse object
```

---

## Profile API

Work with player profiles (JSON data with scopes).

### Get Profile

```javascript
const profile = await coreSDK.profile.getProfile();
// {
//   id: "player-123",
//   version: 5,
//   updatedAt: "2024-01-15T10:30:00Z",
//   base: { name: "Player1", avatar: null, locale: "en" },
//   scopes: {
//     game: { level: 10, coins: 500, achievements: ["first_win"] },
//     social: { friendsCount: 5, referralCode: "ABC123" },
//     stats: { gamesPlayed: 100, gamesWon: 30, winRate: 0.3 }
//   },
//   custom: {}
// }
```

### Get Field by Path

```javascript
const level = await coreSDK.profile.getProfileField('scopes.game.level');
// 10
```

### Update Profile (partial merge)

```javascript
await coreSDK.profile.updateProfile({
  base: { name: 'NewName' },
  scopes: {
    game: { level: 15, coins: 1000 }
  }
});
```

### Set Field by Path

```javascript
await coreSDK.profile.setProfileField('scopes.game.coins', 2000);
```

### Merge Scope

```javascript
await coreSDK.profile.mergeProfileScope('game', {
  xp: 500,
  level: 20,
  achievements: ['boss_defeated']
});
```

### Cache Management

```javascript
coreSDK.profile.invalidate();        // Invalidate current profile cache
coreSDK.profile.invalidateAll();     // Invalidate all cached profiles
coreSDK.profile.resetMyProfileId();  // Reset stored profile ID
```

---

## KV Storage API

Key-Value storage for player data.

### Single Operations

```javascript
// Get value
const { value } = await coreSDK.playerKv.get('settings');

// Set value (always string)
await coreSDK.playerKv.set('settings', JSON.stringify({ theme: 'dark' }));

// Delete
await coreSDK.playerKv.delete('settings');

// Check existence
const { exists } = await coreSDK.playerKv.exists('settings');

// List all keys
const { keys } = await coreSDK.playerKv.list();
```

### Batch Operations

```javascript
// Get multiple
const values = await coreSDK.playerKv.getMany(['key1', 'key2', 'key3']);
// [{ key: 'key1', value: '...' }, { key: 'key2', value: '...' }, ...]

// Set multiple
await coreSDK.playerKv.setMany([
  { key: 'settings', value: JSON.stringify({ theme: 'dark' }) },
  { key: 'progress', value: JSON.stringify({ level: 5 }) }
]);

// Delete multiple
await coreSDK.playerKv.deleteMany(['key1', 'key2', 'key3']);
```

---

## Health API

Check backend service health.

```javascript
// Quick health check
const health = await coreSDK.health.check();
// { status: 'ok', timestamp: 1698345600000 }

// Get version
const { version, name } = await coreSDK.health.version();
// { version: '1.2.5', name: 'configs-service' }

// Detailed check with dependencies
const detailed = await coreSDK.health.detailed();
// { status: 'ok', database: 'ok', redis: 'ok', ... }
```

---

## Events

### Subscribe to Events

```javascript
// SDK ready
coreSDK.on('core:initialized', (params) => {
  console.log('SDK initialized with:', params);
});

// Auth success
coreSDK.on('core:authSuccess', ({ type, uid, gid, anonymous }) => {
  console.log(`Logged in as ${type}, uid: ${uid}`);
});

// Auth error
coreSDK.on('core:authError', ({ error }) => {
  console.error('Auth failed:', error);
});

// Profile updated
coreSDK.on('profile.updated', ({ id, profile }) => {
  console.log('Profile updated:', profile);
});
```

### One-time Listener

```javascript
coreSDK.once('core:authSuccess', () => {
  console.log('First auth completed');
});
```

### Unsubscribe

```javascript
const handler = (data) => console.log(data);
coreSDK.on('core:authSuccess', handler);
coreSDK.off('core:authSuccess', handler);
```

### Event List

| Event | Payload | Description |
|-------|---------|-------------|
| `core:initialized` | `SystemParams` | SDK initialized |
| `core:authSuccess` | `{ type, uid, gid, anonymous, isNewGuest? }` | Auth successful |
| `core:authError` | `{ error }` | Auth failed |
| `profile.updated` | `{ id, profile }` | Profile updated |

---

## TypeScript Types

Main interfaces exported by the SDK:

```typescript
interface CoreSDKOptions {
  app?: string;
  version?: string;
  configUrl?: string;
  authUrl?: string;
  profileUrl?: string;
  sentryDsn?: string;
  skipAuth?: boolean;
}

interface AuthResponse {
  uid: number;
  gid: number;
  jwt: string;
  at: number;
  an: boolean;
}

interface AuthStatus {
  isAuthenticated: boolean;
  authType: 'guest' | 'google' | 'email' | 'apple' | 'unknown' | null;
  isAnonymous: boolean;
}

interface ConfigResponse {
  segment?: string;
  ab?: string;
  abG?: string;
  abExp?: number;
  configs?: Record<string, Record<string, unknown>>;
}

interface ProfileData {
  id: string;
  version: number;
  updatedAt: string;
  base: { name: string; avatar: string | null; locale: string };
  scopes: {
    game: { level: number; score: number; xp: number; coins: number; achievements: string[] };
    social: { friendsCount: number; referralCode: string | null };
    stats: { gamesPlayed: number; gamesWon: number; totalScore: number; highestScore: number; winRate: number };
  };
  custom: Record<string, unknown>;
}
```

---

## Complete Example

### HTML + UMD

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Game</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    .status { padding: 10px; margin: 10px 0; background: #f0f0f0; }
  </style>
</head>
<body>
  <h1>My Game</h1>
  <div id="status" class="status">Loading...</div>
  <button id="guest-btn">Login as Guest</button>
  <button id="profile-btn">Get Profile</button>

  <script src="game-sdk.umd.js"></script>
  <script>
    const { coreSDK } = window.GameSDK;
    const statusEl = document.getElementById('status');

    // Event listeners
    coreSDK.on('core:authSuccess', ({ type, uid }) => {
      statusEl.textContent = `Logged in as ${type}, uid: ${uid}`;
    });

    coreSDK.on('core:authError', ({ error }) => {
      statusEl.textContent = `Auth error: ${error.message}`;
    });

    // Initialize SDK
    async function init() {
      await coreSDK.init({
        configUrl: 'https://api.example.com/configs',
        authUrl: 'https://api.example.com/auth',
        profileUrl: 'https://api.example.com/profile',
        app: 'my-game',
        version: '1.0.0',
        skipAuth: true  // Manual auth
      });

      statusEl.textContent = 'SDK ready. Click "Login as Guest" to authenticate.';

      // Load configs
      const configs = await coreSDK.initConfigs({
        version: '1.0.0',
        scopes: ['gameplay']
      });

      console.log('Max lives:', configs.get('gameplay.maxLives'));
    }

    // Button handlers
    document.getElementById('guest-btn').onclick = async () => {
      await coreSDK.loginAsGuest();
    };

    document.getElementById('profile-btn').onclick = async () => {
      if (!coreSDK.isAuthenticated()) {
        alert('Please login first');
        return;
      }
      const profile = await coreSDK.profile.getProfile();
      console.log('Profile:', profile);
      alert(`Profile loaded: ${profile.base.name}, Level: ${profile.scopes.game.level}`);
    };

    init();
  </script>
</body>
</html>
```

### React + ES Module

```jsx
import { useEffect, useState } from 'react';
import { coreSDK } from './game-sdk.es.js';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function initSDK() {
      await coreSDK.init({
        configUrl: import.meta.env.VITE_CONFIG_URL,
        authUrl: import.meta.env.VITE_AUTH_URL,
        profileUrl: import.meta.env.VITE_PROFILE_URL,
        app: 'my-game',
        version: '1.0.0'
      }, () => {
        setIsReady(true);
      });
    }

    coreSDK.on('core:authSuccess', async () => {
      const p = await coreSDK.profile.getProfile();
      setProfile(p);
    });

    initSDK();
  }, []);

  if (!isReady) {
    return <div>Loading SDK...</div>;
  }

  return (
    <div>
      <h1>My Game</h1>
      {profile && (
        <div>
          <p>Welcome, {profile.base.name}!</p>
          <p>Level: {profile.scopes.game.level}</p>
          <p>Coins: {profile.scopes.game.coins}</p>
        </div>
      )}
    </div>
  );
}

export default App;
```

---

## Error Handling

```javascript
try {
  await coreSDK.init({ ... });
} catch (error) {
  if (error.message.includes('SDK not initialized')) {
    // Call init() first
  }
  if (error.status === 401) {
    // Token expired, re-authenticate
    await coreSDK.loginAsGuest();
  }
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `SDK not initialized` | Using API before init() | Call `coreSDK.init()` first |
| `401 Unauthorized` | Token expired | Re-authenticate |
| `CORS error` | Backend CORS not configured | Configure CORS on backend |
| `Google Sign-In: origin not allowed` | Origin not in Google Console | Add origin to Google Cloud Console |

---

## API Clients

Direct access to API clients for advanced usage:

```javascript
// Configs service
coreSDK.configs       // ConfigsApiClient
coreSDK.abTests       // AbTestsApiClient
coreSDK.remoteConfigs // RemoteConfigsApiClient
coreSDK.segments      // SegmentsApiClient
coreSDK.health        // HealthApiClient
coreSDK.events        // EventsApiClient

// Auth service
coreSDK.auth          // AuthApiClient
coreSDK.users         // UsersApiClient

// Profile service
coreSDK.profile       // Profile module
coreSDK.playerKv      // PlayerKVApiClient
coreSDK.gamestate     // ProfileApiClient
```

---

## Support

For issues and feature requests, contact the development team.
