/* ============================================================
   LIVERARY — auth.js
   Authentication System
   Handles: Login, Signup, Session, Validation, Routing
   Storage: localStorage (simulates a database)
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
   ───────────────────────────────────────────────────────────── */

/** localStorage keys */
const KEYS = {
  ACCOUNTS:  'liverary_accounts',
  SESSION:   'liverary_session',
  BOOKS:     'liverary_books',
  FAVORITES: 'liverary_favorites',
  PROGRESS:  'liverary_progress',
  CATEGORIES:'liverary_categories',
};

/** Role identifiers */
const ROLES = {
  ADMIN:     'admin',
  LIBRARIAN: 'librarian',
  MEMBER:    'member',
};

/** Dashboard routes per role */
const DASHBOARDS = {
  [ROLES.ADMIN]:     'admin-dashboard.html',
  [ROLES.LIBRARIAN]: 'librarian-dashboard.html',
  [ROLES.MEMBER]:    'member-dashboard.html',
};

/**
 * Secret code required to register as admin.
 * In a real app this would be server-side validated.
 */
const ADMIN_SECRET = 'LIVERARY_ADMIN_2025';

/** Minimum password length */
const MIN_PASSWORD_LEN = 8;


/* ─────────────────────────────────────────────────────────────
   STORAGE HELPERS
   ───────────────────────────────────────────────────────────── */

/**
 * Read a JSON value from localStorage.
 * @param {string} key
 * @param {*} fallback — returned when key is missing
 */
function storageGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Write a value to localStorage as JSON.
 * @param {string} key
 * @param {*} value
 */
function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    console.error('[Liverary] localStorage write failed for key:', key);
    return false;
  }
}

/**
 * Remove a key from localStorage.
 * @param {string} key
 */
function storageRemove(key) {
  localStorage.removeItem(key);
}


/* ─────────────────────────────────────────────────────────────
   SEED DATA — Default accounts so the app works out of the box
   ───────────────────────────────────────────────────────────── */

/**
 * Seed default accounts into localStorage if none exist.
 * Provides one account per role so the instructor can test everything.
 */
function seedDefaultAccounts() {
  const existing = storageGet(KEYS.ACCOUNTS, []);
  if (existing.length > 0) return; // already seeded

  const defaults = [
    {
      id:        'u_admin_001',
      firstName: 'System',
      lastName:  'Admin',
      email:     'admin@liverary.ph',
      password:  'Admin1234!',   // plain text — demo only
      role:      ROLES.ADMIN,
      avatar:    'SA',
      createdAt: new Date().toISOString(),
      active:    true,
    },
    {
      id:        'u_lib_001',
      firstName: 'Maria',
      lastName:  'Reyes',
      email:     'librarian@liverary.ph',
      password:  'Lib12345!',
      role:      ROLES.LIBRARIAN,
      avatar:    'MR',
      createdAt: new Date().toISOString(),
      active:    true,
    },
    {
      id:        'u_mem_001',
      firstName: 'Juan',
      lastName:  'Dela Cruz',
      email:     'member@liverary.ph',
      password:  'Member123!',
      role:      ROLES.MEMBER,
      avatar:    'JD',
      createdAt: new Date().toISOString(),
      active:    true,
    },
  ];

  storageSet(KEYS.ACCOUNTS, defaults);
  console.info('[Liverary] Default accounts seeded.');
}

/**
 * Seed default book categories.
 */
function seedDefaultCategories() {
  if (storageGet(KEYS.CATEGORIES)) return;
  storageSet(KEYS.CATEGORIES, [
    'Fiction', 'Science', 'History', 'Self-Help',
    'Technology', 'Drama', 'Travel', 'Psychology',
    'Biography', 'Philosophy', 'Business', 'Art',
  ]);
}


/* ─────────────────────────────────────────────────────────────
   VALIDATION HELPERS
   ───────────────────────────────────────────────────────────── */

/**
 * Check if a string is a valid email format.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Measure password strength (0–4).
 * Returns { score, label, colorClass }
 * @param {string} pw
 */
function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw))   score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  // Clamp to 0–4
  score = Math.min(score, 4);

  const map = [
    { label: '',        colorClass: '' },
    { label: 'Weak',    colorClass: 'active-weak'   },
    { label: 'Fair',    colorClass: 'active-fair'   },
    { label: 'Good',    colorClass: 'active-good'   },
    { label: 'Strong',  colorClass: 'active-strong' },
  ];

  return { score, ...map[score] };
}

/**
 * Check that a field is not empty.
 * @param {string} value
 */
function isNotEmpty(value) {
  return value.trim().length > 0;
}


/* ─────────────────────────────────────────────────────────────
   SESSION MANAGEMENT
   ───────────────────────────────────────────────────────────── */

/**
 * Save a session object for the logged-in user.
 * @param {Object} user — the account object (password stripped)
 */
function saveSession(user) {
  // Never store the password in the session
  const { password: _pw, ...safeUser } = user;
  storageSet(KEYS.SESSION, { ...safeUser, loginAt: new Date().toISOString(), expiresAt: Date.now() + (1000 * 60 * 60 * 2), }); //2 hrs mag-eexpire yung session
}

/**
 * Retrieve the current session.
 * @returns {Object|null}
 */
function getSession() {
  return storageGet(KEYS.SESSION, null);
}

/**
 * Clear the session (logout).
 */
function clearSession() {
  storageRemove(KEYS.SESSION);
}

/**
 * Redirect an already-logged-in user to their dashboard.
 * Call this at the top of login.html and signup.html.
 */
function redirectIfLoggedIn() {
  const session = getSession();
  if (session && session.expiresAt && Date.now() > session.expiresAt) {
    clearSession();
    return;
  }
  if (session && DASHBOARDS[session.role]) {
    window.location.href = DASHBOARDS[session.role];
  }
}

/**
 * Guard a dashboard page — redirect to login if no session.
 * Also validates the role matches the page.
 * @param {string} requiredRole — e.g. ROLES.ADMIN
 */
function requireAuth(requiredRole) {
  const session = getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  if (requiredRole && session.role !== requiredRole) {
    // Wrong role — redirect to their own dashboard
    window.location.href = DASHBOARDS[session.role] || 'login.html';
    return null;
  }
  return session;
}

/**
 * Logout the current user.
 */
function logout() {
  clearSession();
  window.location.href = 'login.html';
}


/* ─────────────────────────────────────────────────────────────
   ACCOUNT CRUD
   ───────────────────────────────────────────────────────────── */

/**
 * Find an account by email (case-insensitive).
 * @param {string} email
 * @returns {Object|null}
 */
function findAccountByEmail(email) {
  const accounts = storageGet(KEYS.ACCOUNTS, []);
  return accounts.find(a => a.email.toLowerCase() === email.toLowerCase().trim()) || null;
}

/**
 * Find an account by its ID.
 * @param {string} id
 * @returns {Object|null}
 */
function findAccountById(id) {
  const accounts = storageGet(KEYS.ACCOUNTS, []);
  return accounts.find(a => a.id === id) || null;
}

/**
 * Create a new account and store it.
 * @param {Object} data — { firstName, lastName, email, password, role }
 * @returns {{ ok: boolean, error?: string, user?: Object }}
 */
function createAccount(data) {
  const { firstName, lastName, email, password, role } = data;

  // Check for duplicate email
  if (findAccountByEmail(email)) {
    return { ok: false, error: 'An account with this email already exists.' };
  }

  // Validate role
  if (!Object.values(ROLES).includes(role)) {
    return { ok: false, error: 'Invalid role selected.' };
  }

  // Build the new user object
  const newUser = {
    id:        'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    firstName: firstName.trim(),
    lastName:  lastName.trim(),
    email:     email.toLowerCase().trim(),
    password,                            // plain text — demo only
    role,
    avatar:    (firstName[0] + (lastName[0] || '')).toUpperCase(),
    createdAt: new Date().toISOString(),
    active:    true,
  };

  const accounts = storageGet(KEYS.ACCOUNTS, []);
  accounts.push(newUser);
  storageSet(KEYS.ACCOUNTS, accounts);

  return { ok: true, user: newUser };
}

/**
 * Authenticate a user with email + password.
 * @param {string} email
 * @param {string} password
 * @returns {{ ok: boolean, error?: string, user?: Object }}
 */
function loginUser(email, password) {
  const account = findAccountByEmail(email);

  if (!account) {
    return { ok: false, error: 'No account found with this email address.' };
  }

  if (!account.active) {
    return { ok: false, error: 'This account has been deactivated. Please contact support.' };
  }

  if (account.password !== password) {
    return { ok: false, error: 'Incorrect password. Please try again.' };
  }

  return { ok: true, user: account };
}


/* ─────────────────────────────────────────────────────────────
   UI HELPERS — used by login.html and signup.html inline scripts
   ───────────────────────────────────────────────────────────── */

/**
 * Show or hide an inline field message.
 * @param {string} fieldId  — id of the field (without -msg)
 * @param {string} type     — 'error' | 'success' | 'hint' | ''
 * @param {string} message  — text to display
 */
function setFieldMsg(fieldId, type, message) {
  const el = document.getElementById(fieldId + '-msg');
  if (!el) return;
  el.className = 'field-msg ' + type;
  el.textContent = message;
}

/**
 * Set an input's visual state.
 * @param {string} inputId
 * @param {'error'|'valid'|''} state
 */
function setInputState(inputId, state) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.classList.remove('is-error', 'is-valid');
  if (state === 'error') el.classList.add('is-error');
  if (state === 'valid') el.classList.add('is-valid');
}

/**
 * Show or hide the global alert banner.
 * @param {string} elementId — id of the .auth-alert element
 * @param {'error'|'success'|''} type
 * @param {string} message
 */
function showAlert(elementId, type, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = 'auth-alert show ' + type;
  const msgEl = el.querySelector('.auth-alert-msg');
  if (msgEl) msgEl.textContent = message;
  const iconEl = el.querySelector('.auth-alert-icon');
  if (iconEl) iconEl.textContent = type === 'error' ? '⚠️' : '✓';
}

function hideAlert(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.className = 'auth-alert';
}

/**
 * Set the submit button into loading / normal state.
 * @param {string} btnId
 * @param {boolean} loading
 */
function setBtnLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
}

/**
 * Update the password strength meter.
 * @param {string} password
 */
function updateStrengthMeter(password) {
  const bars  = document.querySelectorAll('.pw-bar');
  const label = document.getElementById('pw-strength-label');
  if (!bars.length) return;

  const { score, label: strengthLabel, colorClass } = getPasswordStrength(password);

  bars.forEach((bar, i) => {
    bar.className = 'pw-bar';
    if (i < score && colorClass) bar.classList.add(colorClass);
  });

  if (label) {
    label.textContent = strengthLabel;
    label.style.color = score <= 1 ? 'var(--error)'
                      : score === 2 ? '#e8a020'
                      : score === 3 ? 'var(--gold)'
                      : 'var(--success)';
  }
}

/**
 * Toggle password field visibility.
 * @param {string} inputId
 * @param {string} toggleId
 */
function togglePasswordVisibility(inputId, toggleId) {
  const input  = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  if (!input || !toggle) return;
  const isHidden = input.type === 'password';
  input.type  = isHidden ? 'text' : 'password';
  toggle.textContent = isHidden ? '🙈' : '👁️';
}


/* ─────────────────────────────────────────────────────────────
   INITIALIZATION — Run when the script loads
   ───────────────────────────────────────────────────────────── */

(function init() {
  // Always seed default data on first load
  seedDefaultAccounts();
  seedDefaultCategories();
  console.info('[Liverary] Auth system initialized.');
})();