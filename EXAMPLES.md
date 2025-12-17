# SDK Examples

Ready-to-use code examples for testing the Game Core SDK in browser console.

---

## Setup

1. Open **http://localhost:3333/Demo.html** (see [QUICK_START_DEMO.md](./QUICK_START_DEMO.md))
2. Open browser DevTools (`F12` or `Ctrl+Shift+I`)
3. Go to **Console** tab
4. Copy and paste the examples below

---

## Get SDK Instance

```javascript
// Get the SDK instance
const sdk = window.coreSDK;
console.log('SDK:', sdk);
```

---

## Authentication

### Guest Login

```javascript
// Guest authentication (automatic device ID)
const guestResult = await coreSDK.auth.guest();
console.log('Guest auth:', guestResult);
```

### Register New User

```javascript
// Register a new user
const registerResult = await coreSDK.register({
  email: 'test@example.com',
  username: 'testuser',
  password: 'TestPassword123!'
});
console.log('Register result:', registerResult);
```

### Login

```javascript
// Login with email and password
const loginResult = await coreSDK.login({
  email: 'test@example.com',
  password: 'TestPassword123!'
});
console.log('Login result:', loginResult);
console.log('Token:', loginResult.accessToken);
console.log('User:', loginResult.user);
```

### Get Current User

```javascript
// Get current authenticated user
const me = await coreSDK.auth.getMe();
console.log('Current user:', me);
```

### Logout

```javascript
// Logout and clear token
await coreSDK.logout();
console.log('Logged out');
```

---

## Health Check

### Service Version

```javascript
// Get service version
const version = await coreSDK.health.getVersion();
console.log('Version:', version);
```

### Health Status

```javascript
// Check service health
const health = await coreSDK.health.check();
console.log('Health:', health);
```

---

## Configurations

### Initialize Config

```javascript
// Initialize configuration for your app
const config = await coreSDK.configs.init({
  v: '1.0.0',
  scopes: ['gameplay', 'ui']
});
console.log('Config:', config);
```

### Fetch Config

```javascript
// Fetch updated configuration
const updatedConfig = await coreSDK.configs.fetch({
  v: '1.0.0',
  scopes: ['gameplay']
});
console.log('Updated config:', updatedConfig);
```

---

## A/B Tests

### Get All Tests

```javascript
// Get all A/B tests
const allTests = await coreSDK.abTests.getAll();
console.log('All A/B tests:', allTests);
```

### Get Active Tests

```javascript
// Get only active A/B tests
const activeTests = await coreSDK.abTests.getActive();
console.log('Active tests:', activeTests);
```

### Get Test by ID

```javascript
// Get specific A/B test (replace with real ID)
const testId = 'your-test-id';
const test = await coreSDK.abTests.getById(testId);
console.log('Test:', test);
```

### Get User's Variant

```javascript
// Get which variant the user is assigned to
const testId = 'your-test-id';
const variant = await coreSDK.abTests.getVariant(testId);
console.log('My variant:', variant);
```

---

## Remote Configs

### Get All Remote Configs

```javascript
// Get all remote configurations
const remoteConfigs = await coreSDK.remoteConfigs.getAll();
console.log('Remote configs:', remoteConfigs);
```

### Get Remote Config by ID

```javascript
// Get specific remote config (replace with real ID)
const configId = 'your-config-id';
const remoteConfig = await coreSDK.remoteConfigs.getById(configId);
console.log('Remote config:', remoteConfig);
```

---

## Segments

### Get All Segments

```javascript
// Get all user segments
const segments = await coreSDK.segments.getAll();
console.log('Segments:', segments);
```

### Get User's Segments

```javascript
// Get segments the current user belongs to
const userSegments = await coreSDK.segments.getUserSegments();
console.log('My segments:', userSegments);
```

---

## KV Storage

### Check KV Health

```javascript
// Check KV storage service health
const kvHealth = await coreSDK.kv.health();
console.log('KV Health:', kvHealth);
```

### List All Keys

```javascript
// List all stored keys
const keys = await coreSDK.kv.list();
console.log('Keys:', keys);
```

### Set Value

```javascript
// Store a value
await coreSDK.kv.set('my-key', 'my-value');
console.log('Value saved');
```

### Get Value

```javascript
// Retrieve a value
const result = await coreSDK.kv.get('my-key');
console.log('Value:', result.value);
```

### Delete Value

```javascript
// Delete a key
await coreSDK.kv.delete('my-key');
console.log('Key deleted');
```

### Store JSON

```javascript
// Store JSON object
const settings = { sound: true, music: false, volume: 80 };
await coreSDK.kv.set('player-settings', JSON.stringify(settings));
console.log('Settings saved');

// Retrieve JSON object
const result = await coreSDK.kv.get('player-settings');
const loadedSettings = JSON.parse(result.value);
console.log('Settings:', loadedSettings);
```

---

## User Profile

### Get My Profile

```javascript
// Get current user profile
const profile = await coreSDK.profile.getMe();
console.log('My profile:', profile);
```

### Update Profile

```javascript
// Update profile data
const updatedProfile = await coreSDK.profile.update({
  displayName: 'New Display Name'
});
console.log('Updated profile:', updatedProfile);
```

### Get Profile by GID

```javascript
// Get another user's profile (replace with real GID)
const gid = 'user-gid-here';
const otherProfile = await coreSDK.profile.getByGid(gid);
console.log('Profile:', otherProfile);
```

---

## Events

### Send Event

```javascript
// Send analytics event
await coreSDK.events.send({
  name: 'game_start',
  data: { level: 1, mode: 'classic' },
  timestamp: Date.now()
});
console.log('Event sent');
```

### Get All Events

```javascript
// Get all events
const events = await coreSDK.events.getAll();
console.log('Events:', events);
```

---

## Event Bus

### Subscribe to Events

```javascript
// Listen for SDK events
sdk.on('core:initialized', (params) => {
  console.log('SDK initialized:', params);
});

sdk.on('core:authWindowOpen', () => {
  console.log('Auth window opened');
});

sdk.on('core:authWindowClose', () => {
  console.log('Auth window closed');
});
```

### Emit Custom Event

```javascript
// Emit your own event
sdk.emit('game:level_complete', { level: 5, score: 1500 });
```

### One-time Listener

```javascript
// Listen only once
sdk.once('game:level_complete', (data) => {
  console.log('Level completed:', data);
});
```

---

## Complete Test Flow

```javascript
// Full test flow - copy and paste this entire block
(async () => {
  const sdk = window.coreSDK;

  console.log('=== SDK Test Flow ===\n');

  // 1. Check health
  console.log('1. Checking health...');
  const health = await coreSDK.health.check();
  console.log('Health:', health.status);

  // 2. Get version
  console.log('\n2. Getting version...');
  const version = await coreSDK.health.getVersion();
  console.log('Version:', version.version);

  // 3. Guest auth
  console.log('\n3. Guest authentication...');
  const guest = await coreSDK.auth.guest();
  console.log('Guest token received:', !!guest.accessToken);

  // 4. Get configs
  console.log('\n4. Getting configs...');
  try {
    const config = await coreSDK.configs.init({ v: '1.0.0', scopes: ['gameplay'] });
    console.log('Config:', config);
  } catch (e) {
    console.log('Config error (expected if not configured):', e.message);
  }

  // 5. Get A/B tests
  console.log('\n5. Getting A/B tests...');
  try {
    const tests = await coreSDK.abTests.getActive();
    console.log('Active tests:', tests.items?.length || 0);
  } catch (e) {
    console.log('A/B tests error:', e.message);
  }

  // 6. KV Storage test
  console.log('\n6. Testing KV Storage...');
  try {
    await coreSDK.kv.set('test-key', 'test-value-' + Date.now());
    const result = await coreSDK.kv.get('test-key');
    console.log('KV test value:', result.value);
    await coreSDK.kv.delete('test-key');
    console.log('KV test key deleted');
  } catch (e) {
    console.log('KV error:', e.message);
  }

  console.log('\n=== Test Flow Complete ===');
})();
```

---

## Error Handling

```javascript
// Wrap API calls in try-catch
try {
  const result = await coreSDK.login({
    email: 'wrong@email.com',
    password: 'wrongpassword'
  });
} catch (error) {
  console.error('Error:', error.message);
  // Error messages from server are automatically parsed
}
```

---

## Check Token

```javascript
// Check current stored token
const token = localStorage.getItem('coreSDK_token');
console.log('Stored token:', token ? 'Yes' : 'No');

// Check device ID
const deviceId = localStorage.getItem('coreSDK_deviceId');
console.log('Device ID:', deviceId);
```

---

**Last Updated**: December 2025
