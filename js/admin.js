/* ============================================================
   LIVERARY — admin.js
   Admin Dashboard Logic
   Features: Analytics, Manage Books, Manage Users,
             Manage Librarians, System Settings, Reports
   ============================================================ */

"use strict";

/* ─────────────────────────────────────────────────────────────
   STATE
   ───────────────────────────────────────────────────────────── */
let adminUser = null; // current admin session
let adminAccounts = []; // all user accounts
let adminBooks = []; // all books
let adminCats = []; // all categories
let adminEditUserId = null; // user being edited
let adminEditBookId = null; // book being edited
let adminDeleteTarget = null; // { type, id } pending deletion

/* ─────────────────────────────────────────────────────────────
   STORAGE KEYS
   ───────────────────────────────────────────────────────────── */
const AK = {
  SESSION: "liverary_session",
  ACCOUNTS: "liverary_accounts",
  BOOKS: "liverary_books",
  CATEGORIES: "liverary_categories",
  FAVORITES: "liverary_favorites",
  PROGRESS: "liverary_progress",
  ACTIVITY: "liverary_activity",
};

/* ─────────────────────────────────────────────────────────────
   STORAGE HELPERS
   ───────────────────────────────────────────────────────────── */
const aGet = (k, fb = null) => {
  try {
    const r = localStorage.getItem(k);
    return r ? JSON.parse(r) : fb;
  } catch {
    return fb;
  }
};
const aSet = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    console.error(e);
  }
};

/* ─────────────────────────────────────────────────────────────
   SEED DEFAULT DATA
   ───────────────────────────────────────────────────────────── */
function adminSeedAll() {
  /* Accounts */
  if (!aGet(AK.ACCOUNTS) || aGet(AK.ACCOUNTS).length === 0) {
    aSet(AK.ACCOUNTS, [
      {
        id: "u_admin_001",
        firstName: "System",
        lastName: "Admin",
        email: "admin@liverary.ph",
        password: "Admin1234!",
        role: "admin",
        avatar: "SA",
        createdAt: "2025-01-01T00:00:00.000Z",
        active: true,
      },
      {
        id: "u_lib_001",
        firstName: "Maria",
        lastName: "Reyes",
        email: "librarian@liverary.ph",
        password: "Lib12345!",
        role: "librarian",
        avatar: "MR",
        createdAt: "2025-01-05T00:00:00.000Z",
        active: true,
      },
      {
        id: "u_lib_002",
        firstName: "Carlo",
        lastName: "Santos",
        email: "carlo@liverary.ph",
        password: "Lib12345!",
        role: "librarian",
        avatar: "CS",
        createdAt: "2025-01-08T00:00:00.000Z",
        active: true,
      },
      {
        id: "u_mem_001",
        firstName: "Juan",
        lastName: "Dela Cruz",
        email: "member@liverary.ph",
        password: "Member123!",
        role: "member",
        avatar: "JD",
        createdAt: "2025-01-10T00:00:00.000Z",
        active: true,
      },
      {
        id: "u_mem_002",
        firstName: "Andrea",
        lastName: "Santos",
        email: "andrea@liverary.ph",
        password: "Member123!",
        role: "member",
        avatar: "AS",
        createdAt: "2025-01-12T00:00:00.000Z",
        active: true,
      },
      {
        id: "u_mem_003",
        firstName: "Bianca",
        lastName: "Cruz",
        email: "bianca@liverary.ph",
        password: "Member123!",
        role: "member",
        avatar: "BC",
        createdAt: "2025-01-14T00:00:00.000Z",
        active: true,
      },
      {
        id: "u_mem_004",
        firstName: "Miguel",
        lastName: "Ramos",
        email: "miguel@liverary.ph",
        password: "Member123!",
        role: "member",
        avatar: "MR",
        createdAt: "2025-01-18T00:00:00.000Z",
        active: false,
      },
      {
        id: "u_mem_005",
        firstName: "Sofia",
        lastName: "Lim",
        email: "sofia@liverary.ph",
        password: "Member123!",
        role: "member",
        avatar: "SL",
        createdAt: "2025-02-01T00:00:00.000Z",
        active: true,
      },
    ]);
  }

  /* Books */
  if (!aGet(AK.BOOKS)) {
    aSet(AK.BOOKS, [
      {
        id: "b001",
        title: "Atomic Habits",
        author: "James Clear",
        category: "Self-Help",
        cover: "bc-1",
        rating: 4.9,
        pages: 320,
        featured: true,
        description: "Tiny changes, remarkable results.",
        uploadedBy: "librarian@liverary.ph",
        uploadedAt: "2025-01-10T00:00:00.000Z",
        views: 1240,
      },
      {
        id: "b002",
        title: "Deep Work",
        author: "Cal Newport",
        category: "Self-Help",
        cover: "bc-2",
        rating: 4.7,
        pages: 296,
        featured: true,
        description: "Rules for focused success.",
        uploadedBy: "librarian@liverary.ph",
        uploadedAt: "2025-01-12T00:00:00.000Z",
        views: 980,
      },
      {
        id: "b003",
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        category: "Psychology",
        cover: "bc-3",
        rating: 4.8,
        pages: 499,
        featured: false,
        description: "Two systems of thinking.",
        uploadedBy: "carlo@liverary.ph",
        uploadedAt: "2025-01-15T00:00:00.000Z",
        views: 760,
      },
      {
        id: "b004",
        title: "The Psychology of Money",
        author: "Morgan Housel",
        category: "Business",
        cover: "bc-4",
        rating: 4.9,
        pages: 256,
        featured: true,
        description: "Lessons on wealth and happiness.",
        uploadedBy: "librarian@liverary.ph",
        uploadedAt: "2025-01-18T00:00:00.000Z",
        views: 1100,
      },
      {
        id: "b005",
        title: "Sapiens",
        author: "Yuval Noah Harari",
        category: "History",
        cover: "bc-5",
        rating: 4.8,
        pages: 443,
        featured: true,
        description: "A brief history of humankind.",
        uploadedBy: "carlo@liverary.ph",
        uploadedAt: "2025-01-20T00:00:00.000Z",
        views: 1380,
      },
      {
        id: "b006",
        title: "Zero to One",
        author: "Peter Thiel",
        category: "Business",
        cover: "bc-6",
        rating: 4.6,
        pages: 224,
        featured: false,
        description: "How to build the future.",
        uploadedBy: "librarian@liverary.ph",
        uploadedAt: "2025-02-01T00:00:00.000Z",
        views: 620,
      },
      {
        id: "b007",
        title: "The Subtle Art",
        author: "Mark Manson",
        category: "Self-Help",
        cover: "bc-7",
        rating: 4.5,
        pages: 224,
        featured: false,
        description: "A counterintuitive approach.",
        uploadedBy: "librarian@liverary.ph",
        uploadedAt: "2025-02-05T00:00:00.000Z",
        views: 540,
      },
      {
        id: "b008",
        title: "Educated",
        author: "Tara Westover",
        category: "Biography",
        cover: "bc-8",
        rating: 4.9,
        pages: 334,
        featured: true,
        description: "A memoir of survival and education.",
        uploadedBy: "carlo@liverary.ph",
        uploadedAt: "2025-02-10T00:00:00.000Z",
        views: 890,
      },
      {
        id: "b009",
        title: "Dune",
        author: "Frank Herbert",
        category: "Fiction",
        cover: "bc-1",
        rating: 4.7,
        pages: 688,
        featured: false,
        description: "The desert planet epic.",
        uploadedBy: "librarian@liverary.ph",
        uploadedAt: "2025-02-15T00:00:00.000Z",
        views: 430,
      },
      {
        id: "b010",
        title: "1984",
        author: "George Orwell",
        category: "Fiction",
        cover: "bc-2",
        rating: 4.8,
        pages: 328,
        featured: false,
        description: "A dystopian classic.",
        uploadedBy: "carlo@liverary.ph",
        uploadedAt: "2025-02-18T00:00:00.000Z",
        views: 720,
      },
      {
        id: "b011",
        title: "The Lean Startup",
        author: "Eric Ries",
        category: "Business",
        cover: "bc-3",
        rating: 4.4,
        pages: 336,
        featured: false,
        description: "Build, measure, learn.",
        uploadedBy: "librarian@liverary.ph",
        uploadedAt: "2025-03-01T00:00:00.000Z",
        views: 380,
      },
      {
        id: "b012",
        title: "Ikigai",
        author: "Héctor García",
        category: "Self-Help",
        cover: "bc-4",
        rating: 4.6,
        pages: 208,
        featured: false,
        description: "The Japanese secret to happiness.",
        uploadedBy: "carlo@liverary.ph",
        uploadedAt: "2025-03-05T00:00:00.000Z",
        views: 490,
      },
      {
        id: "b013",
        title: "A Brief History of Time",
        author: "Stephen Hawking",
        category: "Science",
        cover: "bc-5",
        rating: 4.7,
        pages: 212,
        featured: false,
        description: "Space, time and the universe.",
        uploadedBy: "librarian@liverary.ph",
        uploadedAt: "2025-03-10T00:00:00.000Z",
        views: 560,
      },
      {
        id: "b014",
        title: "The Alchemist",
        author: "Paulo Coelho",
        category: "Fiction",
        cover: "bc-6",
        rating: 4.6,
        pages: 197,
        featured: true,
        description: "Follow your dream.",
        uploadedBy: "carlo@liverary.ph",
        uploadedAt: "2025-03-12T00:00:00.000Z",
        views: 940,
      },
      {
        id: "b015",
        title: "Meditations",
        author: "Marcus Aurelius",
        category: "Philosophy",
        cover: "bc-7",
        rating: 4.8,
        pages: 256,
        featured: false,
        description: "Stoic philosophy for life.",
        uploadedBy: "librarian@liverary.ph",
        uploadedAt: "2025-03-15T00:00:00.000Z",
        views: 670,
      },
      {
        id: "b016",
        title: "The Art of War",
        author: "Sun Tzu",
        category: "Philosophy",
        cover: "bc-8",
        rating: 4.5,
        pages: 160,
        featured: false,
        description: "Ancient strategy guide.",
        uploadedBy: "carlo@liverary.ph",
        uploadedAt: "2025-03-18T00:00:00.000Z",
        views: 410,
      },
    ]);
  }

  /* Categories */
  if (!aGet(AK.CATEGORIES)) {
    aSet(AK.CATEGORIES, [
      "Fiction",
      "Science",
      "History",
      "Self-Help",
      "Technology",
      "Drama",
      "Travel",
      "Psychology",
      "Biography",
      "Philosophy",
      "Business",
      "Art",
    ]);
  }
}

/* ─────────────────────────────────────────────────────────────
   LOAD SESSION & DATA
   ───────────────────────────────────────────────────────────── */
function loadAdminData() {
  const s = aGet(AK.SESSION);
  if (!s || s.role !== "admin") {
    window.location.href = "login.html";
    return;
  }
  adminUser = s;
  adminAccounts = aGet(AK.ACCOUNTS, []);
  adminBooks = aGet(AK.BOOKS, []);
  adminCats = aGet(AK.CATEGORIES, []);
}

let adminActivityLog = []; // librarian CRUD entries from liverary_activity

function refreshAdminData() {
  adminAccounts    = aGet(AK.ACCOUNTS, []);
  adminBooks       = aGet(AK.BOOKS, []);
  adminCats        = aGet(AK.CATEGORIES, []);
  adminActivityLog = aGet(AK.ACTIVITY, []);
}

/* ─────────────────────────────────────────────────────────────
   ACTIVITY LOG HELPER (Admin writes — same key as librarian)
   ───────────────────────────────────────────────────────────── */
function logAdminActivity(action, bookTitle) {
  try {
    const log = aGet(AK.ACTIVITY, []);
    const who = adminUser
      ? `${adminUser.firstName} ${adminUser.lastName}`
      : 'Admin';
    log.unshift({
      action,      // 'added' | 'edited' | 'deleted' | 'content-edited'
      bookTitle,
      who,
      role:  'Admin',
      email: adminUser ? adminUser.email : '',
      time:  new Date().toISOString(),
    });
    aSet(AK.ACTIVITY, log.slice(0, 50));
  } catch (e) {
    console.error('[Liverary] logAdminActivity failed:', e);
  }
}

/* ─────────────────────────────────────────────────────────────
   POPULATE USER UI
   ───────────────────────────────────────────────────────────── */
function populateAdminUI() {
  if (!adminUser) return;
  const full = `${adminUser.firstName} ${adminUser.lastName}`;
  document
    .querySelectorAll("[data-admin-name]")
    .forEach((el) => (el.textContent = full));
  document
    .querySelectorAll("[data-admin-avatar]")
    .forEach((el) => (el.textContent = adminUser.avatar || "A"));
  document
    .querySelectorAll("[data-admin-first]")
    .forEach((el) => (el.textContent = adminUser.firstName));
  document
    .querySelectorAll("[data-admin-email]")
    .forEach((el) => (el.textContent = adminUser.email));
}

/* ─────────────────────────────────────────────────────────────
   SECTION: ANALYTICS OVERVIEW
   ───────────────────────────────────────────────────────────── */
function renderAdminHome() {
  refreshAdminData();

  const members = adminAccounts.filter((a) => a.role === "member");
  const librarians = adminAccounts.filter((a) => a.role === "librarian");
  const active = adminAccounts.filter((a) => a.active);
  const featured = adminBooks.filter((b) => b.featured);
  const totalViews = adminBooks.reduce((s, b) => s + (b.views || 0), 0);

  /* Stat cards */
  document.getElementById("adm-stat-users").textContent = adminAccounts.length;
  document.getElementById("adm-stat-members").textContent = members.length;
  document.getElementById("adm-stat-libs").textContent = librarians.length;
  document.getElementById("adm-stat-books").textContent = adminBooks.length;
  document.getElementById("adm-stat-featured").textContent = featured.length;
  document.getElementById("adm-stat-views").textContent =
    totalViews.toLocaleString();
  document.getElementById("adm-stat-active").textContent = active.length;
  document.getElementById("adm-stat-cats").textContent = adminCats.length;

  renderRoleDistribution(
    members.length,
    librarians.length,
    adminAccounts.filter((a) => a.role === "admin").length,
  );
  renderTopBooksChart();
  renderRecentUsersTable();
  renderActivityFeed();
}

/* Role doughnut (CSS-based) */
function renderRoleDistribution(members, librarians, admins) {
  const total = members + librarians + admins || 1;
  const mPct = Math.round((members / total) * 100);
  const lPct = Math.round((librarians / total) * 100);
  const aPct = Math.round((admins / total) * 100);
  const el = document.getElementById("role-dist-wrap");

  if (!el) return;

  el.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px;">

      ${roleBar(
        '<span class="role-label"><i data-lucide="user-round"></i><span>Members</span></span>',
        members,
        mPct,
        "var(--gold)",
      )}

      ${roleBar(
        '<span class="role-label"><i data-lucide="user-round-pen"></i><span>Librarians</span></span>',
        librarians,
        lPct,
        "var(--olive)",
      )}

      ${roleBar(
        '<span class="role-label"><i data-lucide="user-round-key"></i><span>Admins</span></span>',
        admins,
        aPct,
        "var(--brown-dark)",
      )}

    </div>
  `;

  lucide.createIcons();
}
function roleBar(label, count, pct, color) {
  return `
    <div>
      <div style="display:flex; justify-content:space-between; font-size:0.8rem;
                  font-weight:500; color:var(--text-dark); margin-bottom:5px;">
        <span>${label}</span>
        <span style="color:${color}; font-weight:700;">${count} (${pct}%)</span>
      </div>
      <div style="height:9px; background:rgba(67,48,42,0.08); border-radius:5px; overflow:hidden;">
        <div style="height:100%; width:${pct}%; background:${color}; border-radius:5px;
                    transition:width 0.9s ease;"></div>
      </div>
    </div>`;
}

/* Top 5 books by views */
function renderTopBooksChart() {
  const el = document.getElementById("top-books-chart");
  if (!el) return;
  const top = [...adminBooks]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);
  const max = top[0]?.views || 1;
  el.innerHTML = top
    .map(
      (b, i) => `
    <div style="margin-bottom:14px;">
      <div style="display:flex; justify-content:space-between; align-items:center;
                  font-size:0.8rem; margin-bottom:5px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="width:20px; height:20px; background:${i === 0 ? "var(--gold)" : "rgba(67,48,42,0.10)"};
                       border-radius:50%; display:inline-flex; align-items:center; justify-content:center;
                       font-size:0.65rem; font-weight:700; color:${i === 0 ? "white" : "var(--text-muted)"};">
            ${i + 1}
          </span>
          <span style="font-weight:600; color:var(--brown-dark); max-width:160px;
                       white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${b.title}</span>
        </div>
        <span style="color:var(--gold); font-weight:700; font-size:0.76rem; flex-shrink:0;">
          ${(b.views || 0).toLocaleString()}
        </span>
      </div>
      <div style="height:7px; background:rgba(67,48,42,0.08); border-radius:4px; overflow:hidden;">
        <div style="height:100%; width:${((b.views || 0) / max) * 100}%;
                    background:linear-gradient(90deg,var(--gold),var(--brown-mid));
                    border-radius:4px; transition:width 0.9s ease;"></div>
      </div>
    </div>`,
    )
    .join("");
}

/* Recent 5 users table */
function renderRecentUsersTable() {
  const el = document.getElementById("recent-users-table");
  if (!el) return;
  const recent = [...adminAccounts]
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 5);

  el.innerHTML = recent
    .map(
      (u) => `
    <tr class="table-row">
      <td>
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:34px; height:34px; border-radius:50%; flex-shrink:0;
                      background:${roleGradient(u.role)};
                      display:flex; align-items:center; justify-content:center;
                      font-family:'Playfair Display',serif; font-size:0.82rem;
                      font-weight:700; color:white;">${u.avatar || "?"}</div>
          <div>
            <div style="font-size:0.84rem; font-weight:600; color:var(--brown-dark);">
              ${u.firstName} ${u.lastName}</div>
            <div style="font-size:0.7rem; color:var(--text-muted);">${u.email}</div>
          </div>
        </div>
      </td>
      <td>${roleBadgeHTML(u.role)}</td>
      <td>${statusBadgeHTML(u.active)}</td>
      <td style="font-size:0.76rem; color:var(--text-muted);">${adminFmtDate(u.createdAt)}</td>
    </tr>`,
    )
    .join("");
}

/* Activity feed */
function renderActivityFeed() {
  const el = document.getElementById("admin-activity-feed");
  if (!el) return;

  const feed = [];

  /* ── Librarian book CRUD actions ── */
  const iconMap  = { added: "📗", edited: "✏️", deleted: "🗑️", "content-edited": "📝" };
  const colorMap = {
    added:          "rgba(46,125,82,0.12)",
    edited:         "rgba(196,150,44,0.12)",
    deleted:        "rgba(180,40,40,0.10)",
    "content-edited": "rgba(101,90,0,0.10)",
  };
  const labelMap = { added: "added", edited: "edited", deleted: "deleted", "content-edited": "edited content of" };

  adminActivityLog.forEach((entry) => {
    feed.push({
      icon:  iconMap[entry.action]  || "📚",
      color: colorMap[entry.action] || "rgba(101,90,0,0.10)",
      text:  `<strong>${entry.role ? entry.role + ' ' : ''}${entry.who || "Librarian"}</strong> ${labelMap[entry.action] || entry.action} <strong>"${entry.bookTitle}"</strong>`,
      time:  entry.time,
    });
  });

  /* ── Recent user registrations ── */
  [...adminAccounts].slice(-4).forEach((u) => {
    feed.push({
      icon:  "👤",
      color: "rgba(196,150,44,0.12)",
      text:  `<strong>${u.firstName} ${u.lastName}</strong> registered as ${u.role}`,
      time:  u.createdAt,
    });
  });

  /* ── Fallback when no CRUD log exists yet ── */
  if (adminActivityLog.length === 0) {
    [...adminBooks]
      .sort((a, b) => (b.uploadedAt || "").localeCompare(a.uploadedAt || ""))
      .slice(0, 4)
      .forEach((b) => {
        feed.push({
          icon:  "📚",
          color: "rgba(101,90,0,0.10)",
          text:  `<strong>${b.title}</strong> was uploaded by ${b.uploadedBy}`,
          time:  b.uploadedAt,
        });
      });
  }

  feed.sort((a, b) => (b.time || "").localeCompare(a.time || ""));

  if (feed.length === 0) {
    el.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted); font-size:0.85rem;">No activity yet.</div>`;
    return;
  }

  el.innerHTML = feed
    .slice(0, 8)
    .map(
      (f) => `
    <div style="display:flex; align-items:flex-start; gap:11px; padding:11px 0;
                border-bottom:1px solid rgba(67,48,42,0.05);">
      <div style="width:34px; height:34px; background:${f.color}; border-radius:8px;
                  display:flex; align-items:center; justify-content:center;
                  font-size:1rem; flex-shrink:0;">${f.icon}</div>
      <div>
        <div style="font-size:0.82rem; color:var(--text-dark); line-height:1.5;">${f.text}</div>
        <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">${adminFmtDate(f.time)}</div>
      </div>
    </div>`,
    )
    .join("");
}

/* ─────────────────────────────────────────────────────────────
   SECTION: MANAGE USERS (Members + Librarians)
   ───────────────────────────────────────────────────────────── */
function renderUsersTable(
  search = "",
  roleFilter = "all",
  statusFilter = "all",
) {
  refreshAdminData();
  let users = [...adminAccounts];

  if (search.trim()) {
    const q = search.toLowerCase();
    users = users.filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }
  if (roleFilter !== "all") users = users.filter((u) => u.role === roleFilter);
  if (statusFilter !== "all")
    users = users.filter((u) => String(u.active) === statusFilter);

  users.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  document.getElementById("users-count").textContent =
    `${users.length} user${users.length !== 1 ? "s" : ""}`;

  const tbody = document.getElementById("users-table-body");
  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted); font-size:0.88rem;">
      <div style="font-size:2.2rem; margin-bottom:8px;">👥</div>No users match your search.</td></tr>`;
    return;
  }

  tbody.innerHTML = users
    .map(
      (u) => `
    <tr class="table-row">
      <td>
        <div style="display:flex; align-items:center; gap:11px;">
          <div style="width:38px; height:38px; border-radius:50%; flex-shrink:0;
                      background:${roleGradient(u.role)};
                      display:flex; align-items:center; justify-content:center;
                      font-family:'Playfair Display',serif; font-size:0.9rem;
                      font-weight:700; color:white;">${u.avatar || "?"}</div>
          <div>
            <div style="font-size:0.85rem; font-weight:600; color:var(--brown-dark);">
              ${u.firstName} ${u.lastName}
              ${u.id === adminUser.id ? '<span style="font-size:0.62rem; background:rgba(196,150,44,0.15); color:var(--brown-mid); padding:2px 7px; border-radius:10px; margin-left:6px; font-weight:700;">You</span>' : ""}
            </div>
            <div style="font-size:0.71rem; color:var(--text-muted);">${u.email}</div>
          </div>
        </div>
      </td>
      <td>${roleBadgeHTML(u.role)}</td>
      <td>${statusBadgeHTML(u.active)}</td>
      <td style="font-size:0.78rem; color:var(--text-muted);">${adminFmtDate(u.createdAt)}</td>
      <td style="font-size:0.78rem; color:var(--text-muted);">${u.id}</td>
      <td>
        <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
          <button class="btn btn-outline btn-sm"
                  onclick="openUserModal('${u.id}')">

            <i data-lucide="pencil"></i>

            <span>Edit</span>

          </button>

          <button class="btn btn-sm ${u.active ? "btn-warning" : "btn-success-sm"}"
                  onclick="toggleUserStatus('${u.id}')"
                  ${u.id === adminUser.id ? 'disabled title="Cannot deactivate yourself"' : ""}>

            ${
              u.active
                ? '<i data-lucide="user-round-x"></i><span>Deactivate</span>'
                : '<i data-lucide="user-round-check"></i><span>Activate</span>'
            }

          </button>

          <button class="btn btn-danger btn-sm"
                  onclick="confirmAdminDelete(\'user\', \'${u.id}\')"
                  ${u.id === adminUser.id ? 'disabled title="Cannot delete yourself"' : ""}>

            <i data-lucide="trash-2"></i>

          </button>

        </div>
      </td>
    </tr>`,
    )
    .join("");
  lucide.createIcons();
}

/* Toggle active status */
function toggleUserStatus(userId) {
  const idx = adminAccounts.findIndex((a) => a.id === userId);
  if (idx === -1) return;
  if (adminAccounts[idx].id === adminUser.id) {
    adminShowToast("You cannot deactivate your own account.", "error");
    return;
  }
  adminAccounts[idx].active = !adminAccounts[idx].active;
  aSet(AK.ACCOUNTS, adminAccounts);
  const label = adminAccounts[idx].active ? "activated ✅" : "deactivated 🚫";
  adminShowToast(
    `${adminAccounts[idx].firstName} ${adminAccounts[idx].lastName} has been ${label}.`,
    adminAccounts[idx].active ? "success" : "",
  );
  renderUsersTable(
    document.getElementById("users-search")?.value || "",
    document.getElementById("users-role-filter")?.value || "all",
    document.getElementById("users-status-filter")?.value || "all",
  );
  if (document.getElementById("section-adm-home").classList.contains("active"))
    renderAdminHome();
}

/* ─────────────────────────────────────────────────────────────
   USER EDIT MODAL
   ───────────────────────────────────────────────────────────── */
function openUserModal(userId) {
  const u = adminAccounts.find((a) => a.id === userId);
  if (!u) return;
  adminEditUserId = userId;

  document.getElementById("umodal-title").innerHTML =
    `<i data-lucide="pencil"></i><span>Edit User</span>`;
  lucide.createIcons();
  document.getElementById("umodal-first").value = u.firstName;
  document.getElementById("umodal-last").value = u.lastName;
  document.getElementById("umodal-email").value = u.email;
  document.getElementById("umodal-role").value = u.role;
  document.getElementById("umodal-active").checked = u.active;
  document.getElementById("umodal-active-label").textContent = u.active
    ? "Active"
    : "Inactive";

  document.getElementById("user-modal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function openAddUserModal() {
  adminEditUserId = null;

  document.getElementById("umodal-title").innerHTML =
    `<i data-lucide="user-round-plus"></i><span>Add New User</span>`;
  lucide.createIcons();
  document.getElementById("umodal-first").value = "";
  document.getElementById("umodal-last").value = "";
  document.getElementById("umodal-email").value = "";
  document.getElementById("umodal-role").value = "member";
  document.getElementById("umodal-password").value = "";
  document.getElementById("umodal-active").checked = true;
  document.getElementById("umodal-active-label").textContent = "Active";
  document.getElementById("umodal-pw-row").style.display = "block";

  document.getElementById("user-modal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeUserModal() {
  adminEditUserId = null;
  document.getElementById("user-modal").classList.remove("open");
  document.body.style.overflow = "";
}

function handleUserFormSubmit(e) {
  e.preventDefault();
  const first = document.getElementById("umodal-first").value.trim();
  const last = document.getElementById("umodal-last").value.trim();
  const email = document
    .getElementById("umodal-email")
    .value.trim()
    .toLowerCase();
  const role = document.getElementById("umodal-role").value;
  const active = document.getElementById("umodal-active").checked;
  const password = document.getElementById("umodal-password").value;

  if (!first || !last || !email) {
    adminShowToast("⚠️ Name and email are required.", "error");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    adminShowToast("⚠️ Invalid email address.", "error");
    return;
  }

  refreshAdminData();

  if (adminEditUserId) {
    /* Update */
    const idx = adminAccounts.findIndex((a) => a.id === adminEditUserId);
    if (idx === -1) return;
    adminAccounts[idx] = {
      ...adminAccounts[idx],
      firstName: first,
      lastName: last,
      email,
      role,
      active,
      avatar: (first[0] + (last[0] || "")).toUpperCase(),
    };
    if (password && password.length >= 8)
      adminAccounts[idx].password = password;
    aSet(AK.ACCOUNTS, adminAccounts);
    adminShowToast(`✓ ${first} ${last} updated successfully.`, "success");

    /* If editing self — update session */
    if (adminEditUserId === adminUser.id) {
      adminUser = { ...adminUser, ...adminAccounts[idx] };
      aSet(AK.SESSION, adminUser);
      populateAdminUI();
    }
  } else {
    /* Create new */
    if (!password || password.length < 8) {
      adminShowToast("⚠️ Password must be at least 8 characters.", "error");
      return;
    }
    const dup = adminAccounts.find((a) => a.email === email);
    if (dup) {
      adminShowToast("⚠️ Email already in use.", "error");
      return;
    }
    adminAccounts.push({
      id: "u_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      firstName: first,
      lastName: last,
      email,
      password,
      role,
      active,
      avatar: (first[0] + (last[0] || "")).toUpperCase(),
      createdAt: new Date().toISOString(),
    });
    aSet(AK.ACCOUNTS, adminAccounts);
    adminShowToast(`✓ ${first} ${last} (${role}) created!`, "success");
  }

  closeUserModal();
  renderUsersTable();
  if (document.getElementById("section-adm-home").classList.contains("active"))
    renderAdminHome();
}

/* ─────────────────────────────────────────────────────────────
   SECTION: MANAGE BOOKS (Admin view — full control)
   ───────────────────────────────────────────────────────────── */
function renderAdminBooks(search = "", cat = "all", filter = "all") {
  refreshAdminData();
  let books = [...adminBooks];

  if (search.trim()) {
    const q = search.toLowerCase();
    books = books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q),
    );
  }
  if (cat !== "all") books = books.filter((b) => b.category === cat);
  if (filter === "featured") books = books.filter((b) => b.featured);

  books.sort((a, b) => (b.uploadedAt || "").localeCompare(a.uploadedAt || ""));

  document.getElementById("adm-books-count").textContent =
    `${books.length} book${books.length !== 1 ? "s" : ""}`;

  const tbody = document.getElementById("adm-books-tbody");
  if (books.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted); font-size:0.88rem;">
      <div style="font-size:2.2rem; margin-bottom:8px;">📭</div>No books found.</td></tr>`;
    return;
  }

  tbody.innerHTML = books
    .map(
      (b) => `
    <tr class="table-row">
      <td>
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="${b.cover}" style="width:32px; height:44px; border-radius:3px 7px 7px 3px; flex-shrink:0;"></div>
          <div>
            <div style="font-size:0.84rem; font-weight:600; color:var(--brown-dark);
                        max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${b.title}</div>
            <div style="font-size:0.7rem; color:var(--text-muted);">${b.author}</div>
          </div>
        </div>
      </td>
      <td><span class="chip">${b.category}</span></td>
      <td style="font-size:0.82rem; color:var(--gold); font-weight:600;">★ ${b.rating}</td>
      <td style="font-size:0.76rem; color:var(--text-muted);">${(b.views || 0).toLocaleString()}</td>
      <td style="font-size:0.76rem; color:var(--text-muted); max-width:150px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${b.uploadedBy || "—"}</td>
      <td>
        <span onclick="adminToggleFeatured('${b.id}')"
              style="display:inline-flex; align-items:center; gap:5px; font-size:0.72rem; font-weight:600;
                     padding:3px 10px; border-radius:20px; cursor:pointer; white-space:nowrap;
                     background:${b.featured ? "rgba(196,150,44,0.15)" : "rgba(67,48,42,0.07)"};
                     color:${b.featured ? "var(--brown-mid)" : "var(--text-muted)"};
                     border:1px solid ${b.featured ? "rgba(196,150,44,0.3)" : "transparent"};">
          ${b.featured ? "⭐ Featured" : "☆ Feature"}
        </span>
      </td>
      <td>
        <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">

  <button class="btn btn-outline btn-sm"
          onclick="openAdminBookModal('${b.id}')">
    <i data-lucide="pencil"></i>
    <span>Details</span>
  </button>

  <button class="btn btn-sm" style="background:rgba(196,150,44,0.12); color:var(--brown-mid);
          border:1px solid rgba(196,150,44,0.25);"
          onclick="openAdminBookContentEditor('${b.id}')">
    <i data-lucide="book-open"></i>
    <span>Content</span>
  </button>

  <button class="btn btn-danger btn-sm"
          onclick="confirmAdminDelete('book', '${b.id}')">
    <i data-lucide="trash-2"></i>
  </button>

</div>
      </td>
    </tr>`,
    )
    .join("");
  lucide.createIcons();
}

function adminToggleFeatured(bookId) {
  const idx = adminBooks.findIndex((b) => b.id === bookId);
  if (idx === -1) return;
  adminBooks[idx].featured = !adminBooks[idx].featured;
  aSet(AK.BOOKS, adminBooks);
  adminShowToast(
    `"${adminBooks[idx].title}" ${adminBooks[idx].featured ? "is now featured ⭐" : "unfeatured"}.`,
    adminBooks[idx].featured ? "success" : "",
  );
  renderAdminBooks(
    document.getElementById("adm-books-search")?.value || "",
    document.getElementById("adm-books-cat")?.value || "all",
    document.getElementById("adm-books-filter")?.value || "all",
  );
}

/* Admin book modal */
const ADM_COVERS = [
  "bc-1",
  "bc-2",
  "bc-3",
  "bc-4",
  "bc-5",
  "bc-6",
  "bc-7",
  "bc-8",
];

function openAdminBookModal(bookId) {
  const b = adminBooks.find((x) => x.id === bookId);
  if (!b) return;
  adminEditBookId = bookId;

  document.getElementById("adm-bmodal-title").textContent = "✏️ Edit Book";
  document.getElementById("adm-bform-title").value = b.title;
  document.getElementById("adm-bform-author").value = b.author;
  document.getElementById("adm-bform-category").value = b.category;
  document.getElementById("adm-bform-pages").value = b.pages;
  document.getElementById("adm-bform-rating").value = b.rating;
  document.getElementById("adm-brating-display").textContent =
    (+b.rating).toFixed(1) + " ★";
  document.getElementById("adm-bform-description").value = b.description || "";
  document.getElementById("adm-bform-featured").checked = !!b.featured;
  admSelectCover(b.cover || "bc-1");

  document.getElementById("adm-book-modal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function openAddAdminBookModal() {
  adminEditBookId = null;
  document.getElementById("adm-bmodal-title").textContent = "📤 Add New Book";
  document.getElementById("adm-bform-title").value = "";
  document.getElementById("adm-bform-author").value = "";
  document.getElementById("adm-bform-category").value = adminCats[0] || "";
  document.getElementById("adm-bform-pages").value = "";
  document.getElementById("adm-bform-rating").value = "4.5";
  document.getElementById("adm-brating-display").textContent = "4.5 ★";
  document.getElementById("adm-bform-description").value = "";
  document.getElementById("adm-bform-featured").checked = false;
  admSelectCover("bc-1");

  document.getElementById("adm-book-modal").classList.add("open");
  document.body.style.overflow = "hidden";
}

/* ── Open the full Book Structure Editor for a book ── */
function openAdminBookContentEditor(bookId) {
  refreshAdminData();
  const b = bookId
    ? adminBooks.find((x) => x.id === bookId)
    : { frontMatter: [], chapters: [], backMatter: [] };
  if (!b) return;

  openBookEditor(bookId, beEnsureBookStructure({ ...b }), (id, structure) => {
    refreshAdminData();
    if (id) {
      /* Editing existing */
      const idx = adminBooks.findIndex((x) => x.id === id);
      if (idx !== -1) {
        adminBooks[idx] = { ...adminBooks[idx], ...structure };
        aSet(AK.BOOKS, adminBooks);
        logAdminActivity('content-edited', adminBooks[idx].title);
        adminShowToast(`✓ Book structure saved for "${adminBooks[idx].title}".`, "success");
      }
    } else {
      /* New book — structure will be attached when handleAdminBookSubmit saves it */
      window._pendingBookStructure = structure;
      adminShowToast("✓ Content saved — fill in book details and click Save Book.", "success");
    }
    renderAdminBooks();
  });
}

function closeAdminBookModal() {
  adminEditBookId = null;
  document.getElementById("adm-book-modal").classList.remove("open");
  document.body.style.overflow = "";
}

function admSelectCover(cover) {
  document
    .querySelectorAll(".adm-cover-swatch")
    .forEach((el) =>
      el.classList.toggle("selected", el.dataset.cover === cover),
    );
  document.getElementById("adm-selected-cover").value = cover;
  const prev = document.getElementById("adm-cover-preview");
  if (prev) prev.className = "cover-preview-box " + cover;
}

function handleAdminBookSubmit(e) {
  e.preventDefault();
  const title = document.getElementById("adm-bform-title").value.trim();
  const author = document.getElementById("adm-bform-author").value.trim();
  const cat = document.getElementById("adm-bform-category").value;
  const pages = parseInt(document.getElementById("adm-bform-pages").value, 10);
  const rating = parseFloat(document.getElementById("adm-bform-rating").value);
  const desc = document.getElementById("adm-bform-description").value.trim();
  const featured = document.getElementById("adm-bform-featured").checked;
  const cover = document.getElementById("adm-selected-cover").value || "bc-1";

  if (!title) {
    adminShowToast("⚠️ Title required.", "error");
    return;
  }
  if (!author) {
    adminShowToast("⚠️ Author required.", "error");
    return;
  }
  if (!pages || pages < 1) {
    adminShowToast("⚠️ Valid page count required.", "error");
    return;
  }

  refreshAdminData();

  if (adminEditBookId) {
    const idx = adminBooks.findIndex((b) => b.id === adminEditBookId);
    if (idx !== -1) {
      adminBooks[idx] = {
        ...adminBooks[idx],
        title,
        author,
        category: cat,
        pages,
        rating,
        description: desc,
        featured,
        cover,
      };
      aSet(AK.BOOKS, adminBooks);
      logAdminActivity('edited', title);
      adminShowToast(`✓ "${title}" updated.`, "success");
    }
  } else {
    /* Pick up any structure saved via the content editor before this form submit */
    const pendingStructure = window._pendingBookStructure || {};
    window._pendingBookStructure = null;

    adminBooks.unshift({
      id: "b_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      title,
      author,
      category: cat,
      pages,
      rating,
      description: desc,
      featured,
      cover,
      frontMatter: pendingStructure.frontMatter || [],
      chapters:    pendingStructure.chapters    || [],
      backMatter:  pendingStructure.backMatter  || [],
      uploadedBy: adminUser.email,
      uploadedAt: new Date().toISOString(),
      views: 0,
    });
    aSet(AK.BOOKS, adminBooks);
    logAdminActivity('added', title);
    adminShowToast(`✓ "${title}" added to library!`, "success");
  }

  closeAdminBookModal();
  renderAdminBooks();
  if (document.getElementById("section-adm-home").classList.contains("active"))
    renderAdminHome();
}

/* ─────────────────────────────────────────────────────────────
   UNIVERSAL DELETE CONFIRMATION
   ───────────────────────────────────────────────────────────── */
function confirmAdminDelete(type, id) {
  adminDeleteTarget = { type, id };
  let name = "";
  if (type === "user") {
    const u = adminAccounts.find((a) => a.id === id);
    if (u && u.id === adminUser.id) {
      adminShowToast("⚠️ You cannot delete your own account.", "error");
      return;
    }
    name = u ? `${u.firstName} ${u.lastName}` : id;
  } else if (type === "book") {
    const b = adminBooks.find((x) => x.id === id);
    name = b ? `"${b.title}"` : id;
  }
  document.getElementById("adm-delete-target-name").textContent = name;
  document.getElementById("adm-delete-type-label").textContent =
    type === "user" ? "user account" : "book";
  document.getElementById("adm-delete-modal").classList.add("open");
}

function cancelAdminDelete() {
  adminDeleteTarget = null;
  document.getElementById("adm-delete-modal").classList.remove("open");
}

function executeAdminDelete() {
  if (!adminDeleteTarget) return;
  const { type, id } = adminDeleteTarget;

  if (type === "user") {
    adminAccounts = adminAccounts.filter((a) => a.id !== id);
    aSet(AK.ACCOUNTS, adminAccounts);
    adminShowToast("User deleted permanently.", "error");
    renderUsersTable();
  } else if (type === "book") {
    const book = adminBooks.find((b) => b.id === id);
    adminBooks = adminBooks.filter((b) => b.id !== id);
    aSet(AK.BOOKS, adminBooks);
    if (book) logAdminActivity('deleted', book.title);
    adminShowToast("Book deleted from library.", "error");
    renderAdminBooks();
  }

  cancelAdminDelete();
  if (document.getElementById("section-adm-home").classList.contains("active"))
    renderAdminHome();
}

/* ─────────────────────────────────────────────────────────────
   SECTION: SYSTEM SETTINGS
   ───────────────────────────────────────────────────────────── */
function renderSystemStats() {
  refreshAdminData();
  const allFavs = aGet(AK.FAVORITES, {});
  const allProgs = aGet(AK.PROGRESS, {});
  const totalFavs = Object.values(allFavs).reduce(
    (s, arr) => s + arr.length,
    0,
  );
  const totalProgs = Object.values(allProgs).reduce(
    (s, obj) => s + Object.keys(obj).length,
    0,
  );

  document.getElementById("sys-total-accounts").textContent =
    adminAccounts.length;
  document.getElementById("sys-total-books").textContent = adminBooks.length;
  document.getElementById("sys-total-cats").textContent = adminCats.length;
  document.getElementById("sys-total-favs").textContent = totalFavs;
  document.getElementById("sys-total-progress").textContent = totalProgs;

  const raw = JSON.stringify({
    accounts: adminAccounts,
    books: adminBooks,
    categories: adminCats,
    favorites: allFavs,
    progress: allProgs,
  });
  document.getElementById("sys-storage-size").textContent =
    (new Blob([raw]).size / 1024).toFixed(1) + " KB";
}

function clearAllReadingData() {
  if (!confirm("Clear all reading progress data? This cannot be undone."))
    return;
  localStorage.removeItem(AK.PROGRESS);
  adminShowToast("All reading progress cleared.", "error");
  renderSystemStats();
}

function clearAllFavoritesData() {
  if (!confirm("Clear all favorites data? This cannot be undone.")) return;
  localStorage.removeItem(AK.FAVORITES);
  adminShowToast("All favorites cleared.", "error");
  renderSystemStats();
}

function exportData() {
  refreshAdminData();
  const data = {
    exportedAt: new Date().toISOString(),
    accounts: adminAccounts.map(({ password: _pw, ...rest }) => rest), // strip passwords
    books: adminBooks,
    categories: adminCats,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `liverary-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  adminShowToast("✓ Data exported as JSON.", "success");
}

function resetToDefaults() {
  if (
    !confirm(
      "⚠️ This will DELETE all custom data and restore factory defaults. Are you sure?",
    )
  )
    return;
  [AK.ACCOUNTS, AK.BOOKS, AK.CATEGORIES, AK.FAVORITES, AK.PROGRESS].forEach(
    (k) => localStorage.removeItem(k),
  );
  adminShowToast("System reset. Reloading…", "error");
  setTimeout(() => window.location.reload(), 1500);
}

/* ─────────────────────────────────────────────────────────────
   SECTION: ADMIN PROFILE
   ───────────────────────────────────────────────────────────── */
function renderAdminProfile() {
  if (!adminUser) return;
  document.getElementById("adm-profile-avatar").textContent =
    adminUser.avatar || "A";
  document.getElementById("adm-profile-name").textContent =
    `${adminUser.firstName} ${adminUser.lastName}`;
  document.getElementById("adm-profile-email").textContent = adminUser.email;
  document.getElementById("adm-profile-joined").textContent = adminFmtDate(
    adminUser.createdAt || new Date().toISOString(),
  );
  document.getElementById("adm-edit-first").value = adminUser.firstName;
  document.getElementById("adm-edit-last").value = adminUser.lastName;
  document.getElementById("adm-edit-email").value = adminUser.email;
}

function saveAdminProfile() {
  const first = document.getElementById("adm-edit-first").value.trim();
  const last = document.getElementById("adm-edit-last").value.trim();
  const email = document.getElementById("adm-edit-email").value.trim();
  if (!first || !last || !email) {
    adminShowToast("⚠️ All fields required.", "error");
    return;
  }

  const idx = adminAccounts.findIndex((a) => a.id === adminUser.id);
  if (idx !== -1) {
    adminAccounts[idx] = {
      ...adminAccounts[idx],
      firstName: first,
      lastName: last,
      email,
      avatar: (first[0] + (last[0] || "")).toUpperCase(),
    };
    aSet(AK.ACCOUNTS, adminAccounts);
    adminUser = { ...adminUser, ...adminAccounts[idx] };
    aSet(AK.SESSION, adminUser);
  }
  populateAdminUI();
  renderAdminProfile();
  adminShowToast("✓ Profile saved!", "success");
}

/* ─────────────────────────────────────────────────────────────
   NAVIGATION
   ───────────────────────────────────────────────────────────── */
function adminSwitch(id, updateNav = true) {
  document
    .querySelectorAll(".page-section")
    .forEach((s) => s.classList.remove("active"));
  const target = document.getElementById("section-" + id);
  if (target) target.classList.add("active");

  if (updateNav) {
    document
      .querySelectorAll(".sidebar-nav a")
      .forEach((a) => a.classList.toggle("active", a.dataset.section === id));
  }

  const titles = {
    "adm-home": ["Analytics Overview", "System-wide statistics & activity"],
    "adm-users": ["Manage Users", "All members, librarians & admins"],
    "adm-books": ["Manage Books", "Full library book control"],
    "adm-settings": ["System Settings", "Data management & configuration"],
    "adm-profile": ["My Profile", "Admin account details"],
  };
  const [title, sub] = titles[id] || ["Admin", ""];
  document.getElementById("topbar-title").textContent = title;
  document.getElementById("topbar-subtitle").textContent = sub;

  switch (id) {
    case "adm-home":
      renderAdminHome();
      break;
    case "adm-users":
      renderUsersTable();
      buildAdmCatSelect();
      break;
    case "adm-books":
      renderAdminBooks();
      buildAdmCatSelect();
      break;
    case "adm-settings":
      renderSystemStats();
      break;
    case "adm-profile":
      renderAdminProfile();
      break;
  }
  closeMobileAdminSidebar();
}

/* ─────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────── */
function buildAdmCatSelect() {
  adminCats = aGet(AK.CATEGORIES, []);
  ["adm-books-cat", "adm-bform-category"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const isFilter = id.includes("cat") && !id.includes("form");
    el.innerHTML =
      (isFilter ? '<option value="all">All Categories</option>' : "") +
      adminCats.map((c) => `<option value="${c}">${c}</option>`).join("");
  });
}

function roleBadgeHTML(role) {
  const map = {
    admin: {
      bg: "rgba(67,48,42,0.12)",
      color: "var(--brown-dark)",
      label: "Admin",
    },
    librarian: {
      bg: "rgba(101,90,0,0.12)",
      color: "var(--olive)",
      label: "Librarian",
    },
    member: {
      bg: "rgba(196,150,44,0.12)",
      color: "var(--brown-mid)",
      label: "Member",
    },
  };
  const s = map[role] || { bg: "rgba(0,0,0,0.06)", color: "#666", label: role };
  return `<span style="font-size:0.72rem; font-weight:700; padding:3px 10px; border-radius:20px;
                        background:${s.bg}; color:${s.color};">${s.label}</span>`;
}

function statusBadgeHTML(active) {
  return active
    ? `<span style="display:inline-flex; align-items:center; gap:4px; white-space:nowrap;
                    font-size:0.7rem; font-weight:700; padding:3px 10px; border-radius:20px;
                    background:rgba(46,125,82,0.10); color:var(--success);">● Active</span>`
    : `<span style="display:inline-flex; align-items:center; gap:4px; white-space:nowrap;
                    font-size:0.7rem; font-weight:700; padding:3px 10px; border-radius:20px;
                    background:rgba(201,64,64,0.08); color:var(--error);">● Inactive</span>`;
}

function roleGradient(role) {
  const map = {
    admin: "linear-gradient(135deg,#43302a,#c4962c)",
    librarian: "linear-gradient(135deg,#655a00,#c4962c)",
    member: "linear-gradient(135deg,#6f5518,#c4962c)",
  };
  return map[role] || "var(--gold)";
}

function adminFmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/* ─────────────────────────────────────────────────────────────
   MOBILE SIDEBAR
   ───────────────────────────────────────────────────────────── */
function openMobileAdminSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebar-overlay").classList.add("show");
  document.body.style.overflow = "hidden";
}
function closeMobileAdminSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("show");
  document.body.style.overflow = "";
}

/* ─────────────────────────────────────────────────────────────
   TOAST
   ───────────────────────────────────────────────────────────── */
function adminShowToast(msg, type = "") {
  const c = document.getElementById("toast-container");
  const t = document.createElement("div");
  t.className = `toast-item ${type}`;
  t.innerHTML = `<span>${type === "success" ? "✓" : type === "error" ? "✗" : "ℹ️"}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 400);
  }, 3400);
}

/* ─────────────────────────────────────────────────────────────
   INIT
   ───────────────────────────────────────────────────────────── */
function adminInit() {
  adminSeedAll();
  loadAdminData();
  populateAdminUI();
  buildAdmCatSelect();
  adminSwitch("adm-home");
}

document.addEventListener("DOMContentLoaded", adminInit);