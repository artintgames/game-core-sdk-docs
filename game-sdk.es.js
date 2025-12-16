const P = "coreSDK_profiles_v1";
class F {
  constructor(t) {
    this.items = /* @__PURE__ */ new Map(), this.maxItems = t?.maxItems ?? 100, this.loadFromStorage();
  }
  /**
   * Get profile by gid from cache if not expired.
   * Returns null if not found or expired.
   */
  get(t) {
    const e = this.items.get(t);
    if (!e) return null;
    const i = Date.now();
    return i - e.cachedAt > e.ttl ? (this.items.delete(t), this.saveToStorageSafe(), null) : (e.lastAccessed = i, e.profile);
  }
  /**
   * Put/replace profile in cache with given TTL.
   */
  set(t, e) {
    const i = Date.now(), n = {
      profile: t,
      cachedAt: i,
      lastAccessed: i,
      ttl: e
    };
    this.items.set(t.gid, n), this.evictIfNeeded(), this.saveToStorageSafe();
  }
  /**
   * Invalidate specific profile by gid.
   */
  invalidate(t) {
    this.items.delete(t) && this.saveToStorageSafe();
  }
  /**
   * Clear all cache entries.
   */
  invalidateAll() {
    this.items.clear(), this.saveToStorageSafe();
  }
  // internal helpers
  evictIfNeeded() {
    if (this.items.size <= this.maxItems) return;
    const t = Array.from(this.items.entries());
    t.sort(
      (i, n) => i[1].lastAccessed - n[1].lastAccessed
    );
    const e = t.length - this.maxItems;
    for (let i = 0; i < e; i++) {
      const [n] = t[i];
      this.items.delete(n);
    }
  }
  loadFromStorage() {
    if (!(typeof localStorage > "u"))
      try {
        const t = localStorage.getItem(P);
        if (!t) return;
        const e = JSON.parse(t);
        if (e.version !== 1 || !e.items || typeof e.items != "object")
          return;
        const i = Date.now();
        for (const [n, r] of Object.entries(e.items))
          !r || !r.profile || typeof r.cachedAt != "number" || typeof r.ttl != "number" || i - r.cachedAt > r.ttl || this.items.set(n, r);
        this.evictIfNeeded();
      } catch {
      }
  }
  saveToStorageSafe() {
    if (!(typeof localStorage > "u"))
      try {
        const t = {};
        for (const [i, n] of this.items.entries())
          t[i] = n;
        const e = {
          version: 1,
          items: t
        };
        localStorage.setItem(
          P,
          JSON.stringify(e)
        );
      } catch {
      }
  }
}
const v = {
  PROFILE_UPDATED: "profile.updated"
};
class D {
  constructor(t, e) {
    this.cache = new F(), this.meGid = null, this.api = t, this.events = e;
  }
  // Load MY profile
  async getMe() {
    if (this.meGid) {
      const e = this.cache.get(this.meGid);
      if (e) return e;
    }
    const t = await this.api.get("/profile/me");
    return this.meGid = t.gid, this.cache.set(t, 3e5), t;
  }
  // Load OTHER profile by gid
  async getByGid(t) {
    if (this.meGid === t)
      return this.getMe();
    const e = this.cache.get(t);
    if (e) return e;
    const i = await this.api.get(`/profile/${t}`);
    return this.cache.set(i, 6e5), i;
  }
  // Update my profile
  async update(t) {
    const e = await this.api.put("/profile/me", t);
    return this.meGid = e.gid, this.cache.set(e, 3e5), this.events.emit(v.PROFILE_UPDATED, {
      gid: e.gid,
      profile: e
    }), typeof window < "u" && window.dispatchEvent(
      new CustomEvent(v.PROFILE_UPDATED, {
        detail: { gid: e.gid, profile: e }
      })
    ), e;
  }
  // Profile summary
  async getSummary(t) {
    let e = t;
    return e || (e = (await this.getMe()).gid), this.api.get(`/profile/${e}/summary`);
  }
  // Batch summaries
  async getSummaryBatch(t) {
    return (await this.api.post(
      "/profile/batch",
      { gids: t }
    )).profiles ?? [];
  }
  // Cache invalidation
  invalidate(t) {
    this.cache.invalidate(t);
  }
  invalidateAll() {
    this.cache.invalidateAll();
  }
}
const G = "http://localhost:80/v1", H = "http://localhost:3001", S = {
  baseUrl: G,
  authUrl: H
};
function q(s) {
  S.baseUrl = s;
}
function J(s) {
  S.authUrl = s;
}
class z {
  constructor(t) {
    this.getAuthToken = t;
  }
  buildUrl(t) {
    const e = S.baseUrl.replace(/\/+$/, ""), i = t.replace(/^\/+/, "");
    return `${e}/${i}`;
  }
  /**
   * Core request method used by SDK clients.
   */
  async request(t, e = {}) {
    const i = this.buildUrl(t), n = this.getAuthToken(), r = {
      "Content-Type": "application/json",
      ...e.headers
    };
    n && (r.Authorization = `Bearer ${n}`), console.log("[API] REQUEST:", {
      url: i,
      method: e.method ?? "GET",
      headers: r,
      body: e.body
    });
    const o = await fetch(i, {
      ...e,
      headers: r,
      credentials: "include"
    });
    if (!o.ok)
      throw new Error(`Request failed with status ${o.status}`);
    const a = await o.text();
    if (!a) return null;
    try {
      return JSON.parse(a);
    } catch {
      return a;
    }
  }
  /**
   * Normalize body → string | undefined
   */
  normalizeBody(t) {
    return t === void 0 ? void 0 : JSON.stringify(t);
  }
  /**
   * Sends typed HTTP request (internal).
   */
  send(t, e, i) {
    return this.request(e, {
      method: t,
      body: this.normalizeBody(i)
    });
  }
  /**
   * Sends GET request.
   */
  get(t) {
    return this.send("GET", t);
  }
  /**
   * Sends POST request.
   */
  post(t, e) {
    return this.send("POST", t, e);
  }
  /**
   * Sends PUT request.
   */
  put(t, e) {
    return this.send("PUT", t, e);
  }
  /**
   * Sends PATCH request.
   */
  patch(t, e) {
    return this.send("PATCH", t, e);
  }
  /**
   * Sends DELETE request.
   */
  delete(t) {
    return this.send("DELETE", t);
  }
}
class Y {
  constructor() {
    this.listeners = /* @__PURE__ */ new Map(), this.onceListeners = /* @__PURE__ */ new Map();
  }
  /**
   * Subscribes to an event.
   */
  on(t, e) {
    this.listeners.has(t) || this.listeners.set(t, /* @__PURE__ */ new Set()), this.listeners.get(t).add(e);
  }
  /**
   * Subscribes to an event once.
   */
  once(t, e) {
    this.onceListeners.has(t) || this.onceListeners.set(t, /* @__PURE__ */ new Set()), this.onceListeners.get(t).add(e);
  }
  /**
   * Unsubscribes from an event.
   */
  off(t, e) {
    this.listeners.get(t)?.delete(e), this.onceListeners.get(t)?.delete(e);
  }
  /**
   * Emits an event.
   */
  emit(t, ...e) {
    this.listeners.get(t)?.forEach((n) => n(...e));
    const i = this.onceListeners.get(t);
    i && (i.forEach((n) => n(...e)), this.onceListeners.delete(t));
  }
}
const g = typeof __SENTRY_DEBUG__ > "u" || __SENTRY_DEBUG__, h = globalThis, f = "10.27.0";
function K() {
  return w(h), h;
}
function w(s) {
  const t = s.__SENTRY__ = s.__SENTRY__ || {};
  return t.version = t.version || f, t[f] = t[f] || {};
}
function T(s, t, e = h) {
  const i = e.__SENTRY__ = e.__SENTRY__ || {}, n = i[f] = i[f] || {};
  return n[s] || (n[s] = t());
}
const j = "Sentry Logger ", L = {};
function V(s) {
  if (!("console" in h))
    return s();
  const t = h.console, e = {}, i = Object.keys(L);
  i.forEach((n) => {
    const r = L[n];
    e[n] = t[n], t[n] = r;
  });
  try {
    return s();
  } finally {
    i.forEach((n) => {
      t[n] = e[n];
    });
  }
}
function W() {
  A().enabled = !0;
}
function X() {
  A().enabled = !1;
}
function $() {
  return A().enabled;
}
function Q(...s) {
  b("log", ...s);
}
function Z(...s) {
  b("warn", ...s);
}
function tt(...s) {
  b("error", ...s);
}
function b(s, ...t) {
  g && $() && V(() => {
    h.console[s](`${j}[${s}]:`, ...t);
  });
}
function A() {
  return g ? T("loggerSettings", () => ({ enabled: !1 })) : { enabled: !1 };
}
const m = {
  /** Enable logging. */
  enable: W,
  /** Disable logging. */
  disable: X,
  /** Check if logging is enabled. */
  isEnabled: $,
  /** Log a message. */
  log: Q,
  /** Log a warning. */
  warn: Z,
  /** Log an error. */
  error: tt
}, et = Object.prototype.toString;
function st(s, t) {
  return et.call(s) === `[object ${t}]`;
}
function it(s) {
  return st(s, "Object");
}
function nt(s) {
  return !!(s?.then && typeof s.then == "function");
}
function rt(s, t, e) {
  try {
    Object.defineProperty(s, t, {
      // enumerable: false, // the default, so we can save on bundle size by not explicitly setting it
      value: e,
      writable: !0,
      configurable: !0
    });
  } catch {
    g && m.log(`Failed to add non-enumerable property "${t}" to object`, s);
  }
}
function ot(s, t = 0) {
  return typeof s != "string" || t === 0 || s.length <= t ? s : `${s.slice(0, t)}...`;
}
function at() {
  const s = h;
  return s.crypto || s.msCrypto;
}
let E;
function ct() {
  return Math.random() * 16;
}
function _(s = at()) {
  try {
    if (s?.randomUUID)
      return s.randomUUID().replace(/-/g, "");
  } catch {
  }
  return E || (E = "10000000100040008000" + 1e11), E.replace(
    /[018]/g,
    (t) => (
      // eslint-disable-next-line no-bitwise
      (t ^ (ct() & 15) >> t / 4).toString(16)
    )
  );
}
const x = 1e3;
function B() {
  return Date.now() / x;
}
function ht() {
  const { performance: s } = h;
  if (!s?.now || !s.timeOrigin)
    return B;
  const t = s.timeOrigin;
  return () => (t + s.now()) / x;
}
let k;
function ut() {
  return (k ?? (k = ht()))();
}
function lt(s, t = {}) {
  if (t.user && (!s.ipAddress && t.user.ip_address && (s.ipAddress = t.user.ip_address), !s.did && !t.did && (s.did = t.user.id || t.user.email || t.user.username)), s.timestamp = t.timestamp || ut(), t.abnormal_mechanism && (s.abnormal_mechanism = t.abnormal_mechanism), t.ignoreDuration && (s.ignoreDuration = t.ignoreDuration), t.sid && (s.sid = t.sid.length === 32 ? t.sid : _()), t.init !== void 0 && (s.init = t.init), !s.did && t.did && (s.did = `${t.did}`), typeof t.started == "number" && (s.started = t.started), s.ignoreDuration)
    s.duration = void 0;
  else if (typeof t.duration == "number")
    s.duration = t.duration;
  else {
    const e = s.timestamp - s.started;
    s.duration = e >= 0 ? e : 0;
  }
  t.release && (s.release = t.release), t.environment && (s.environment = t.environment), !s.ipAddress && t.ipAddress && (s.ipAddress = t.ipAddress), !s.userAgent && t.userAgent && (s.userAgent = t.userAgent), typeof t.errors == "number" && (s.errors = t.errors), t.status && (s.status = t.status);
}
function M(s, t, e = 2) {
  if (!t || typeof t != "object" || e <= 0)
    return t;
  if (s && Object.keys(t).length === 0)
    return s;
  const i = { ...s };
  for (const n in t)
    Object.prototype.hasOwnProperty.call(t, n) && (i[n] = M(i[n], t[n], e - 1));
  return i;
}
function O() {
  return _();
}
const C = "_sentrySpan";
function R(s, t) {
  t ? rt(s, C, t) : delete s[C];
}
function U(s) {
  return s[C];
}
const dt = 100;
class l {
  /** Flag if notifying is happening. */
  /** Callback for client to receive scope changes. */
  /** Callback list that will be called during event processing. */
  /** Array of breadcrumbs. */
  /** User */
  /** Tags */
  /** Attributes */
  /** Extra */
  /** Contexts */
  /** Attachments */
  /** Propagation Context for distributed tracing */
  /**
   * A place to stash data which is needed at some point in the SDK's event processing pipeline but which shouldn't get
   * sent to Sentry
   */
  /** Fingerprint */
  /** Severity */
  /**
   * Transaction Name
   *
   * IMPORTANT: The transaction name on the scope has nothing to do with root spans/transaction objects.
   * It's purpose is to assign a transaction to the scope that's added to non-transaction events.
   */
  /** Session */
  /** The client on this scope */
  /** Contains the last event id of a captured event.  */
  // NOTE: Any field which gets added here should get added not only to the constructor but also to the `clone` method.
  constructor() {
    this._notifyingListeners = !1, this._scopeListeners = [], this._eventProcessors = [], this._breadcrumbs = [], this._attachments = [], this._user = {}, this._tags = {}, this._attributes = {}, this._extra = {}, this._contexts = {}, this._sdkProcessingMetadata = {}, this._propagationContext = {
      traceId: O(),
      sampleRand: Math.random()
    };
  }
  /**
   * Clone all data from this scope into a new scope.
   */
  clone() {
    const t = new l();
    return t._breadcrumbs = [...this._breadcrumbs], t._tags = { ...this._tags }, t._attributes = { ...this._attributes }, t._extra = { ...this._extra }, t._contexts = { ...this._contexts }, this._contexts.flags && (t._contexts.flags = {
      values: [...this._contexts.flags.values]
    }), t._user = this._user, t._level = this._level, t._session = this._session, t._transactionName = this._transactionName, t._fingerprint = this._fingerprint, t._eventProcessors = [...this._eventProcessors], t._attachments = [...this._attachments], t._sdkProcessingMetadata = { ...this._sdkProcessingMetadata }, t._propagationContext = { ...this._propagationContext }, t._client = this._client, t._lastEventId = this._lastEventId, R(t, U(this)), t;
  }
  /**
   * Update the client assigned to this scope.
   * Note that not every scope will have a client assigned - isolation scopes & the global scope will generally not have a client,
   * as well as manually created scopes.
   */
  setClient(t) {
    this._client = t;
  }
  /**
   * Set the ID of the last captured error event.
   * This is generally only captured on the isolation scope.
   */
  setLastEventId(t) {
    this._lastEventId = t;
  }
  /**
   * Get the client assigned to this scope.
   */
  getClient() {
    return this._client;
  }
  /**
   * Get the ID of the last captured error event.
   * This is generally only available on the isolation scope.
   */
  lastEventId() {
    return this._lastEventId;
  }
  /**
   * @inheritDoc
   */
  addScopeListener(t) {
    this._scopeListeners.push(t);
  }
  /**
   * Add an event processor that will be called before an event is sent.
   */
  addEventProcessor(t) {
    return this._eventProcessors.push(t), this;
  }
  /**
   * Set the user for this scope.
   * Set to `null` to unset the user.
   */
  setUser(t) {
    return this._user = t || {
      email: void 0,
      id: void 0,
      ip_address: void 0,
      username: void 0
    }, this._session && lt(this._session, { user: t }), this._notifyScopeListeners(), this;
  }
  /**
   * Get the user from this scope.
   */
  getUser() {
    return this._user;
  }
  /**
   * Set an object that will be merged into existing tags on the scope,
   * and will be sent as tags data with the event.
   */
  setTags(t) {
    return this._tags = {
      ...this._tags,
      ...t
    }, this._notifyScopeListeners(), this;
  }
  /**
   * Set a single tag that will be sent as tags data with the event.
   */
  setTag(t, e) {
    return this.setTags({ [t]: e });
  }
  /**
   * Sets attributes onto the scope.
   *
   * TODO:
   * Currently, these attributes are not applied to any telemetry data but they will be in the future.
   *
   * @param newAttributes - The attributes to set on the scope. You can either pass in key-value pairs, or
   * an object with a `value` and an optional `unit` (if applicable to your attribute).
   *
   * @example
   * ```typescript
   * scope.setAttributes({
   *   is_admin: true,
   *   payment_selection: 'credit_card',
   *   clicked_products: [130, 554, 292],
   *   render_duration: { value: 'render_duration', unit: 'ms' },
   * });
   * ```
   */
  setAttributes(t) {
    return this._attributes = {
      ...this._attributes,
      ...t
    }, this._notifyScopeListeners(), this;
  }
  /**
   * Sets an attribute onto the scope.
   *
   * TODO:
   * Currently, these attributes are not applied to any telemetry data but they will be in the future.
   *
   * @param key - The attribute key.
   * @param value - the attribute value. You can either pass in a raw value, or an attribute
   * object with a `value` and an optional `unit` (if applicable to your attribute).
   *
   * @example
   * ```typescript
   * scope.setAttribute('is_admin', true);
   * scope.setAttribute('clicked_products', [130, 554, 292]);
   * scope.setAttribute('render_duration', { value: 'render_duration', unit: 'ms' });
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setAttribute(t, e) {
    return this.setAttributes({ [t]: e });
  }
  /**
   * Removes the attribute with the given key from the scope.
   *
   * @param key - The attribute key.
   *
   * @example
   * ```typescript
   * scope.removeAttribute('is_admin');
   * ```
   */
  removeAttribute(t) {
    return t in this._attributes && (delete this._attributes[t], this._notifyScopeListeners()), this;
  }
  /**
   * Set an object that will be merged into existing extra on the scope,
   * and will be sent as extra data with the event.
   */
  setExtras(t) {
    return this._extra = {
      ...this._extra,
      ...t
    }, this._notifyScopeListeners(), this;
  }
  /**
   * Set a single key:value extra entry that will be sent as extra data with the event.
   */
  setExtra(t, e) {
    return this._extra = { ...this._extra, [t]: e }, this._notifyScopeListeners(), this;
  }
  /**
   * Sets the fingerprint on the scope to send with the events.
   * @param {string[]} fingerprint Fingerprint to group events in Sentry.
   */
  setFingerprint(t) {
    return this._fingerprint = t, this._notifyScopeListeners(), this;
  }
  /**
   * Sets the level on the scope for future events.
   */
  setLevel(t) {
    return this._level = t, this._notifyScopeListeners(), this;
  }
  /**
   * Sets the transaction name on the scope so that the name of e.g. taken server route or
   * the page location is attached to future events.
   *
   * IMPORTANT: Calling this function does NOT change the name of the currently active
   * root span. If you want to change the name of the active root span, use
   * `Sentry.updateSpanName(rootSpan, 'new name')` instead.
   *
   * By default, the SDK updates the scope's transaction name automatically on sensible
   * occasions, such as a page navigation or when handling a new request on the server.
   */
  setTransactionName(t) {
    return this._transactionName = t, this._notifyScopeListeners(), this;
  }
  /**
   * Sets context data with the given name.
   * Data passed as context will be normalized. You can also pass `null` to unset the context.
   * Note that context data will not be merged - calling `setContext` will overwrite an existing context with the same key.
   */
  setContext(t, e) {
    return e === null ? delete this._contexts[t] : this._contexts[t] = e, this._notifyScopeListeners(), this;
  }
  /**
   * Set the session for the scope.
   */
  setSession(t) {
    return t ? this._session = t : delete this._session, this._notifyScopeListeners(), this;
  }
  /**
   * Get the session from the scope.
   */
  getSession() {
    return this._session;
  }
  /**
   * Updates the scope with provided data. Can work in three variations:
   * - plain object containing updatable attributes
   * - Scope instance that'll extract the attributes from
   * - callback function that'll receive the current scope as an argument and allow for modifications
   */
  update(t) {
    if (!t)
      return this;
    const e = typeof t == "function" ? t(this) : t, i = e instanceof l ? e.getScopeData() : it(e) ? t : void 0, {
      tags: n,
      attributes: r,
      extra: o,
      user: a,
      contexts: y,
      level: u,
      fingerprint: c = [],
      propagationContext: I
    } = i || {};
    return this._tags = { ...this._tags, ...n }, this._attributes = { ...this._attributes, ...r }, this._extra = { ...this._extra, ...o }, this._contexts = { ...this._contexts, ...y }, a && Object.keys(a).length && (this._user = a), u && (this._level = u), c.length && (this._fingerprint = c), I && (this._propagationContext = I), this;
  }
  /**
   * Clears the current scope and resets its properties.
   * Note: The client will not be cleared.
   */
  clear() {
    return this._breadcrumbs = [], this._tags = {}, this._attributes = {}, this._extra = {}, this._user = {}, this._contexts = {}, this._level = void 0, this._transactionName = void 0, this._fingerprint = void 0, this._session = void 0, R(this, void 0), this._attachments = [], this.setPropagationContext({ traceId: O(), sampleRand: Math.random() }), this._notifyScopeListeners(), this;
  }
  /**
   * Adds a breadcrumb to the scope.
   * By default, the last 100 breadcrumbs are kept.
   */
  addBreadcrumb(t, e) {
    const i = typeof e == "number" ? e : dt;
    if (i <= 0)
      return this;
    const n = {
      timestamp: B(),
      ...t,
      // Breadcrumb messages can theoretically be infinitely large and they're held in memory so we truncate them not to leak (too much) memory
      message: t.message ? ot(t.message, 2048) : t.message
    };
    return this._breadcrumbs.push(n), this._breadcrumbs.length > i && (this._breadcrumbs = this._breadcrumbs.slice(-i), this._client?.recordDroppedEvent("buffer_overflow", "log_item")), this._notifyScopeListeners(), this;
  }
  /**
   * Get the last breadcrumb of the scope.
   */
  getLastBreadcrumb() {
    return this._breadcrumbs[this._breadcrumbs.length - 1];
  }
  /**
   * Clear all breadcrumbs from the scope.
   */
  clearBreadcrumbs() {
    return this._breadcrumbs = [], this._notifyScopeListeners(), this;
  }
  /**
   * Add an attachment to the scope.
   */
  addAttachment(t) {
    return this._attachments.push(t), this;
  }
  /**
   * Clear all attachments from the scope.
   */
  clearAttachments() {
    return this._attachments = [], this;
  }
  /**
   * Get the data of this scope, which should be applied to an event during processing.
   */
  getScopeData() {
    return {
      breadcrumbs: this._breadcrumbs,
      attachments: this._attachments,
      contexts: this._contexts,
      tags: this._tags,
      attributes: this._attributes,
      extra: this._extra,
      user: this._user,
      level: this._level,
      fingerprint: this._fingerprint || [],
      eventProcessors: this._eventProcessors,
      propagationContext: this._propagationContext,
      sdkProcessingMetadata: this._sdkProcessingMetadata,
      transactionName: this._transactionName,
      span: U(this)
    };
  }
  /**
   * Add data which will be accessible during event processing but won't get sent to Sentry.
   */
  setSDKProcessingMetadata(t) {
    return this._sdkProcessingMetadata = M(this._sdkProcessingMetadata, t, 2), this;
  }
  /**
   * Add propagation context to the scope, used for distributed tracing
   */
  setPropagationContext(t) {
    return this._propagationContext = t, this;
  }
  /**
   * Get propagation context from the scope, used for distributed tracing
   */
  getPropagationContext() {
    return this._propagationContext;
  }
  /**
   * Capture an exception for this scope.
   *
   * @returns {string} The id of the captured Sentry event.
   */
  captureException(t, e) {
    const i = e?.event_id || _();
    if (!this._client)
      return g && m.warn("No client configured on scope - will not capture exception!"), i;
    const n = new Error("Sentry syntheticException");
    return this._client.captureException(
      t,
      {
        originalException: t,
        syntheticException: n,
        ...e,
        event_id: i
      },
      this
    ), i;
  }
  /**
   * Capture a message for this scope.
   *
   * @returns {string} The id of the captured message.
   */
  captureMessage(t, e, i) {
    const n = i?.event_id || _();
    if (!this._client)
      return g && m.warn("No client configured on scope - will not capture message!"), n;
    const r = i?.syntheticException ?? new Error(t);
    return this._client.captureMessage(
      t,
      e,
      {
        originalException: t,
        syntheticException: r,
        ...i,
        event_id: n
      },
      this
    ), n;
  }
  /**
   * Capture a Sentry event for this scope.
   *
   * @returns {string} The id of the captured event.
   */
  captureEvent(t, e) {
    const i = e?.event_id || _();
    return this._client ? (this._client.captureEvent(t, { ...e, event_id: i }, this), i) : (g && m.warn("No client configured on scope - will not capture event!"), i);
  }
  /**
   * This will be called on every set call.
   */
  _notifyScopeListeners() {
    this._notifyingListeners || (this._notifyingListeners = !0, this._scopeListeners.forEach((t) => {
      t(this);
    }), this._notifyingListeners = !1);
  }
}
function gt() {
  return T("defaultCurrentScope", () => new l());
}
function pt() {
  return T("defaultIsolationScope", () => new l());
}
class ft {
  constructor(t, e) {
    let i;
    t ? i = t : i = new l();
    let n;
    e ? n = e : n = new l(), this._stack = [{ scope: i }], this._isolationScope = n;
  }
  /**
   * Fork a scope for the stack.
   */
  withScope(t) {
    const e = this._pushScope();
    let i;
    try {
      i = t(e);
    } catch (n) {
      throw this._popScope(), n;
    }
    return nt(i) ? i.then(
      (n) => (this._popScope(), n),
      (n) => {
        throw this._popScope(), n;
      }
    ) : (this._popScope(), i);
  }
  /**
   * Get the client of the stack.
   */
  getClient() {
    return this.getStackTop().client;
  }
  /**
   * Returns the scope of the top stack.
   */
  getScope() {
    return this.getStackTop().scope;
  }
  /**
   * Get the isolation scope for the stack.
   */
  getIsolationScope() {
    return this._isolationScope;
  }
  /**
   * Returns the topmost scope layer in the order domain > local > process.
   */
  getStackTop() {
    return this._stack[this._stack.length - 1];
  }
  /**
   * Push a scope to the stack.
   */
  _pushScope() {
    const t = this.getScope().clone();
    return this._stack.push({
      client: this.getClient(),
      scope: t
    }), t;
  }
  /**
   * Pop a scope from the stack.
   */
  _popScope() {
    return this._stack.length <= 1 ? !1 : !!this._stack.pop();
  }
}
function p() {
  const s = K(), t = w(s);
  return t.stack = t.stack || new ft(gt(), pt());
}
function _t(s) {
  return p().withScope(s);
}
function mt(s, t) {
  const e = p();
  return e.withScope(() => (e.getStackTop().scope = s, t(s)));
}
function N(s) {
  return p().withScope(() => s(p().getIsolationScope()));
}
function St() {
  return {
    withIsolationScope: N,
    withScope: _t,
    withSetScope: mt,
    withSetIsolationScope: (s, t) => N(t),
    getCurrentScope: () => p().getScope(),
    getIsolationScope: () => p().getIsolationScope()
  };
}
function yt(s) {
  const t = w(s);
  return t.acs ? t.acs : St();
}
function Et() {
  const s = K();
  return yt(s).getCurrentScope();
}
function vt(s, t) {
  return Et().captureException(s, void 0);
}
class Ct {
  constructor(t) {
    this.apiClient = t;
  }
  /**
   * Initialize configuration
   * POST /v1/configs/init
   */
  async init(t) {
    return this.apiClient.post("/v1/configs/init", t);
  }
  /**
   * Fetch configuration updates
   * POST /v1/configs/fetch
   */
  async fetch(t) {
    return this.apiClient.post("/v1/configs/fetch", t);
  }
}
class wt {
  constructor(t) {
    this.apiClient = t;
  }
  /**
   * Get all A/B tests
   * GET /v1/ab-tests
   */
  async getAll() {
    return this.apiClient.get("/v1/ab-tests");
  }
  /**
   * Get active A/B tests
   * GET /v1/ab-tests/active
   */
  async getActive() {
    return this.apiClient.get("/v1/ab-tests/active");
  }
  /**
   * Get A/B test by ID
   * GET /v1/ab-tests/:id
   */
  async getById(t) {
    return this.apiClient.get(`/v1/ab-tests/${t}`);
  }
  /**
   * Create new A/B test
   * POST /v1/ab-tests
   */
  async create(t) {
    return this.apiClient.post("/v1/ab-tests", t);
  }
  /**
   * Full A/B test update
   * PUT /v1/ab-tests/:id
   */
  async update(t, e) {
    return this.apiClient.request(`/v1/ab-tests/${t}`, {
      method: "PUT",
      body: JSON.stringify(e)
    });
  }
  /**
   * Partial A/B test update
   * PATCH /v1/ab-tests/:id
   */
  async patch(t, e) {
    return this.apiClient.request(`/v1/ab-tests/${t}`, {
      method: "PATCH",
      body: JSON.stringify(e)
    });
  }
  /**
   * Delete A/B test
   * DELETE /v1/ab-tests/:id
   */
  async delete(t) {
    return this.apiClient.request(`/v1/ab-tests/${t}`, {
      method: "DELETE"
    });
  }
}
class Tt {
  constructor(t) {
    this.apiClient = t;
  }
  /**
   * Get all remote configurations
   * GET /v1/remote-configs
   */
  async getAll() {
    return this.apiClient.get("/v1/remote-configs");
  }
  /**
   * Get remote configuration by ID
   * GET /v1/remote-configs/:id
   */
  async getById(t) {
    return this.apiClient.get(`/v1/remote-configs/${t}`);
  }
  /**
   * Create new remote configuration
   * POST /v1/remote-configs
   */
  async create(t) {
    return this.apiClient.post("/v1/remote-configs", t);
  }
  /**
   * Update remote configuration
   * PATCH /v1/remote-configs/:id
   */
  async update(t, e) {
    return this.apiClient.request(`/v1/remote-configs/${t}`, {
      method: "PATCH",
      body: JSON.stringify(e)
    });
  }
  /**
   * Delete remote configuration
   * DELETE /v1/remote-configs/:id
   */
  async delete(t) {
    return this.apiClient.request(`/v1/remote-configs/${t}`, {
      method: "DELETE"
    });
  }
}
class bt {
  constructor(t) {
    this.apiClient = t;
  }
  /**
   * Get all segments
   * GET /v1/segments
   */
  async getAll() {
    return this.apiClient.get("/v1/segments");
  }
  /**
   * Get segment by ID
   * GET /v1/segments/:id
   */
  async getById(t) {
    return this.apiClient.get(`/v1/segments/${t}`);
  }
  /**
   * Create new segment
   * POST /v1/segments
   */
  async create(t) {
    return this.apiClient.post("/v1/segments", t);
  }
  /**
   * Update segment
   * PATCH /v1/segments/:id
   */
  async update(t, e) {
    return this.apiClient.request(`/v1/segments/${t}`, {
      method: "PATCH",
      body: JSON.stringify(e)
    });
  }
  /**
   * Delete segment
   * DELETE /v1/segments/:id
   */
  async delete(t) {
    return this.apiClient.request(`/v1/segments/${t}`, {
      method: "DELETE"
    });
  }
}
class At {
  constructor(t) {
    this.apiClient = t;
  }
  /**
   * Get all users
   * GET /v1/users
   */
  async getAll() {
    return this.apiClient.get("/v1/users");
  }
  /**
   * Get user by ID
   * GET /v1/users/:id
   */
  async getById(t) {
    return this.apiClient.get(`/v1/users/${t}`);
  }
  /**
   * Create new user
   * POST /v1/users
   */
  async create(t) {
    return this.apiClient.post("/v1/users", t);
  }
  /**
   * Update user
   * PATCH /v1/users/:id
   */
  async update(t, e) {
    return this.apiClient.request(`/v1/users/${t}`, {
      method: "PATCH",
      body: JSON.stringify(e)
    });
  }
  /**
   * Delete user
   * DELETE /v1/users/:id
   */
  async delete(t) {
    return this.apiClient.request(`/v1/users/${t}`, {
      method: "DELETE"
    });
  }
}
class It {
  constructor(t) {
    this.apiClient = t;
  }
  /**
   * Get service version
   * GET /v1
   */
  async getVersion() {
    return this.apiClient.get("/v1");
  }
  /**
   * Health check
   * GET /v1/health
   */
  async check() {
    return this.apiClient.get("/v1/health");
  }
}
class Pt {
  constructor(t) {
    this.getAuthToken = t;
  }
  /**
   * Build URL using auth service base URL
   */
  buildUrl(t) {
    const e = S.authUrl.replace(/\/+$/, ""), i = t.replace(/^\/+/, "");
    return `${e}/${i}`;
  }
  /**
   * Make request to auth service
   */
  async request(t, e = {}) {
    const i = this.buildUrl(t), n = this.getAuthToken(), r = {
      "Content-Type": "application/json",
      ...e.headers
    };
    n && (r.Authorization = `Bearer ${n}`);
    const o = await fetch(i, {
      ...e,
      headers: r,
      credentials: "include"
    });
    if (!o.ok) {
      const y = await o.text();
      let u = `Request failed with status ${o.status}`;
      try {
        const c = JSON.parse(y);
        Array.isArray(c.message) ? u = c.message.join(", ") : c.message ? u = c.message : c.error && (u = c.error);
      } catch {
      }
      throw new Error(u);
    }
    const a = await o.text();
    if (!a) return null;
    try {
      return JSON.parse(a);
    } catch {
      return a;
    }
  }
  /**
   * Login user with email/phone and password
   * POST /v1/auth/login
   */
  async login(t) {
    return this.request("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(t)
    });
  }
  /**
   * Register new user
   * POST /v1/auth/registration
   */
  async register(t) {
    return this.request("/v1/auth/registration", {
      method: "POST",
      body: JSON.stringify(t)
    });
  }
  /**
   * Logout current user
   * POST /v1/auth/logout
   */
  async logout() {
    return this.request("/v1/auth/logout", {
      method: "POST"
    });
  }
  /**
   * Get current user profile
   * GET /v1/auth/me
   */
  async getMe() {
    return this.request("/v1/auth/me", {
      method: "GET"
    });
  }
  /**
   * Refresh access token using refresh token
   * POST /v1/auth/refresh
   */
  async refresh() {
    return this.request("/v1/auth/refresh", {
      method: "POST"
    });
  }
}
const Dt = {
  AUTH_OPEN: "core:authWindowOpen",
  AUTH_CLOSE: "core:authWindowClose"
};
class d {
  constructor() {
    this.eventBus = new Y(), this.systemParams = {}, this.initialized = !1, this.detectEnvironment(), this.apiClient = new z(() => this.systemParams.authToken), this.configs = new Ct(this.apiClient), this.abTests = new wt(this.apiClient), this.remoteConfigs = new Tt(this.apiClient), this.segments = new bt(this.apiClient), this.users = new At(this.apiClient), this.health = new It(this.apiClient), this.auth = new Pt(() => this.systemParams.authToken);
  }
  static getInstance() {
    return d.instance || (d.instance = new d()), d.instance;
  }
  async init(t) {
    if (this.systemParams.authToken) {
      console.log("[SDK] init: TOKEN ALREADY SET → SKIP GUEST AUTH"), this.profileClient = new D(this.apiClient, this.eventBus), this.initialized = !0;
      return;
    }
    if (!this.systemParams.authToken && !this.initialized) {
      console.log("[SDK] init: start", t);
      try {
        t?.baseUrl && (console.log("[SDK] init: set base url ->", t.baseUrl), q(t.baseUrl)), t?.authUrl && (console.log("[SDK] init: set auth url ->", t.authUrl), J(t.authUrl)), console.log("[SDK] init: set system params ->", t), t && this.setSystemParams(t), console.log("[SDK] init: ensure device id…");
        const e = await this.ensureDeviceId();
        console.log("[SDK] init: deviceId =", e), this.systemParams.deviceId = e, t?.skipAuth ? console.log("[SDK] init: skipAuth=true, skipping guest auth") : (console.log("[SDK] init: guest auth…"), await this.authGuest(), console.log("[SDK] init: guest auth OK")), this.profileClient = new D(this.apiClient, this.eventBus), console.log("[SDK] init: profile module initialized"), this.on(v.PROFILE_UPDATED, (i) => {
          try {
            const n = i?.gid ?? i?.detail?.gid;
            n && (console.log("[SDK] profile cache invalidated for", n), this.profileClient.invalidate(n));
          } catch {
          }
        }), this.initialized = !0, console.log("[SDK] init: COMPLETE"), this.eventBus.emit("core:initialized", this.getSystemParams());
      } catch (e) {
        throw console.error("[SDK] init: ERROR", e), this.captureError(e), e;
      }
    }
  }
  captureError(t) {
    try {
      vt(t);
    } catch {
    }
  }
  async authGuest() {
    try {
      console.log("[SDK] authGuest: start");
      const t = this.getStoredToken();
      if (t) {
        this.systemParams.authToken = t;
        return;
      }
      console.log("[SDK] authGuest: sending POST /auth/guest", {
        deviceId: this.systemParams.deviceId
      });
      const e = await this.apiClient.post("/auth/guest", {
        deviceId: this.systemParams.deviceId
      });
      console.log("[SDK] authGuest: server response", e);
      const i = e?.accessToken ?? e?.data?.accessToken ?? null;
      if (!i)
        throw console.error("[SDK] authGuest: ERROR missing token", e), new Error("Guest auth failed: missing token");
      this.storeToken(i), this.systemParams.authToken = i;
    } catch (t) {
      throw console.error("[SDK] authGuest: ERROR", t), this.captureError(t), t;
    }
  }
  setSystemParams(t) {
    this.systemParams = { ...this.systemParams, ...t };
  }
  getSystemParams() {
    return { ...this.systemParams };
  }
  get api() {
    return this.apiClient;
  }
  on(t, e) {
    this.eventBus.on(t, e);
  }
  once(t, e) {
    this.eventBus.once(t, e);
  }
  off(t, e) {
    this.eventBus.off(t, e);
  }
  emit(t, ...e) {
    this.eventBus.emit(t, ...e);
  }
  detectEnvironment() {
    const t = typeof navigator < "u" ? navigator.userAgent : "", e = typeof window < "u" && typeof window.cordova < "u";
    this.systemParams.os = this.detectOS(t), this.systemParams.isCordova = e;
  }
  detectOS(t) {
    return /android/i.test(t) ? "android" : /iPad|iPhone|iPod/i.test(t) ? "ios" : /Win/i.test(t) ? "windows" : /Mac/i.test(t) ? "macos" : /Linux/i.test(t) ? "linux" : "unknown";
  }
  async ensureDeviceId() {
    const t = this.getStoredDeviceId();
    if (t) return t;
    const e = await this.tryGetCordovaDeviceId();
    if (e)
      return this.storeDeviceId(e), e;
    const i = this.generateGuid();
    return this.storeDeviceId(i), i;
  }
  getStoredDeviceId() {
    try {
      return localStorage.getItem("coreSDK_deviceId");
    } catch {
      return null;
    }
  }
  storeDeviceId(t) {
    try {
      localStorage.setItem("coreSDK_deviceId", t);
    } catch {
    }
  }
  getStoredToken() {
    try {
      return localStorage.getItem("coreSDK_token");
    } catch {
      return null;
    }
  }
  storeToken(t) {
    try {
      localStorage.setItem("coreSDK_token", t);
    } catch {
    }
  }
  setUser(t) {
    this.systemParams.user = t;
  }
  /**
   * Login user with credentials and store token
   */
  async login(t) {
    try {
      console.log("[SDK] login: start", { email: t.email });
      const e = await this.auth.login(t);
      console.log("[SDK] login: server response received");
      const i = e?.accessToken ?? null;
      if (!i)
        throw console.error("[SDK] login: ERROR missing token", e), new Error("Login failed: missing token");
      return this.storeToken(i), this.systemParams.authToken = i, e.user && this.setUser(e.user), e;
    } catch (e) {
      throw console.error("[SDK] login: ERROR", e), this.captureError(e), e;
    }
  }
  /**
   * Register new user
   */
  async register(t) {
    try {
      console.log("[SDK] register: start", { email: t.email, username: t.username });
      const e = await this.auth.register(t);
      if (console.log("[SDK] register: server response received"), !e)
        throw console.error("[SDK] register: ERROR missing user data"), new Error("Registration failed: missing user data");
      return e;
    } catch (e) {
      throw console.error("[SDK] register: ERROR", e), this.captureError(e), e;
    }
  }
  /**
   * Logout user and clear token
   */
  async logout() {
    try {
      console.log("[SDK] logout: start");
      try {
        await this.auth.logout();
      } catch {
      }
      this.clearToken(), this.systemParams.authToken = void 0, this.systemParams.user = null, console.log("[SDK] logout: COMPLETE");
    } catch (t) {
      throw console.error("[SDK] logout: ERROR", t), this.captureError(t), t;
    }
  }
  /**
   * Clear stored token from localStorage
   */
  clearToken() {
    try {
      localStorage.removeItem("coreSDK_token");
    } catch {
    }
  }
  async tryGetCordovaDeviceId() {
    if (typeof window > "u") return null;
    const t = window;
    return t.device?.uuid ? String(t.device.uuid) : null;
  }
  generateGuid() {
    const t = () => Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
    return `${t()}${t()}-${t()}-${t()}-${t()}-${t()}${t()}${t()}`;
  }
  get profile() {
    return this.profileClient;
  }
}
const Lt = d.getInstance();
export {
  wt as AbTestsApiClient,
  z as ApiClient,
  Pt as AuthApiClient,
  Ct as ConfigsApiClient,
  d as CoreSDK,
  Y as EventBus,
  It as HealthApiClient,
  Tt as RemoteConfigsApiClient,
  Dt as SDK_EVENTS,
  bt as SegmentsApiClient,
  At as UsersApiClient,
  Lt as coreSDK,
  S as sdkConfig,
  J as setAuthUrl,
  q as setBaseUrl
};
