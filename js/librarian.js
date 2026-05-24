/* ============================================================
   LIVERARY — librarian.js
   Librarian Dashboard Logic
   Features: Upload Books, Edit Books, Delete Books,
             Manage Categories, Feature Books, View All Books
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   STATE
   ───────────────────────────────────────────────────────────── */
let libUser       = null;   // current librarian session
let libBooks      = [];     // all books in the library
let libCategories = [];     // all categories
let editingBookId = null;   // book ID being edited (null = new)

/* ─────────────────────────────────────────────────────────────
   STORAGE KEYS
   ───────────────────────────────────────────────────────────── */
const LSK = {
  SESSION:    'liverary_session',
  BOOKS:      'liverary_books',
  CATEGORIES: 'liverary_categories',
  ACCOUNTS:   'liverary_accounts',
  ACTIVITY:   'liverary_activity',
};

/* ─────────────────────────────────────────────────────────────
   STORAGE HELPERS
   ───────────────────────────────────────────────────────────── */
function lGet(key, fallback = null) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function lSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); }
  catch (e) { console.error('[Liverary Librarian] Storage error:', e); }
}

/* ─────────────────────────────────────────────────────────────
   ACTIVITY LOG HELPER
   Appends one entry to liverary_activity so the Admin dashboard
   can display it in System Activity.
   ───────────────────────────────────────────────────────────── */
function logLibActivity(action, bookTitle) {
  try {
    const log = lGet(LSK.ACTIVITY, []);
    const who = libUser
      ? `${libUser.firstName} ${libUser.lastName}`
      : 'Librarian';
    log.unshift({
      action,      // 'added' | 'edited' | 'deleted' | 'content-edited'
      bookTitle,
      who,
      role:  'Librarian',
      email: libUser ? libUser.email : '',
      time:  new Date().toISOString(),
    });
    lSet(LSK.ACTIVITY, log.slice(0, 50)); // keep last 50 entries
  } catch (e) {
    console.error('[Liverary] logLibActivity failed:', e);
  }
}

/* ─────────────────────────────────────────────────────────────
   SEED DEFAULT DATA
   ───────────────────────────────────────────────────────────── */
function seedLibData() {
  /* Books — only seed if none exist */
  if (!lGet(LSK.BOOKS)) {
    const books = [
      { id:'b001', title:'Atomic Habits',           author:'James Clear',       category:'Self-Help',  cover:'bc-1', rating:4.9, pages:320, featured:true,  description:'Tiny changes, remarkable results. An easy and proven way to build good habits and break bad ones.', uploadedBy:'librarian@liverary.ph', uploadedAt:'2025-01-10T08:00:00.000Z', views:1240 },
      { id:'b002', title:'Deep Work',               author:'Cal Newport',       category:'Self-Help',  cover:'bc-2', rating:4.7, pages:296, featured:true,  description:'Rules for focused success in a distracted world.', uploadedBy:'librarian@liverary.ph', uploadedAt:'2025-01-12T09:00:00.000Z', views:980  },
      { id:'b003', title:'Thinking, Fast and Slow', author:'Daniel Kahneman',  category:'Psychology', cover:'bc-3', rating:4.8, pages:499, featured:false, description:'Explores the two systems that drive the way we think.', uploadedBy:'librarian@liverary.ph', uploadedAt:'2025-01-15T10:30:00.000Z', views:760  },
      { id:'b004', title:'The Psychology of Money', author:'Morgan Housel',    category:'Business',   cover:'bc-4', rating:4.9, pages:256, featured:true,  description:'Timeless lessons on wealth, greed, and happiness.', uploadedBy:'librarian@liverary.ph', uploadedAt:'2025-01-18T11:00:00.000Z', views:1100 },
      { id:'b005', title:'Sapiens',                 author:'Yuval Noah Harari',category:'History',    cover:'bc-5', rating:4.8, pages:443, featured:true,  description:'A brief history of humankind from the Stone Age to the Silicon Age.', uploadedBy:'librarian@liverary.ph', uploadedAt:'2025-01-20T08:30:00.000Z', views:1380 },
      { id:'b006', title:'Zero to One',             author:'Peter Thiel',      category:'Business',   cover:'bc-6', rating:4.6, pages:224, featured:false, description:'Notes on startups, or how to build the future.', uploadedBy:'librarian@liverary.ph', uploadedAt:'2025-02-01T09:00:00.000Z', views:620  },
      { id:'b007', title:'The Subtle Art',          author:'Mark Manson',      category:'Self-Help',  cover:'bc-7', rating:4.5, pages:224, featured:false, description:'A counterintuitive approach to living a good life.', uploadedBy:'librarian@liverary.ph', uploadedAt:'2025-02-05T10:00:00.000Z', views:540  },
      { id:'b008', title:'Educated',                author:'Tara Westover',    category:'Biography',  cover:'bc-8', rating:4.9, pages:334, featured:true,  description:'A memoir about a young girl who grows up with a survivalist family.', uploadedBy:'librarian@liverary.ph', uploadedAt:'2025-02-10T11:00:00.000Z', views:890  },
      { id:'b009', title:'Dune',                    author:'Frank Herbert',    category:'Fiction',    cover:'bc-1', rating:4.7, pages:688, featured:false, description:'Set in a distant future on the desert planet of Arrakis.', uploadedBy:'librarian@liverary.ph', uploadedAt:'2025-02-15T08:00:00.000Z', views:430  },
      { id:'b010', title:'1984',                    author:'George Orwell',    category:'Fiction',    cover:'bc-2', rating:4.8, pages:328, featured:false, description:'A dystopian novel about totalitarianism and surveillance.', uploadedBy:'librarian@liverary.ph', uploadedAt:'2025-02-18T09:30:00.000Z', views:720  },
      { id:'b011', title:'The Lean Startup',        author:'Eric Ries',        category:'Business',   cover:'bc-3', rating:4.4, pages:336, featured:false, description:'How constant innovation creates radically successful businesses.', uploadedBy:'librarian@liverary.ph', uploadedAt:'2025-03-01T10:00:00.000Z', views:380  },
      { id:'b012', title:'Ikigai',                  author:'Héctor García',    category:'Self-Help',  cover:'bc-4', rating:4.6, pages:208, featured:false, description:'The Japanese secret to a long and happy life.', uploadedBy:'librarian@liverary.ph', uploadedAt:'2025-03-05T08:00:00.000Z', views:490  },
      { id:'b013', title:'A Brief History of Time', author:'Stephen Hawking',  category:'Science',    cover:'bc-5', rating:4.7, pages:212, featured:false, description:"Hawking's landmark volume on the nature of space and time.", uploadedBy:'librarian@liverary.ph', uploadedAt:'2025-03-10T09:00:00.000Z', views:560  },
      { id:'b014', title:'The Alchemist',           author:'Paulo Coelho',     category:'Fiction',    cover:'bc-6', rating:4.6, pages:197, featured:true,  description:'A magical story about following your dream.', uploadedBy:'librarian@liverary.ph', uploadedAt:'2025-03-12T11:00:00.000Z', views:940  },
      { id:'b015', title:'Meditations',             author:'Marcus Aurelius',  category:'Philosophy', cover:'bc-7', rating:4.8, pages:256, featured:false, description:"The private thoughts of a Roman emperor.", uploadedBy:'librarian@liverary.ph', uploadedAt:'2025-03-15T10:30:00.000Z', views:670  },
      { id:'b016', title:'The Art of War',          author:'Sun Tzu',          category:'Philosophy', cover:'bc-8', rating:4.5, pages:160, featured:false, description:'Ancient Chinese military treatise on strategy.', uploadedBy:'librarian@liverary.ph', uploadedAt:'2025-03-18T08:00:00.000Z', views:410  },
    ];
    lSet(LSK.BOOKS, books);
  }

  /* Categories */
  if (!lGet(LSK.CATEGORIES)) {
    lSet(LSK.CATEGORIES, [
      'Fiction','Science','History','Self-Help',
      'Technology','Drama','Travel','Psychology',
      'Biography','Philosophy','Business','Art',
    ]);
  }
}

/* ─────────────────────────────────────────────────────────────
   LOAD SESSION & DATA
   ───────────────────────────────────────────────────────────── */
function loadLibData() {
  const session = lGet(LSK.SESSION);
  if (!session || session.role !== 'librarian') {
    window.location.href = 'login.html';
    return;
  }
  libUser       = session;
  libBooks      = lGet(LSK.BOOKS, []);
  libCategories = lGet(LSK.CATEGORIES, []);
}

function refreshLibBooks() {
  libBooks = lGet(LSK.BOOKS, []);
}

/* ─────────────────────────────────────────────────────────────
   POPULATE USER UI
   ───────────────────────────────────────────────────────────── */
function populateLibUI() {
  if (!libUser) return;
  const full = `${libUser.firstName} ${libUser.lastName}`;
  document.querySelectorAll('[data-lib-name]').forEach(el   => el.textContent = full);
  document.querySelectorAll('[data-lib-email]').forEach(el  => el.textContent = libUser.email);
  document.querySelectorAll('[data-lib-avatar]').forEach(el => el.textContent = libUser.avatar || 'L');
  document.querySelectorAll('[data-lib-first]').forEach(el  => el.textContent = libUser.firstName);
}

/* ─────────────────────────────────────────────────────────────
   SECTION: OVERVIEW / HOME
   ───────────────────────────────────────────────────────────── */
function renderLibHome() {
  refreshLibBooks();

  const myBooks    = libBooks.filter(b => b.uploadedBy === libUser.email);
  const featured   = libBooks.filter(b => b.featured);
  const totalViews = libBooks.reduce((sum, b) => sum + (b.views || 0), 0);

  document.getElementById('lib-stat-total').textContent    = libBooks.length;
  document.getElementById('lib-stat-mine').textContent     = myBooks.length;
  document.getElementById('lib-stat-featured').textContent = featured.length;
  document.getElementById('lib-stat-views').textContent    = totalViews.toLocaleString();

  // Recent uploads (last 6 books sorted by uploadedAt desc)
  const recent = [...libBooks]
    .sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''))
    .slice(0, 6);

  const recentGrid = document.getElementById('lib-recent-grid');
  recentGrid.innerHTML = recent.map(b => libBookRowHTML(b)).join('');
  

  // Category breakdown chart (simple bar)
  renderCategoryBreakdown();

  // Top viewed books
  renderTopViewed();
}

function renderCategoryBreakdown() {
  const wrap = document.getElementById('category-breakdown');
  if (!wrap) return;

  const counts = {};
  libBooks.forEach(b => { counts[b.category] = (counts[b.category] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max    = sorted[0]?.[1] || 1;

  wrap.innerHTML = sorted.map(([cat, count]) => `
    <div style="margin-bottom:14px;">
      <div style="display:flex; justify-content:space-between; font-size:0.78rem;
                  font-weight:500; color:var(--text-dark); margin-bottom:5px;">
        <span>${cat}</span>
        <span style="color:var(--gold); font-weight:600;">${count} books</span>
      </div>
      <div style="height:8px; background:rgba(67,48,42,0.08); border-radius:4px; overflow:hidden;">
        <div style="height:100%; width:${(count/max)*100}%; border-radius:4px;
                    background:linear-gradient(90deg, var(--gold), var(--brown-mid));
                    transition:width 0.8s ease;"></div>
      </div>
    </div>`).join('');
}

function renderTopViewed() {
  const wrap = document.getElementById('top-viewed-list');
  if (!wrap) return;

  const top = [...libBooks].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  wrap.innerHTML = top.map((b, i) => `
    <div style="display:flex; align-items:center; gap:12px; padding:10px 0;
                border-bottom:1px solid rgba(67,48,42,0.06);">
      <div style="width:28px; height:28px; border-radius:50%; flex-shrink:0;
                  background:${i===0?'linear-gradient(135deg,var(--gold),var(--brown-mid))':
                               i===1?'rgba(196,150,44,0.20)':'rgba(67,48,42,0.08)'};
                  display:flex; align-items:center; justify-content:center;
                  font-size:0.72rem; font-weight:700;
                  color:${i===0?'white':'var(--text-muted)'};">
        ${i + 1}
      </div>
      <div style="flex:1; min-width:0;">
        <div style="font-size:0.83rem; font-weight:600; color:var(--brown-dark);
                    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${b.title}</div>
        <div style="font-size:0.7rem; color:var(--text-muted);">${b.author}</div>
      </div>
      <div style="font-size:0.78rem; font-weight:600; color:var(--gold); flex-shrink:0;">
        ${(b.views || 0).toLocaleString()} views
      </div>
    </div>`).join('');
}

/* ─────────────────────────────────────────────────────────────
   SECTION: MANAGE BOOKS
   ───────────────────────────────────────────────────────────── */
function renderManageBooks(search = '', category = 'all', filter = 'all') {
  refreshLibBooks();
  let books = [...libBooks];

  /* Search */
  if (search.trim()) {
    const q = search.toLowerCase();
    books = books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  }

  /* Category filter */
  if (category !== 'all') books = books.filter(b => b.category === category);

  /* Featured/mine filter */
  if (filter === 'featured') books = books.filter(b => b.featured);
  if (filter === 'mine')     books = books.filter(b => b.uploadedBy === libUser.email);

  /* Sort newest first */
  books.sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));

  document.getElementById('manage-books-count').textContent = `${books.length} book${books.length !== 1 ? 's' : ''}`;

  const tbody = document.getElementById('books-table-body');
  if (books.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:48px 24px; color:var(--text-muted); font-size:0.88rem;">
          <div style="font-size:2.5rem; margin-bottom:10px;">📭</div>
          No books match your search. Try different filters or upload a new book.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = books.map(b => `
    <tr class="table-row" id="row-${b.id}">
      <td>
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="book-cover-thumb ${b.cover}"
               style="width:36px; height:48px; border-radius:4px 8px 8px 4px; flex-shrink:0;"></div>
          <div>
            <div style="font-size:0.85rem; font-weight:600; color:var(--brown-dark);
                        max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${b.title}
            </div>
            <div style="font-size:0.7rem; color:var(--text-muted);">${b.author}</div>
          </div>
        </div>
      </td>
      <td><span class="chip">${b.category}</span></td>
      <td style="font-size:0.82rem; color:var(--gold); font-weight:600;">★ ${b.rating}</td>
      <td style="font-size:0.78rem; color:var(--text-muted);">${b.pages} pp.</td>
      <td style="font-size:0.78rem; color:var(--text-muted);">${formatLibDate(b.uploadedAt)}</td>
      <td>
        <span style="display:inline-flex; align-items:center; gap:5px; font-size:0.72rem; font-weight:600;
                     padding:3px 10px; border-radius:20px; cursor:pointer;
                     background:${b.featured ? 'rgba(196,150,44,0.15)' : 'rgba(67,48,42,0.07)'};
                     color:${b.featured ? 'var(--brown-mid)' : 'var(--text-muted)'};
                     border:1px solid ${b.featured ? 'rgba(196,150,44,0.3)' : 'transparent'};"
              onclick="toggleFeatured('${b.id}')">
          ${b.featured ? '⭐ Featured' : '☆ Set Featured'}
        </span>
      </td>
      <td>
        <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
            <button class="btn btn-outline btn-sm"
              onclick="openEditModal('${b.id}')"><i data-lucide="pencil"></i><span>Details</span>
            </button>
            
            <button class="btn btn-sm" style="background:rgba(196,150,44,0.12); color:var(--brown-mid);
                    border:1px solid rgba(196,150,44,0.25);"
                    onclick="openLibBookContentEditor('${b.id}')">
              <i data-lucide="book-open"></i><span>Content</span>
            </button>

            <button class="btn btn-danger btn-sm"
              onclick="confirmDelete('${b.id}')">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
      </td>
    </tr>`).join('');

    lucide.createIcons();
}

/* ─────────────────────────────────────────────────────────────
   TOGGLE FEATURED
   ───────────────────────────────────────────────────────────── */
function toggleFeatured(bookId) {
  const idx = libBooks.findIndex(b => b.id === bookId);
  if (idx === -1) return;
  libBooks[idx].featured = !libBooks[idx].featured;
  lSet(LSK.BOOKS, libBooks);
  const label = libBooks[idx].featured ? 'featured ⭐' : 'unfeatured';
  showLibToast(`"${libBooks[idx].title}" is now ${label}.`, libBooks[idx].featured ? 'success' : '');
  renderManageBooks(
    document.getElementById('manage-search')?.value || '',
    document.getElementById('manage-cat-filter')?.value || 'all',
    document.getElementById('manage-status-filter')?.value || 'all'
  );
  if (document.getElementById('section-lib-home').classList.contains('active')) renderLibHome();
}

/* ─────────────────────────────────────────────────────────────
   DELETE BOOK
   ───────────────────────────────────────────────────────────── */
let pendingDeleteId = null;

function confirmDelete(bookId) {
  const book = libBooks.find(b => b.id === bookId);
  if (!book) return;
  pendingDeleteId = bookId;
  document.getElementById('delete-book-title').textContent = `"${book.title}"`;
  document.getElementById('delete-modal').classList.add('open');
}

function cancelDelete() {
  pendingDeleteId = null;
  document.getElementById('delete-modal').classList.remove('open');
}

function executeDelete() {
  if (!pendingDeleteId) return;
  const book = libBooks.find(b => b.id === pendingDeleteId);
  libBooks = libBooks.filter(b => b.id !== pendingDeleteId);
  lSet(LSK.BOOKS, libBooks);
  if (book) logLibActivity('deleted', book.title);
  showLibToast(`"${book?.title}" has been deleted.`, 'error');
  cancelDelete();
  renderManageBooks();
  if (document.getElementById('section-lib-home').classList.contains('active')) renderLibHome();
}

/* ─────────────────────────────────────────────────────────────
   ADD / EDIT BOOK MODAL
   ───────────────────────────────────────────────────────────── */

/* Cover colour options */
const COVERS = ['bc-1','bc-2','bc-3','bc-4','bc-5','bc-6','bc-7','bc-8'];

function openAddModal() {
  editingBookId = null;
  resetBookForm();
  document.getElementById('book-modal-title').innerHTML = '<i data-lucide="upload"></i> Upload New Book';
  document.getElementById('book-modal-submit-btn').innerHTML = '<i data-lucide="upload"></i> Upload Book';
  document.getElementById('book-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
  
}

function openEditModal(bookId) {
  const book = libBooks.find(b => b.id === bookId);
  if (!book) return;
  editingBookId = bookId;
  populateBookForm(book);
  document.getElementById('book-modal-title').innerHTML = '<i data-lucide="pencil"></i> Edit Book';
  document.getElementById('book-modal-submit-btn').innerHTML = '<i data-lucide="save"></i> Save Changes';
  document.getElementById('book-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
}

/* ── Open the full Book Structure Editor for a book ── */
function openLibBookContentEditor(bookId) {
  refreshLibBooks();
  const b = libBooks.find(x => x.id === bookId);
  if (!b) return;

  openBookEditor(bookId, beEnsureBookStructure({ ...b }), (id, structure) => {
    refreshLibBooks();
    const idx = libBooks.findIndex(x => x.id === id);
    if (idx !== -1) {
      libBooks[idx] = { ...libBooks[idx], ...structure };
      lSet(LSK.BOOKS, libBooks);
      logLibActivity('content-edited', libBooks[idx].title);
      showLibToast(`✓ Book content saved for "${libBooks[idx].title}".`, 'success');
    }
    renderManageBooks();
  });
}

function closeBookModal() {
  editingBookId = null;
  document.getElementById('book-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function resetBookForm() {
  document.getElementById('form-book-title').value       = '';
  document.getElementById('form-book-author').value      = '';
  document.getElementById('form-book-category').value    = libCategories[0] || '';
  document.getElementById('form-book-pages').value       = '';
  document.getElementById('form-book-rating').value      = '4.5';
  document.getElementById('form-book-description').value = '';
  document.getElementById('form-book-featured').checked  = false;
  selectCoverColor('bc-1');
}

function populateBookForm(book) {
  document.getElementById('form-book-title').value       = book.title;
  document.getElementById('form-book-author').value      = book.author;
  document.getElementById('form-book-category').value    = book.category;
  document.getElementById('form-book-pages').value       = book.pages;
  document.getElementById('form-book-rating').value      = book.rating;
  document.getElementById('form-book-description').value = book.description || '';
  document.getElementById('form-book-featured').checked  = !!book.featured;
  selectCoverColor(book.cover || 'bc-1');
}

function selectCoverColor(cover) {
  document.querySelectorAll('.cover-swatch').forEach(el => {
    el.classList.toggle('selected', el.dataset.cover === cover);
  });
  document.getElementById('selected-cover').value = cover;
  // Live preview
  const preview = document.getElementById('cover-preview-box');
  if (preview) {
    preview.className = 'cover-preview-box ' + cover;
  }
}

function handleBookFormSubmit(e) {
  e.preventDefault();

  const title       = document.getElementById('form-book-title').value.trim();
  const author      = document.getElementById('form-book-author').value.trim();
  const category    = document.getElementById('form-book-category').value;
  const pages       = parseInt(document.getElementById('form-book-pages').value, 10);
  const rating      = parseFloat(document.getElementById('form-book-rating').value);
  const description = document.getElementById('form-book-description').value.trim();
  const featured    = document.getElementById('form-book-featured').checked;
  const cover       = document.getElementById('selected-cover').value || 'bc-1';

  /* Validation */
  if (!title)              { showLibToast('⚠️ Title is required.', 'error');            return; }
  if (!author)             { showLibToast('⚠️ Author is required.', 'error');           return; }
  if (!category)           { showLibToast('⚠️ Category is required.', 'error');        return; }
  if (!pages || pages < 1) { showLibToast('⚠️ Enter a valid page count.', 'error');    return; }
  if (isNaN(rating) || rating < 1 || rating > 5) { showLibToast('⚠️ Rating must be 1–5.', 'error'); return; }

  refreshLibBooks();

  if (editingBookId) {
    /* Update existing */
    const idx = libBooks.findIndex(b => b.id === editingBookId);
    if (idx !== -1) {
      libBooks[idx] = { ...libBooks[idx], title, author, category, pages, rating, description, featured, cover };
      lSet(LSK.BOOKS, libBooks);
      logLibActivity('edited', title);
      showLibToast(`"${title}" updated successfully!`, 'success');
    }
  } else {
    /* New book */
    const pendingStructure = window._pendingBookStructure || {};
    window._pendingBookStructure = null;

    const newBook = {
      id:          'b_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
      title, author, category, pages, rating, description, featured, cover,
      frontMatter: pendingStructure.frontMatter || [],
      chapters:    pendingStructure.chapters    || [],
      backMatter:  pendingStructure.backMatter  || [],
      uploadedBy:  libUser.email,
      uploadedAt:  new Date().toISOString(),
      views:       0,
    };
    libBooks.unshift(newBook);
    lSet(LSK.BOOKS, libBooks);
    logLibActivity('added', title);
    showLibToast(`"${title}" uploaded successfully!`, 'success');
  }

  closeBookModal();
  renderManageBooks();
  if (document.getElementById('section-lib-home').classList.contains('active')) renderLibHome();
}

/* ─────────────────────────────────────────────────────────────
   SECTION: MANAGE CATEGORIES
   ───────────────────────────────────────────────────────────── */
function renderCategories() {
  libCategories = lGet(LSK.CATEGORIES, []);
  const grid = document.getElementById('categories-grid');

  if (libCategories.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:32px; color:var(--text-muted);">No categories yet.</div>`;
    return;
  }

  grid.innerHTML = libCategories.map((cat, idx) => {
    const count = libBooks.filter(b => b.category === cat).length;
    return `
      <div class="cat-manage-card" id="cat-card-${idx}">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:38px; height:38px;
                        background:rgba(196,150,44,0.12);
                        border-radius:8px;

                        display:flex;
                        align-items:center;
                        justify-content:center;

                        flex-shrink:0;">

              <i data-lucide="${getCatIcon(cat)}"></i>

            </div>
            <div>
              <div style="font-size:0.88rem; font-weight:600; color:var(--brown-dark);">${cat}</div>
              <div style="font-size:0.72rem; color:var(--text-muted);">${count} book${count !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-outline btn-sm" onclick="startEditCategory(${idx}, '${cat}')"><i data-lucide="pencil"></i></button>
            <button class="btn btn-danger  btn-sm" onclick="deleteCategory(${idx})"
                    ${count > 0 ? 'title="Move books to another category first" style="opacity:0.45; pointer-events:none;"' : ''}>
              <i data-lucide="trash2"></i>
            </button>
          </div>
        </div>
      </div>`;
  }).join('');

  lucide.createIcons();

  // Update form select
  buildCategorySelects();
}

function getCatIcon(cat) {
  const map = {
    Fiction: 'book-open-text',
    Science: 'microscope',
    History: 'landmark',
    'Self-Help': 'lightbulb',

    Technology: 'monitor-smartphone',
    Drama: 'drama',
    Travel: 'earth',
    Psychology: 'brain',

    Biography: 'pen-tool',
    Philosophy: 'brain-circuit',
    Business: 'briefcase-business',
    Art: 'palette',
  };

  return map[cat] || 'library';
}

function buildCategorySelects() {
  const selects = ['form-book-category','manage-cat-filter'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const isFilter = id.includes('filter');
    el.innerHTML = (isFilter ? '<option value="all">All Categories</option>' : '') +
      libCategories.map(c => `<option value="${c}">${c}</option>`).join('');
  });
}

function addCategory() {
  const input = document.getElementById('new-cat-input');
  const name  = input.value.trim();
  if (!name) { showLibToast('⚠️ Category name cannot be empty.', 'error'); return; }
  if (libCategories.map(c => c.toLowerCase()).includes(name.toLowerCase())) {
    showLibToast('⚠️ This category already exists.', 'error'); return;
  }
  libCategories.push(name);
  lSet(LSK.CATEGORIES, libCategories);
  input.value = '';
  renderCategories();
  showLibToast(`Category "${name}" added!`, 'success');
}

let editingCatIdx = null;

function startEditCategory(idx, current) {
  editingCatIdx = idx;
  document.getElementById('edit-cat-input').value = current;
  document.getElementById('edit-cat-wrap').style.display = 'flex';
  document.getElementById('edit-cat-input').focus();
}

function saveEditCategory() {
  if (editingCatIdx === null) return;
  const newName = document.getElementById('edit-cat-input').value.trim();
  const oldName = libCategories[editingCatIdx];
  if (!newName) { showLibToast('⚠️ Category name cannot be empty.', 'error'); return; }

  // Update books with old category
  refreshLibBooks();
  libBooks.forEach(b => { if (b.category === oldName) b.category = newName; });
  lSet(LSK.BOOKS, libBooks);

  libCategories[editingCatIdx] = newName;
  lSet(LSK.CATEGORIES, libCategories);

  document.getElementById('edit-cat-wrap').style.display = 'none';
  editingCatIdx = null;
  renderCategories();
  showLibToast(`Category renamed to "${newName}".`, 'success');
}

function cancelEditCategory() {
  editingCatIdx = null;
  document.getElementById('edit-cat-wrap').style.display = 'none';
}

function deleteCategory(idx) {
  const name  = libCategories[idx];
  const count = libBooks.filter(b => b.category === name).length;
  if (count > 0) { showLibToast(`⚠️ Move all ${count} books from "${name}" first.`, 'error'); return; }
  libCategories.splice(idx, 1);
  lSet(LSK.CATEGORIES, libCategories);
  renderCategories();
  showLibToast(`"${name}" deleted.`, '');
}

/* ─────────────────────────────────────────────────────────────
   BOOK LIST ROW (home overview)
   ───────────────────────────────────────────────────────────── */
function libBookRowHTML(book) {
  return `
    <div style="display:flex; align-items:center; gap:12px; padding:11px 0;
                border-bottom:1px solid rgba(67,48,42,0.06);">
      <div class="${book.cover}" style="width:32px; height:44px; border-radius:4px 7px 7px 4px; flex-shrink:0;"></div>
      <div style="flex:1; min-width:0;">
        <div style="font-size:0.83rem; font-weight:600; color:var(--brown-dark);
                    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${book.title}</div>
        <div style="font-size:0.7rem; color:var(--text-muted);">${book.author} · ${book.category}</div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:3px; flex-shrink:0;">
        ${book.featured ? '<span style="font-size:0.62rem; background:rgba(196,150,44,0.15); color:var(--brown-mid); padding:2px 7px; border-radius:10px; font-weight:600;">⭐ Featured</span>' : ''}
        <span style="font-size:0.68rem; color:var(--text-muted);">${formatLibDate(book.uploadedAt)}</span>
      </div>
    </div>`;
}

/* ─────────────────────────────────────────────────────────────
   NAVIGATION
   ───────────────────────────────────────────────────────────── */
function libSwitchSection(id, updateNav = true) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('section-' + id);
  if (target) target.classList.add('active');

  if (updateNav) {
    document.querySelectorAll('.sidebar-nav a').forEach(a =>
      a.classList.toggle('active', a.dataset.section === id));
  }

  const titles = {
    'lib-home':    ['Overview',          'Your library at a glance'],
    'lib-books':   ['Manage Books',      'Upload, edit & organise the collection'],
    'lib-categories':['Categories',      'Manage book genres & topics'],
    'lib-profile': ['My Profile',        'Your librarian account'],
  };
  const [title, sub] = titles[id] || ['Dashboard', ''];
  document.getElementById('topbar-title').textContent    = title;
  document.getElementById('topbar-subtitle').textContent = sub;

  switch (id) {
    case 'lib-home':       renderLibHome();      break;
    case 'lib-books':      renderManageBooks();  break;
    case 'lib-categories': renderCategories();   break;
    case 'lib-profile':    renderLibProfile();   break;
  }

  closeMobileLibSidebar();
}

/* ─────────────────────────────────────────────────────────────
   SECTION: PROFILE
   ───────────────────────────────────────────────────────────── */
function renderLibProfile() {
  if (!libUser) return;
  document.getElementById('lib-profile-avatar').textContent   = libUser.avatar || 'L';
  document.getElementById('lib-profile-name').textContent     = `${libUser.firstName} ${libUser.lastName}`;
  document.getElementById('lib-profile-email').textContent    = libUser.email;
  document.getElementById('lib-profile-joined').textContent   = formatLibDate(libUser.createdAt || new Date().toISOString());
  document.getElementById('lib-profile-books').textContent    = libBooks.filter(b => b.uploadedBy === libUser.email).length;
  document.getElementById('lib-profile-featured').textContent = libBooks.filter(b => b.featured).length;

  document.getElementById('lib-edit-first').value = libUser.firstName;
  document.getElementById('lib-edit-last').value  = libUser.lastName;
  document.getElementById('lib-edit-email').value = libUser.email;
}

function saveLibProfile() {
  const first = document.getElementById('lib-edit-first').value.trim();
  const last  = document.getElementById('lib-edit-last').value.trim();
  const email = document.getElementById('lib-edit-email').value.trim();
  if (!first || !last || !email) { showLibToast('⚠️ All fields required.', 'error'); return; }

  const accounts = lGet(LSK.ACCOUNTS, []);
  const idx = accounts.findIndex(a => a.id === libUser.id);
  if (idx !== -1) {
    accounts[idx] = { ...accounts[idx], firstName:first, lastName:last, email,
                      avatar:(first[0]+(last[0]||'')).toUpperCase() };
    lSet(LSK.ACCOUNTS, accounts);
    libUser = { ...libUser, firstName:first, lastName:last, email, avatar:accounts[idx].avatar };
    lSet(LSK.SESSION, libUser);
  }
  populateLibUI();
  renderLibProfile();
  showLibToast('Profile saved!', 'success');
}

/* ─────────────────────────────────────────────────────────────
   MOBILE SIDEBAR
   ───────────────────────────────────────────────────────────── */
function openMobileLibSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeMobileLibSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
  document.body.style.overflow = '';
}

/* ─────────────────────────────────────────────────────────────
   TOAST
   ───────────────────────────────────────────────────────────── */
function showLibToast(msg, type = '') {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast-item ${type}`;
  t.innerHTML = `<span>${type==='success'?'✓':type==='error'?'✗':'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3400);
}

/* ─────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────── */
function formatLibDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }); }
  catch { return iso; }
}

/* ─────────────────────────────────────────────────────────────
   INIT
   ───────────────────────────────────────────────────────────── */
function libInit() {
  seedLibData();
  loadLibData();
  populateLibUI();
  buildCategorySelects();
  libSwitchSection('lib-home');
}

document.addEventListener('DOMContentLoaded', libInit);