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
  version: '1.0.0',
  baseUrl: 'https://configs.artintgames.com',      // Configs service URL
  authUrl: ' https://auth.artintgames.com',       // Auth service URL (optional)
  sentryDsn: 'your-sentry-dsn',           // optional
  skipAuth: false                          // Skip guest authentication (default: false)
});
```

### Initialization Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `app` | string | No | Application name |
| `version` | string | No | Application version |
| `baseUrl` | string | No | Base URL for configs/API service |
| `authUrl` | string | No | Auth service URL (separate from baseUrl) |
| `sentryDsn` | string | No | Sentry DSN for error tracking |
| `skipAuth` | boolean | No | Skip guest authentication during init |

## API Clients

The SDK exposes the following API clients through the `coreSDK` instance:

### 1. Auth API (`coreSDK.auth`)

User authentication and registration:

```typescript
// Register new user
const user = await coreSDK.register({
  email: 'user@example.com',
  username: 'john_doe',
  password: 'SecurePassword123!'
});

// Login user
const authResponse = await coreSDK.login({
  email: 'user@example.com',
  password: 'SecurePassword123!'
});
// Returns: { accessToken, refreshToken, user }

// Logout
await coreSDK.logout();

// Get current user profile (via auth client)
const profile = await coreSDK.auth.getMe();

// Refresh token
const newTokens = await coreSDK.auth.refresh();
```

### 2. Configs API (`coreSDK.configs`)

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

### 3. A/B Tests API (`coreSDK.abTests`)

Manage A/B testing experiments:

```typescript
// Get all A/B tests
const allTests = await coreSDK.abTests.getAll();

// Get active A/B tests
const activeTests = await coreSDK.abTests.getActive();

// Get specific A/B test
const test = await coreSDK.abTests.getById('test-id');

// Create new A/B test
const newTest = await coreSDK.abTests.create({
  key: 'test_new_feature',
  name: 'New Feature Test',
  filters: { country: 'US' },
  startDate: Date.now(),
  groups: [
    { key: 'control', name: 'Control', percentage: 50 },
    { key: 'variant', name: 'Variant', percentage: 50 }
  ]
});

// Full update (PUT)
const updated = await coreSDK.abTests.update('test-id', {
  name: 'Updated Test Name',
  groups: [...]
});

// Partial update (PATCH)
const patched = await coreSDK.abTests.patch('test-id', {
  name: 'New Name'
});

// Delete A/B test
await coreSDK.abTests.delete('test-id');
```

### 4. Remote Configs API (`coreSDK.remoteConfigs`)

Manage remote configurations:

```typescript
// Get all remote configurations
const allConfigs = await coreSDK.remoteConfigs.getAll();

// Get specific remote config
const config = await coreSDK.remoteConfigs.getById('config-id');

// Create new remote configuration
const newConfig = await coreSDK.remoteConfigs.create({
  key: 'ui_settings',
  scope: 'ui',
  name: 'UI Settings',
  filters: { platform: 'web' },
  data: { theme: 'dark', language: 'en' }
});

// Update remote configuration
const updated = await coreSDK.remoteConfigs.update('config-id', {
  data: { theme: 'light' }
});

// Delete remote configuration
await coreSDK.remoteConfigs.delete('config-id');
```

### 5. Segments API (`coreSDK.segments`)

Manage user segments:

```typescript
// Get all segments
const allSegments = await coreSDK.segments.getAll();

// Get specific segment
const segment = await coreSDK.segments.getById('segment-id');

// Create new segment
const newSegment = await coreSDK.segments.create({
  name: 'Premium Users',
  description: 'Users with premium subscription',
  filters: { subscriptionType: 'premium' }
});

// Update segment
const updated = await coreSDK.segments.update('segment-id', {
  name: 'VIP Users'
});

// Delete segment
await coreSDK.segments.delete('segment-id');
```

### 6. Users API (`coreSDK.users`)

Manage users:

```typescript
// Get all users
const allUsers = await coreSDK.users.getAll();

// Get specific user
const user = await coreSDK.users.getById('user-id');

// Create new user
const newUser = await coreSDK.users.create({
  email: 'user@example.com',
  username: 'john_doe',
  password: 'SecurePassword123!'
});

// Update user
const updated = await coreSDK.users.update('user-id', {
  email: 'newemail@example.com'
});

// Delete user
await coreSDK.users.delete('user-id');
```

### 7. Health API (`coreSDK.health`)

Check service health and version:

```typescript
// Get service version
const version = await coreSDK.health.getVersion();
console.log(version.version, version.name);

// Health check
const health = await coreSDK.health.check();
console.log(health.status, health.timestamp);
```

### 8. KV Storage API (`coreSDK.kv`)

Key-Value storage using Redis:

```typescript
// Health check for KV service
const kvHealth = await coreSDK.kv.health();
console.log(kvHealth.status, kvHealth.redis?.connected);

// List all keys
const { keys } = await coreSDK.kv.list();
console.log('Stored keys:', keys);

// Set a value
await coreSDK.kv.set('player:settings', JSON.stringify({ sound: true, music: false }));

// Get a value
const { value } = await coreSDK.kv.get('player:settings');
const settings = JSON.parse(value);

// Delete a key
await coreSDK.kv.delete('player:settings');

// Check if key exists
const exists = await coreSDK.kv.exists('player:settings');

// Batch operations
// Get multiple values at once
const values = await coreSDK.kv.getMany(['key1', 'key2', 'key3']);
// Returns: { key1: 'value1', key2: 'value2', key3: null }

// Set multiple values at once
await coreSDK.kv.setMany({
  'player:level': '5',
  'player:score': '1000',
  'player:name': 'John'
});

// Delete multiple keys at once
await coreSDK.kv.deleteMany(['key1', 'key2', 'key3']);
```

#### Common Use Cases

```typescript
// Player Settings
await coreSDK.kv.set('settings:sound', 'true');
await coreSDK.kv.set('settings:music', 'false');
await coreSDK.kv.set('settings:language', 'en');

// Game Progress
await coreSDK.kv.set('progress:level', '5');
await coreSDK.kv.set('progress:checkpoint', 'boss_room');

// Statistics
await coreSDK.kv.set('stats:playtime', '3600');
await coreSDK.kv.set('stats:highscore', '15000');

// Tutorial Flags
await coreSDK.kv.set('tutorial:intro_completed', 'true');
await coreSDK.kv.set('tutorial:combat_completed', 'true');
```

## Using Standalone API Clients

You can also use the API clients independently:

```typescript
import {
  ApiClient,
  ConfigsApiClient,
  AbTestsApiClient,
  RemoteConfigsApiClient,
  AuthApiClient,
  KVApiClient
} from 'game-sdk';

// Create API client with custom auth token getter
const apiClient = new ApiClient(() => 'your-auth-token');

// Create specific API clients
const configsClient = new ConfigsApiClient(apiClient);
const abTestsClient = new AbTestsApiClient(apiClient);
const authClient = new AuthApiClient(() => 'your-auth-token');

// Use the clients
const config = await configsClient.init({ v: '1.0.0' });
const tests = await abTestsClient.getActive();
```

## TypeScript Types

All API request and response types are exported:

```typescript
import type {
  // Authentication
  LoginCredentials,
  RegisterData,
  AuthResponse,
  UserProfile,

  // Configs
  InitConfigRequest,
  FetchConfigRequest,
  ConfigResponse,

  // A/B Tests
  AbTest,
  AbTestGroup,
  CreateAbTestRequest,
  UpdateAbTestRequest,
  AbTestListResponse,

  // Remote Configs
  RemoteConfig,
  CreateRemoteConfigRequest,
  UpdateRemoteConfigRequest,
  RemoteConfigListResponse,

  // Segments
  Segment,
  CreateSegmentRequest,
  UpdateSegmentRequest,
  SegmentListResponse,

  // Users
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserListResponse,

  // Health
  VersionResponse,
  HealthResponse,

  // KV Storage
  KVHealthResponse,
  KVListResponse,
  KVGetResponse,
  KVSetRequest,
  KVSetResponse,

  // SDK Options
  CoreSDKOptions,
  SystemParams
} from 'game-sdk';
```

## Error Handling

All API methods throw errors on failure. Validation errors from the server are automatically parsed and joined:

```typescript
try {
  const user = await coreSDK.register({
    email: 'invalid',
    username: 'ab',  // too short
    password: '123'  // too weak
  });
} catch (error) {
  // Error message contains all validation errors:
  // "email must be an email, username must be at least 3 characters, password is too weak"
  console.error('Registration failed:', error.message);
}
```

## Authentication

The SDK provides multiple authentication methods:

### Guest Authentication (Automatic)

By default, the SDK performs guest authentication on initialization:

```typescript
await coreSDK.init({
  baseUrl: 'https://configs.artintgames.com'
});
// Guest token is automatically obtained and cached
```

To skip guest authentication:

```typescript
await coreSDK.init({
  baseUrl: 'https://configs.artintgames.com',
  skipAuth: true
});
```

### User Authentication

```typescript
// Register new user
const user = await coreSDK.register({
  email: 'user@example.com',
  username: 'john_doe',
  password: 'SecurePassword123!'
});

// Login
const { accessToken, user } = await coreSDK.login({
  email: 'user@example.com',
  password: 'SecurePassword123!'
});

// Token is automatically stored and used for subsequent requests

// Logout
await coreSDK.logout();
// Token is cleared from localStorage
```

### Token Storage

Tokens are automatically stored in localStorage:
- `coreSDK_token` - Authentication token
- `coreSDK_deviceId` - Device identifier

## Direct API Access

For endpoints not covered by specialized clients, use the base API client:

```typescript
// Access the base API client
const response = await coreSDK.api.get('/v1/custom/endpoint');
const data = await coreSDK.api.post('/v1/custom/endpoint', { data: 'value' });
```

## Event Bus

The SDK includes an event bus for inter-component communication:

```typescript
// Subscribe to events
coreSDK.on('core:initialized', (systemParams) => {
  console.log('SDK initialized', systemParams);
});

// Auth window events
coreSDK.on('core:authWindowOpen', () => {
  console.log('Auth window opened');
});

coreSDK.on('core:authWindowClose', () => {
  console.log('Auth window closed');
});

// Emit custom events
coreSDK.emit('game:event', { data: 'value' });

// Unsubscribe from events
coreSDK.off('core:initialized', handler);

// One-time listener
coreSDK.once('core:initialized', (systemParams) => {
  console.log('SDK initialized (once)');
});
```

## Complete Example

```typescript
import { coreSDK } from 'game-sdk';

async function main() {
  // Initialize SDK with separate auth service
  await coreSDK.init({
    app: 'my-game',
    version: '1.0.0',
    baseUrl: 'https://configs.artintgames.com',
    authUrl: ' https://auth.artintgames.com',
    skipAuth: true  // We'll handle auth manually
  });

  // Check service health
  const health = await coreSDK.health.check();
  console.log('Service status:', health.status);

  // Register new user
  try {
    const user = await coreSDK.register({
      email: 'player@game.com',
      username: 'player1',
      password: 'SecurePassword123!'
    });
    console.log('Registered:', user);
  } catch (error) {
    console.log('Registration failed (user may exist):', error.message);
  }

  // Login
  const { accessToken, user } = await coreSDK.login({
    email: 'player@game.com',
    password: 'SecurePassword123!'
  });
  console.log('Logged in as:', user.username);

  // Initialize game configuration
  const config = await coreSDK.configs.init({
    v: '1.0.0',
    scopes: ['gameplay', 'ui'],
    segment: 'default'
  });
  console.log('Config loaded:', config);

  // Get active A/B tests
  const activeTests = await coreSDK.abTests.getActive();
  console.log('Active tests:', activeTests);

  // Get remote configurations
  const remoteConfigs = await coreSDK.remoteConfigs.getAll();
  console.log('Remote configs:', remoteConfigs);

  // Logout when done
  await coreSDK.logout();
}

main().catch(console.error);
```

## API Versioning

All API endpoints use the `/v1` prefix:

- Auth: `/v1/auth/login`, `/v1/auth/registration`, `/v1/auth/logout`
- Configs: `/v1/configs/init`, `/v1/configs/fetch`
- A/B Tests: `/v1/ab-tests`
- Remote Configs: `/v1/remote-configs`
- Segments: `/v1/segments`
- Users: `/v1/users`
- Health: `/v1/version`, `/v1/health`
- KV Storage: `/v1/kv/health`, `/v1/kv/list`, `/v1/kv/get/:key`, `/v1/kv/set`, `/v1/kv/:key`

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
  const sdk = window.coreSDK.coreSDK;
  sdk.init({
    app: 'my-game',
    version: '1.0.0',
    baseUrl: 'https://configs.artintgames.com'
  }).then(() => {
    console.log('SDK ready');
  });
</script>
```

---

**Last Updated**: December 2025
**Version**: 1.0.1
