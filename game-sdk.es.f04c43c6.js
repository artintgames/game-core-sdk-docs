const R = { BASE_URL: "/", DEV: !1, MODE: "production", PROD: !0, SSR: !1 };
function B(s) {
  if (typeof process < "u" && process.env) {
    const t = process.env[s];
    if (t) return t;
  }
  if (typeof import.meta < "u" && R) {
    const t = R[s];
    if (t) return t;
  }
  if (typeof window < "u" && window.__ENV__) {
    const t = window.__ENV__[s];
    if (t) return t;
  }
}
const V = B("REACT_APP_BACKEND_URL_ADMIN_PANEL") || "https://configs.artintgames.com", j = B("REACT_APP_BACKEND_URL_AUTH") || " https://auth.artintgames.com", m = {
  baseUrl: V,
  authUrl: j
};
function z(s) {
  m.baseUrl = s;
}
function Y(s) {
  m.authUrl = s;
}
const O = "coreSDK_profiles_v1", W = 100, k = 300 * 1e3, X = 600 * 1e3;
class Q {
  constructor(t) {
    this.items = /* @__PURE__ */ new Map(), this.maxItems = t?.maxItems ?? W, this.loadFromStorage();
  }
  /**
   * Get profile by gid from cache if not expired.
   * Returns null if not found or expired.
   */
  get(t) {
    const e = this.items.get(t);
    if (!e) return null;
    const r = Date.now();
    return r - e.cachedAt > e.ttl ? (this.items.delete(t), this.saveToStorageSafe(), null) : (e.lastAccessed = r, e.profile);
  }
  /**
   * Put/replace profile in cache with given TTL.
   */
  set(t, e) {
    const r = Date.now(), i = {
      profile: t,
      cachedAt: r,
      lastAccessed: r,
      ttl: e
    };
    this.items.set(t.gid, i), this.evictIfNeeded(), this.saveToStorageSafe();
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
      (r, i) => r[1].lastAccessed - i[1].lastAccessed
    );
    const e = t.length - this.maxItems;
    for (let r = 0; r < e; r++) {
      const [i] = t[r];
      this.items.delete(i);
    }
  }
  loadFromStorage() {
    if (!(typeof localStorage > "u"))
      try {
        const t = localStorage.getItem(O);
        if (!t) return;
        const e = JSON.parse(t);
        if (e.version !== 1 || !e.items || typeof e.items != "object")
          return;
        const r = Date.now();
        for (const [i, n] of Object.entries(e.items))
          !n || !n.profile || typeof n.cachedAt != "number" || typeof n.ttl != "number" || r - n.cachedAt > n.ttl || this.items.set(i, n);
        this.evictIfNeeded();
      } catch (t) {
        console.error("[ProfileCache] loadFromStorage error:", t);
      }
  }
  saveToStorageSafe() {
    if (!(typeof localStorage > "u"))
      try {
        const t = {};
        for (const [r, i] of this.items.entries())
          t[r] = i;
        const e = {
          version: 1,
          items: t
        };
        localStorage.setItem(
          O,
          JSON.stringify(e)
        );
      } catch (t) {
        console.error("[ProfileCache] saveToStorageSafe error:", t);
      }
  }
}
const E = {
  PROFILE_UPDATED: "profile.updated"
};
class L {
  constructor(t, e) {
    this.cache = new Q(), this.meGid = null, this.getAuthToken = t, this.events = e;
  }
  /**
   * Build URL using auth service base URL
   */
  buildUrl(t) {
    const e = m.authUrl.replace(/\/+$/, ""), r = t.replace(/^\/+/, "");
    return `${e}/${r}`;
  }
  /**
   * Make request to auth service
   */
  async request(t, e = {}) {
    const r = this.buildUrl(t), i = this.getAuthToken(), n = {
      "Content-Type": "application/json",
      ...e.headers
    };
    i && (n.Authorization = `Bearer ${i}`);
    const a = await fetch(r, {
      ...e,
      headers: n,
      credentials: "include"
    });
    if (!a.ok) {
      const h = await a.text();
      let c = `Request failed with status ${a.status}`;
      try {
        const o = JSON.parse(h);
        Array.isArray(o.message) ? c = o.message.join(", ") : o.message ? c = o.message : o.error && (c = o.error);
      } catch {
      }
      throw new Error(c);
    }
    const u = await a.text();
    return u ? JSON.parse(u) : null;
  }
  // Load MY profile
  async getMe() {
    if (this.meGid) {
      const e = this.cache.get(this.meGid);
      if (e) return e;
    }
    const t = await this.request("/v1/profile/me");
    return this.meGid = t.gid, this.cache.set(t, k), t;
  }
  // Load OTHER profile by gid
  async getByGid(t) {
    if (this.meGid === t)
      return this.getMe();
    const e = this.cache.get(t);
    if (e) return e;
    const r = await this.request(`/v1/profile/${t}`);
    return this.cache.set(r, X), r;
  }
  // Update my profile
  async update(t) {
    const e = await this.request("/v1/profile/me", {
      method: "PUT",
      body: JSON.stringify(t)
    });
    return this.meGid = e.gid, this.cache.set(e, k), this.events.emit(E.PROFILE_UPDATED, {
      gid: e.gid,
      profile: e
    }), typeof window < "u" && window.dispatchEvent(
      new CustomEvent(E.PROFILE_UPDATED, {
        detail: { gid: e.gid, profile: e }
      })
    ), e;
  }
  // Profile summary
  async getSummary(t) {
    let e = t;
    return e || (e = (await this.getMe()).gid), this.request(`/v1/profile/${e}/summary`);
  }
  // Batch summaries
  async getSummaryBatch(t) {
    return (await this.request(
      "/v1/profile/batch",
      {
        method: "POST",
        body: JSON.stringify({ gids: t })
      }
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
class Z {
  constructor(t) {
    this.getAuthToken = t;
  }
  buildUrl(t) {
    const e = m.baseUrl.replace(/\/+$/, ""), r = t.replace(/^\/+/, "");
    return `${e}/${r}`;
  }
  /**
   * Core request method used by SDK clients.
   */
  async request(t, e = {}) {
    const r = this.buildUrl(t), i = this.getAuthToken(), n = {
      "Content-Type": "application/json",
      ...e.headers
    };
    i && (n.Authorization = `Bearer ${i}`), console.log("[API] REQUEST:", {
      url: r,
      method: e.method ?? "GET",
      headers: n,
      body: e.body
    });
    const a = await fetch(r, {
      ...e,
      headers: n,
      credentials: "include"
    });
    if (!a.ok) {
      const h = await a.text().catch(() => "");
      throw console.error("[API] Request failed:", { url: r, status: a.status, body: h }), new Error(`Request failed with status ${a.status}`);
    }
    const u = await a.text();
    if (!u) return null;
    try {
      return JSON.parse(u);
    } catch (h) {
      return console.warn("[API] Response is not JSON, returning as text:", h), u;
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
  send(t, e, r) {
    return this.request(e, {
      method: t,
      body: this.normalizeBody(r)
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
class tt {
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
    this.listeners.get(t)?.forEach((i) => i(...e));
    const r = this.onceListeners.get(t);
    r && (r.forEach((i) => i(...e)), this.onceListeners.delete(t));
  }
}
const g = typeof __SENTRY_DEBUG__ > "u" || __SENTRY_DEBUG__, l = globalThis, _ = "10.27.0";
function q() {
  return C(l), l;
}
function C(s) {
  const t = s.__SENTRY__ = s.__SENTRY__ || {};
  return t.version = t.version || _, t[_] = t[_] || {};
}
function T(s, t, e = l) {
  const r = e.__SENTRY__ = e.__SENTRY__ || {}, i = r[_] = r[_] || {};
  return i[s] || (i[s] = t());
}
const et = "Sentry Logger ", U = {};
function st(s) {
  if (!("console" in l))
    return s();
  const t = l.console, e = {}, r = Object.keys(U);
  r.forEach((i) => {
    const n = U[i];
    e[i] = t[i], t[i] = n;
  });
  try {
    return s();
  } finally {
    r.forEach((i) => {
      t[i] = e[i];
    });
  }
}
function rt() {
  A().enabled = !0;
}
function it() {
  A().enabled = !1;
}
function G() {
  return A().enabled;
}
function nt(...s) {
  b("log", ...s);
}
function ot(...s) {
  b("warn", ...s);
}
function at(...s) {
  b("error", ...s);
}
function b(s, ...t) {
  g && G() && st(() => {
    l.console[s](`${et}[${s}]:`, ...t);
  });
}
function A() {
  return g ? T("loggerSettings", () => ({ enabled: !1 })) : { enabled: !1 };
}
const y = {
  /** Enable logging. */
  enable: rt,
  /** Disable logging. */
  disable: it,
  /** Check if logging is enabled. */
  isEnabled: G,
  /** Log a message. */
  log: nt,
  /** Log a warning. */
  warn: ot,
  /** Log an error. */
  error: at
}, ct = Object.prototype.toString;
function ut(s, t) {
  return ct.call(s) === `[object ${t}]`;
}
function ht(s) {
  return ut(s, "Object");
}
function lt(s) {
  return !!(s?.then && typeof s.then == "function");
}
function dt(s, t, e) {
  try {
    Object.defineProperty(s, t, {
      // enumerable: false, // the default, so we can save on bundle size by not explicitly setting it
      value: e,
      writable: !0,
      configurable: !0
    });
  } catch {
    g && y.log(`Failed to add non-enumerable property "${t}" to object`, s);
  }
}
function pt(s, t = 0) {
  return typeof s != "string" || t === 0 || s.length <= t ? s : `${s.slice(0, t)}...`;
}
function gt() {
  const s = l;
  return s.crypto || s.msCrypto;
}
let v;
function ft() {
  return Math.random() * 16;
}
function S(s = gt()) {
  try {
    if (s?.randomUUID)
      return s.randomUUID().replace(/-/g, "");
  } catch {
  }
  return v || (v = "10000000100040008000" + 1e11), v.replace(
    /[018]/g,
    (t) => (
      // eslint-disable-next-line no-bitwise
      (t ^ (ft() & 15) >> t / 4).toString(16)
    )
  );
}
const J = 1e3;
function F() {
  return Date.now() / J;
}
function mt() {
  const { performance: s } = l;
  if (!s?.now || !s.timeOrigin)
    return F;
  const t = s.timeOrigin;
  return () => (t + s.now()) / J;
}
let K;
function _t() {
  return (K ?? (K = mt()))();
}
function St(s, t = {}) {
  if (t.user && (!s.ipAddress && t.user.ip_address && (s.ipAddress = t.user.ip_address), !s.did && !t.did && (s.did = t.user.id || t.user.email || t.user.username)), s.timestamp = t.timestamp || _t(), t.abnormal_mechanism && (s.abnormal_mechanism = t.abnormal_mechanism), t.ignoreDuration && (s.ignoreDuration = t.ignoreDuration), t.sid && (s.sid = t.sid.length === 32 ? t.sid : S()), t.init !== void 0 && (s.init = t.init), !s.did && t.did && (s.did = `${t.did}`), typeof t.started == "number" && (s.started = t.started), s.ignoreDuration)
    s.duration = void 0;
  else if (typeof t.duration == "number")
    s.duration = t.duration;
  else {
    const e = s.timestamp - s.started;
    s.duration = e >= 0 ? e : 0;
  }
  t.release && (s.release = t.release), t.environment && (s.environment = t.environment), !s.ipAddress && t.ipAddress && (s.ipAddress = t.ipAddress), !s.userAgent && t.userAgent && (s.userAgent = t.userAgent), typeof t.errors == "number" && (s.errors = t.errors), t.status && (s.status = t.status);
}
function H(s, t, e = 2) {
  if (!t || typeof t != "object" || e <= 0)
    return t;
  if (s && Object.keys(t).length === 0)
    return s;
  const r = { ...s };
  for (const i in t)
    Object.prototype.hasOwnProperty.call(t, i) && (r[i] = H(r[i], t[i], e - 1));
  return r;
}
function N() {
  return S();
}
const w = "_sentrySpan";
function $(s, t) {
  t ? dt(s, w, t) : delete s[w];
}
function x(s) {
  return s[w];
}
const yt = 100;
class d {
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
      traceId: N(),
      sampleRand: Math.random()
    };
  }
  /**
   * Clone all data from this scope into a new scope.
   */
  clone() {
    const t = new d();
    return t._breadcrumbs = [...this._breadcrumbs], t._tags = { ...this._tags }, t._attributes = { ...this._attributes }, t._extra = { ...this._extra }, t._contexts = { ...this._contexts }, this._contexts.flags && (t._contexts.flags = {
      values: [...this._contexts.flags.values]
    }), t._user = this._user, t._level = this._level, t._session = this._session, t._transactionName = this._transactionName, t._fingerprint = this._fingerprint, t._eventProcessors = [...this._eventProcessors], t._attachments = [...this._attachments], t._sdkProcessingMetadata = { ...this._sdkProcessingMetadata }, t._propagationContext = { ...this._propagationContext }, t._client = this._client, t._lastEventId = this._lastEventId, $(t, x(this)), t;
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
    }, this._session && St(this._session, { user: t }), this._notifyScopeListeners(), this;
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
    const e = typeof t == "function" ? t(this) : t, r = e instanceof d ? e.getScopeData() : ht(e) ? t : void 0, {
      tags: i,
      attributes: n,
      extra: a,
      user: u,
      contexts: h,
      level: c,
      fingerprint: o = [],
      propagationContext: I
    } = r || {};
    return this._tags = { ...this._tags, ...i }, this._attributes = { ...this._attributes, ...n }, this._extra = { ...this._extra, ...a }, this._contexts = { ...this._contexts, ...h }, u && Object.keys(u).length && (this._user = u), c && (this._level = c), o.length && (this._fingerprint = o), I && (this._propagationContext = I), this;
  }
  /**
   * Clears the current scope and resets its properties.
   * Note: The client will not be cleared.
   */
  clear() {
    return this._breadcrumbs = [], this._tags = {}, this._attributes = {}, this._extra = {}, this._user = {}, this._contexts = {}, this._level = void 0, this._transactionName = void 0, this._fingerprint = void 0, this._session = void 0, $(this, void 0), this._attachments = [], this.setPropagationContext({ traceId: N(), sampleRand: Math.random() }), this._notifyScopeListeners(), this;
  }
  /**
   * Adds a breadcrumb to the scope.
   * By default, the last 100 breadcrumbs are kept.
   */
  addBreadcrumb(t, e) {
    const r = typeof e == "number" ? e : yt;
    if (r <= 0)
      return this;
    const i = {
      timestamp: F(),
      ...t,
      // Breadcrumb messages can theoretically be infinitely large and they're held in memory so we truncate them not to leak (too much) memory
      message: t.message ? pt(t.message, 2048) : t.message
    };
    return this._breadcrumbs.push(i), this._breadcrumbs.length > r && (this._breadcrumbs = this._breadcrumbs.slice(-r), this._client?.recordDroppedEvent("buffer_overflow", "log_item")), this._notifyScopeListeners(), this;
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
      span: x(this)
    };
  }
  /**
   * Add data which will be accessible during event processing but won't get sent to Sentry.
   */
  setSDKProcessingMetadata(t) {
    return this._sdkProcessingMetadata = H(this._sdkProcessingMetadata, t, 2), this;
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
    const r = e?.event_id || S();
    if (!this._client)
      return g && y.warn("No client configured on scope - will not capture exception!"), r;
    const i = new Error("Sentry syntheticException");
    return this._client.captureException(
      t,
      {
        originalException: t,
        syntheticException: i,
        ...e,
        event_id: r
      },
      this
    ), r;
  }
  /**
   * Capture a message for this scope.
   *
   * @returns {string} The id of the captured message.
   */
  captureMessage(t, e, r) {
    const i = r?.event_id || S();
    if (!this._client)
      return g && y.warn("No client configured on scope - will not capture message!"), i;
    const n = r?.syntheticException ?? new Error(t);
    return this._client.captureMessage(
      t,
      e,
      {
        originalException: t,
        syntheticException: n,
        ...r,
        event_id: i
      },
      this
    ), i;
  }
  /**
   * Capture a Sentry event for this scope.
   *
   * @returns {string} The id of the captured event.
   */
  captureEvent(t, e) {
    const r = e?.event_id || S();
    return this._client ? (this._client.captureEvent(t, { ...e, event_id: r }, this), r) : (g && y.warn("No client configured on scope - will not capture event!"), r);
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
function vt() {
  return T("defaultCurrentScope", () => new d());
}
function Et() {
  return T("defaultIsolationScope", () => new d());
}
class wt {
  constructor(t, e) {
    let r;
    t ? r = t : r = new d();
    let i;
    e ? i = e : i = new d(), this._stack = [{ scope: r }], this._isolationScope = i;
  }
  /**
   * Fork a scope for the stack.
   */
  withScope(t) {
    const e = this._pushScope();
    let r;
    try {
      r = t(e);
    } catch (i) {
      throw this._popScope(), i;
    }
    return lt(r) ? r.then(
      (i) => (this._popScope(), i),
      (i) => {
        throw this._popScope(), i;
      }
    ) : (this._popScope(), r);
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
function f() {
  const s = q(), t = C(s);
  return t.stack = t.stack || new wt(vt(), Et());
}
function Ct(s) {
  return f().withScope(s);
}
function Tt(s, t) {
  const e = f();
  return e.withScope(() => (e.getStackTop().scope = s, t(s)));
}
function M(s) {
  return f().withScope(() => s(f().getIsolationScope()));
}
function bt() {
  return {
    withIsolationScope: M,
    withScope: Ct,
    withSetScope: Tt,
    withSetIsolationScope: (s, t) => M(t),
    getCurrentScope: () => f().getScope(),
    getIsolationScope: () => f().getIsolationScope()
  };
}
function At(s) {
  const t = C(s);
  return t.acs ? t.acs : bt();
}
function Dt() {
  const s = q();
  return At(s).getCurrentScope();
}
function Pt(s, t) {
  return Dt().captureException(s, void 0);
}
class It {
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
class Rt {
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
   * Get user's variant for a test
   * GET /v1/ab-tests/:id/variant
   */
  async getVariant(t) {
    return this.apiClient.get(`/v1/ab-tests/${t}/variant`);
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
class Ot {
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
  /**
   * Refresh remote configurations
   * POST /v1/remote-configs/refresh
   */
  async refresh() {
    return this.apiClient.post("/v1/remote-configs/refresh", {});
  }
}
class kt {
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
   * Get current user's segments
   * GET /v1/segments/user
   */
  async getUserSegments() {
    return this.apiClient.get("/v1/segments/user");
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
class Lt {
  constructor(t) {
    this.getAuthToken = t;
  }
  /**
   * Build URL using auth service base URL
   */
  buildUrl(t) {
    const e = m.authUrl.replace(/\/+$/, ""), r = t.replace(/^\/+/, "");
    return `${e}/${r}`;
  }
  /**
   * Make request to auth service
   */
  async request(t, e = {}) {
    const r = this.buildUrl(t), i = this.getAuthToken(), n = {
      "Content-Type": "application/json",
      ...e.headers
    };
    i && (n.Authorization = `Bearer ${i}`);
    const a = await fetch(r, {
      ...e,
      headers: n,
      credentials: "include"
    });
    if (!a.ok) {
      const h = await a.text();
      let c = `Request failed with status ${a.status}`;
      try {
        const o = JSON.parse(h);
        Array.isArray(o.message) ? c = o.message.join(", ") : o.message ? c = o.message : o.error && (c = o.error);
      } catch {
      }
      throw new Error(c);
    }
    const u = await a.text();
    return u ? JSON.parse(u) : null;
  }
  /**
   * Get all users
   * GET /v1/users
   */
  async getAll() {
    return this.request("/v1/users");
  }
  /**
   * Get user by ID
   * GET /v1/users/:id
   */
  async getById(t) {
    return this.request(`/v1/users/${t}`);
  }
  /**
   * Search users
   * GET /v1/users/search?q=query
   */
  async search(t) {
    return this.request(`/v1/users/search?q=${encodeURIComponent(t)}`);
  }
  /**
   * Create new user
   * POST /v1/users
   */
  async create(t) {
    return this.request("/v1/users", {
      method: "POST",
      body: JSON.stringify(t)
    });
  }
  /**
   * Update user
   * PATCH /v1/users/:id
   */
  async update(t, e) {
    return this.request(`/v1/users/${t}`, {
      method: "PATCH",
      body: JSON.stringify(e)
    });
  }
  /**
   * Delete user
   * DELETE /v1/users/:id
   */
  async delete(t) {
    return this.request(`/v1/users/${t}`, {
      method: "DELETE"
    });
  }
}
class Ut {
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
  /**
   * Detailed health check
   * GET /v1/health/detailed
   */
  async detailed() {
    return this.apiClient.get("/v1/health/detailed");
  }
}
class Kt {
  constructor(t) {
    this.getAuthToken = t;
  }
  /**
   * Build URL using auth service base URL
   */
  buildUrl(t) {
    const e = m.authUrl.replace(/\/+$/, ""), r = t.replace(/^\/+/, "");
    return `${e}/${r}`;
  }
  /**
   * Make request to auth service
   */
  async request(t, e = {}) {
    const r = this.buildUrl(t), i = this.getAuthToken(), n = {
      "Content-Type": "application/json",
      ...e.headers
    };
    i && (n.Authorization = `Bearer ${i}`);
    const a = await fetch(r, {
      ...e,
      headers: n,
      credentials: "include"
    });
    if (!a.ok) {
      const h = await a.text();
      let c = `Request failed with status ${a.status}`;
      try {
        const o = JSON.parse(h);
        Array.isArray(o.message) ? c = o.message.join(", ") : o.message ? c = o.message : o.error && (c = o.error);
      } catch (o) {
        console.error("[AuthApiClient] Error parsing error response:", o, "Raw:", h);
      }
      throw console.error("[AuthApiClient] Request failed:", { url: r, status: a.status, message: c }), new Error(c);
    }
    const u = await a.text();
    if (!u) return null;
    try {
      return JSON.parse(u);
    } catch (h) {
      return console.warn("[AuthApiClient] Response is not JSON, returning as text:", h), u;
    }
  }
  /**
   * Guest authentication
   * POST /v1/auth/guest
   */
  async guest(t) {
    return this.request("/v1/auth/guest", {
      method: "POST",
      body: JSON.stringify({ deviceId: t })
    });
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
  /**
   * Health check for auth service
   * GET /v1/health
   */
  async health() {
    return this.request("/v1/health", {
      method: "GET"
    });
  }
}
class Nt {
  constructor(t) {
    this.apiClient = t;
  }
  /**
   * Health check for KV service
   * GET /v1/kv/health
   */
  async health() {
    return this.apiClient.get("/v1/kv/health");
  }
  /**
   * Get all stored keys
   * GET /v1/kv/list
   */
  async list() {
    return this.apiClient.get("/v1/kv/list");
  }
  /**
   * Get value by key
   * GET /v1/kv/get/:key
   */
  async get(t) {
    return this.apiClient.get(`/v1/kv/get/${encodeURIComponent(t)}`);
  }
  /**
   * Set key-value pair
   * POST /v1/kv/set
   */
  async set(t, e) {
    const r = { key: t, value: e };
    return this.apiClient.post("/v1/kv/set", r);
  }
  /**
   * Delete key
   * DELETE /v1/kv/:key
   */
  async delete(t) {
    return this.apiClient.delete(`/v1/kv/${encodeURIComponent(t)}`);
  }
  /**
   * Check if key exists
   * Convenience method that wraps get() and handles errors
   */
  async exists(t) {
    try {
      return await this.get(t), !0;
    } catch (e) {
      return console.debug("[KVApiClient] exists check failed for key:", t, e), !1;
    }
  }
  /**
   * Get multiple values by keys
   * Convenience method that fetches multiple keys in parallel
   */
  async getMany(t) {
    const e = {}, r = t.map(async (i) => {
      try {
        const n = await this.get(i);
        e[i] = n.value;
      } catch (n) {
        console.debug("[KVApiClient] getMany failed for key:", i, n), e[i] = null;
      }
    });
    return await Promise.all(r), e;
  }
  /**
   * Set multiple key-value pairs
   * Convenience method that sets multiple keys in parallel
   */
  async setMany(t) {
    const e = Object.entries(t).map(
      ([r, i]) => this.set(r, i)
    );
    await Promise.all(e);
  }
  /**
   * Delete multiple keys
   * Convenience method that deletes multiple keys in parallel
   */
  async deleteMany(t) {
    const e = t.map((r) => this.delete(r));
    await Promise.all(e);
  }
}
class $t {
  constructor(t) {
    this.apiClient = t;
  }
  /**
   * Get all events
   * GET /v1/events
   */
  async getAll() {
    return this.apiClient.get("/v1/events");
  }
  /**
   * Send an event
   * POST /v1/events
   */
  async send(t) {
    return this.apiClient.post("/v1/events", t);
  }
}
const D = "1.0.17", P = [
  D,
  "1.0.3"
];
function xt(s) {
  return P.includes(s);
}
function Mt(s) {
  if (!xt(s)) {
    const t = P.join(", ");
    throw new Error(
      `[SDK] Unsupported version "${s}". Supported versions: ${t}. Current SDK version: ${D}`
    );
  }
}
const Bt = {
  AUTH_OPEN: "core:authWindowOpen",
  AUTH_CLOSE: "core:authWindowClose"
};
class p {
  constructor() {
    this.eventBus = new tt(), this.systemParams = {}, this.initialized = !1, this.detectEnvironment(), this.apiClient = new Z(() => this.systemParams.authToken), this.configs = new It(this.apiClient), this.abTests = new Rt(this.apiClient), this.remoteConfigs = new Ot(this.apiClient), this.segments = new kt(this.apiClient), this.users = new Lt(() => this.systemParams.authToken), this.health = new Ut(this.apiClient), this.auth = new Kt(() => this.systemParams.authToken), this.kv = new Nt(this.apiClient), this.events = new $t(this.apiClient);
  }
  static getInstance() {
    return p.instance || (p.instance = new p()), p.instance;
  }
  async init(t) {
    if (console.log(`[SDK] v${D} init: start`, t), t?.version) {
      console.log(`[SDK] init: validating app version "${t.version}"...`);
      try {
        Mt(t.version), console.log(`[SDK] init: app version "${t.version}" is supported`);
      } catch (r) {
        throw console.error(`[SDK] init: VERSION ERROR - ${r.message}`), console.error(`[SDK] init: Supported versions: ${P.join(", ")}`), r;
      }
    }
    const e = this.getStoredToken();
    if (e && !this.systemParams.authToken && (console.log("[SDK] init: RESTORING TOKEN FROM LOCALSTORAGE"), this.systemParams.authToken = e), this.systemParams.authToken) {
      console.log("[SDK] init: TOKEN ALREADY SET → SKIP GUEST AUTH"), this.profileClient = new L(() => this.systemParams.authToken, this.eventBus), this.initialized = !0;
      return;
    }
    if (!this.initialized)
      try {
        t?.baseUrl && (console.log("[SDK] init: set base url ->", t.baseUrl), z(t.baseUrl)), t?.authUrl && (console.log("[SDK] init: set auth url ->", t.authUrl), Y(t.authUrl)), console.log("[SDK] init: set system params ->", t), t && this.setSystemParams(t), console.log("[SDK] init: ensure device id…");
        const r = await this.ensureDeviceId();
        console.log("[SDK] init: deviceId =", r), this.systemParams.deviceId = r, t?.skipAuth ? console.log("[SDK] init: skipAuth=true, skipping guest auth") : (console.log("[SDK] init: guest auth…"), await this.authGuest(), console.log("[SDK] init: guest auth OK")), this.profileClient = new L(() => this.systemParams.authToken, this.eventBus), console.log("[SDK] init: profile module initialized"), this.on(E.PROFILE_UPDATED, (i) => {
          try {
            const n = i?.gid ?? i?.detail?.gid;
            n && (console.log("[SDK] profile cache invalidated for", n), this.profileClient.invalidate(n));
          } catch (n) {
            console.error("[SDK] profile cache invalidation error:", n);
          }
        }), this.initialized = !0, console.log("[SDK] init: COMPLETE"), this.eventBus.emit("core:initialized", this.getSystemParams());
      } catch (r) {
        throw console.error("[SDK] init: ERROR", r), this.captureError(r), r;
      }
  }
  captureError(t) {
    try {
      Pt(t);
    } catch (e) {
      console.error("[SDK] Sentry capture error:", e);
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
      console.log("[SDK] authGuest: sending POST /v1/auth/guest", {
        deviceId: this.systemParams.deviceId
      });
      const e = await this.auth.guest(this.systemParams.deviceId);
      console.log("[SDK] authGuest: server response", e);
      const r = e?.accessToken ?? e?.data?.accessToken ?? null;
      if (!r)
        throw console.error("[SDK] authGuest: ERROR missing token", e), new Error("Guest auth failed: missing token");
      this.storeToken(r), this.systemParams.authToken = r;
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
    const r = this.generateGuid();
    return this.storeDeviceId(r), r;
  }
  getStoredDeviceId() {
    try {
      return localStorage.getItem("coreSDK_deviceId");
    } catch (t) {
      return console.error("[SDK] getStoredDeviceId error:", t), null;
    }
  }
  storeDeviceId(t) {
    try {
      localStorage.setItem("coreSDK_deviceId", t);
    } catch (e) {
      console.error("[SDK] storeDeviceId error:", e);
    }
  }
  getStoredToken() {
    try {
      return localStorage.getItem("coreSDK_token");
    } catch (t) {
      return console.error("[SDK] getStoredToken error:", t), null;
    }
  }
  storeToken(t) {
    try {
      localStorage.setItem("coreSDK_token", t);
    } catch (e) {
      console.error("[SDK] storeToken error:", e);
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
      const r = e?.accessToken ?? null;
      if (!r)
        throw console.error("[SDK] login: ERROR missing token", e), new Error("Login failed: missing token");
      return this.storeToken(r), this.systemParams.authToken = r, e.user && this.setUser(e.user), e;
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
      } catch (t) {
        console.warn("[SDK] logout endpoint error (ignored):", t);
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
    } catch (t) {
      console.error("[SDK] clearToken error:", t);
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
const qt = p.getInstance();
export {
  Rt as AbTestsApiClient,
  Z as ApiClient,
  Kt as AuthApiClient,
  It as ConfigsApiClient,
  p as CoreSDK,
  tt as EventBus,
  Ut as HealthApiClient,
  Nt as KVApiClient,
  Ot as RemoteConfigsApiClient,
  Bt as SDK_EVENTS,
  D as SDK_VERSION,
  P as SUPPORTED_VERSIONS,
  kt as SegmentsApiClient,
  Lt as UsersApiClient,
  qt as coreSDK,
  xt as isVersionSupported,
  m as sdkConfig,
  Y as setAuthUrl,
  z as setBaseUrl,
  Mt as validateVersion
};
