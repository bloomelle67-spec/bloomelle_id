(function () {
  const AUTH_KEY = 'bloomelle-auth';
  const SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000;
  const REMEMBER_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

  function safeParse(raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function clearAuth() {
    sessionStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_KEY);
  }

  function readStoredAuth() {
    const sessionAuth = safeParse(sessionStorage.getItem(AUTH_KEY) || 'null');
    const localAuth = safeParse(localStorage.getItem(AUTH_KEY) || 'null');
    const current = sessionAuth || localAuth;

    if (!current) return null;

    if (current.expiresAt && Date.now() > Number(current.expiresAt)) {
      clearAuth();
      return null;
    }

    return current;
  }

  function persistAuth(user, rememberMe) {
    const record = {
      email: user.email,
      name: user.name,
      rememberMe: Boolean(rememberMe),
      issuedAt: new Date().toISOString(),
      expiresAt: Date.now() + (rememberMe ? REMEMBER_LIFETIME_MS : SESSION_LIFETIME_MS)
    };

    clearAuth();
    const targetStorage = rememberMe ? localStorage : sessionStorage;
    targetStorage.setItem(AUTH_KEY, JSON.stringify(record));
    return record;
  }

  function getAuthUser() {
    return readStoredAuth();
  }

  function requireAuth(options = {}) {
    const auth = readStoredAuth();
    if (auth) return auth;

    const target = options.redirectTo || window.location.href;
    window.location.replace(`./login.html?redirect=${encodeURIComponent(target)}`);
    return null;
  }

  function logout(redirectTo = 'login.html') {
    clearAuth();
    window.location.replace(redirectTo);
  }

  window.BloomelleAuth = {
    getAuthUser,
    persistAuth,
    requireAuth,
    logout,
    clearAuth,
    DEMO_EMAIL: 'customer@bloomelle.id',
    DEMO_PASSWORD: 'Bloomelle@2026'
  };
})();
