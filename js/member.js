/* ============================================================
   LIVERARY — member.js
   Member Dashboard Logic
   Handles: Books, Favorites, Reading Progress, Profile, Settings
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   STATE — holds the active session & working data
   ───────────────────────────────────────────────────────────── */
let currentUser   = null;   // loaded from session on init
let allBooks      = [];     // loaded from localStorage
let favorites     = [];     // user's favourite book IDs
let readingProgress = {};   // { bookId: { page, total, pct, lastRead } }
let currentReadBook = null; // book currently open in reader

/* ─────────────────────────────────────────────────────────────
   STORAGE KEYS (mirrors auth.js constants)
   ───────────────────────────────────────────────────────────── */
const SK = {
  ACCOUNTS:  'liverary_accounts',
  SESSION:   'liverary_session',
  BOOKS:     'liverary_books',
  FAVORITES: 'liverary_favorites',
  PROGRESS:  'liverary_progress',
};

/* ─────────────────────────────────────────────────────────────
   STORAGE HELPERS
   ───────────────────────────────────────────────────────────── */
function get(key, fallback = null) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function set(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.error(e); }
}

/* ─────────────────────────────────────────────────────────────
   SEED BOOKS — provide sample books so the dashboard isn't empty
   ───────────────────────────────────────────────────────────── */
function seedBooks() {
  if (get(SK.BOOKS)) return;
  const books = [
    { id:'b001', title:'Atomic Habits',              author:'James Clear',       category:'Self-Help',   cover:'bc-1', rating:4.9, pages:320, featured:true,  description:'Tiny changes, remarkable results. An easy and proven way to build good habits and break bad ones.' },
    { id:'b002', title:'Deep Work',                  author:'Cal Newport',       category:'Self-Help',   cover:'bc-2', rating:4.7, pages:296, featured:true,  description:'Rules for focused success in a distracted world. Newport argues that deep work is valuable and rare.' },
    { id:'b003', title:'Thinking, Fast and Slow',    author:'Daniel Kahneman',   category:'Psychology',  cover:'bc-3', rating:4.8, pages:499, featured:false, description:'A Nobel Prize winner explores the two systems that drive the way we think — fast, intuitive thinking and slow, deliberate thinking.' },
    { id:'b004', title:'The Psychology of Money',    author:'Morgan Housel',     category:'Business',    cover:'bc-4', rating:4.9, pages:256, featured:true,  description:'Timeless lessons on wealth, greed, and happiness from one of the sharpest financial writers of our time.' },
    { id:'b005', title:'Sapiens',                    author:'Yuval Noah Harari', category:'History',     cover:'bc-5', rating:4.8, pages:443, featured:true,  description:'A brief history of humankind — from the Stone Age to the Silicon Age.' },
    { id:'b006', title:'Zero to One',                author:'Peter Thiel',       category:'Business',    cover:'bc-6', rating:4.6, pages:224, featured:false, description:'Notes on startups, or how to build the future. Contrarian thinking on building companies.' },
    { id:'b007', title:'The Subtle Art',             author:'Mark Manson',       category:'Self-Help',   cover:'bc-7', rating:4.5, pages:224, featured:false, description:"A counterintuitive approach to living a good life. Stop trying to be positive all the time." },
    { id:'b008', title:'Educated',                   author:'Tara Westover',     category:'Biography',   cover:'bc-8', rating:4.9, pages:334, featured:true,  description:'A memoir about a young girl who grows up in rural Idaho with a survivalist family and eventually earns a PhD from Cambridge.' },
    { id:'b009', title:'Dune',                       author:'Frank Herbert',     category:'Fiction',     cover:'bc-1', rating:4.7, pages:688, featured:false, description:'Set in a distant future, it follows the noble House Atreides and the desert planet of Arrakis.' },
    { id:'b010', title:'1984',                       author:'George Orwell',     category:'Fiction',     cover:'bc-2', rating:4.8, pages:328, featured:false, description:"A dystopian novel about totalitarianism, surveillance, and the destruction of truth. One of the most influential books ever written." },
    { id:'b011', title:'The Lean Startup',           author:'Eric Ries',         category:'Business',    cover:'bc-3', rating:4.4, pages:336, featured:false, description:'How constant innovation creates radically successful businesses using validated learning.' },
    { id:'b012', title:'Ikigai',                     author:'Héctor García',     category:'Self-Help',   cover:'bc-4', rating:4.6, pages:208, featured:false, description:'The Japanese secret to a long and happy life — find your purpose and make it your life.' },
    { id:'b013', title:'A Brief History of Time',    author:'Stephen Hawking',   category:'Science',     cover:'bc-5', rating:4.7, pages:212, featured:false, description:"Hawking's landmark volume explores the nature of space and time, the role of God in creation, and the history and future of the universe." },
    { id:'b014', title:'The Alchemist',              author:'Paulo Coelho',      category:'Fiction',     cover:'bc-6', rating:4.6, pages:197, featured:true,  description:'A magical story about following your dream. One of the best-selling novels in history.' },
    { id:'b015', title:'Meditations',                author:'Marcus Aurelius',   category:'Philosophy',  cover:'bc-7', rating:4.8, pages:256, featured:false, description:'The private thoughts of a Roman emperor — a timeless guide to stoic philosophy and self-improvement.' },
    { id:'b016', title:'The Art of War',             author:'Sun Tzu',           category:'Philosophy',  cover:'bc-8', rating:4.5, pages:160, featured:false, description:'Ancient Chinese military treatise that has shaped leaders and strategists for over 2,500 years.' },
  ];
  set(SK.BOOKS, books);
}

/* ─────────────────────────────────────────────────────────────
   LOAD USER DATA
   ───────────────────────────────────────────────────────────── */
function loadUserData() {
  const session = get(SK.SESSION);
  if (!session || session.role !== 'member') {
    window.location.href = 'login.html';
    return;
  }
  currentUser = session;

  // Load books
  allBooks = get(SK.BOOKS, []);

  // Load favorites (per user)
  const allFavs = get(SK.FAVORITES, {});
  favorites = allFavs[currentUser.id] || [];

  // Load reading progress (per user)
  const allProgress = get(SK.PROGRESS, {});
  readingProgress = allProgress[currentUser.id] || {};
}

/* ─────────────────────────────────────────────────────────────
   SAVE HELPERS
   ───────────────────────────────────────────────────────────── */
function saveFavorites() {
  const allFavs = get(SK.FAVORITES, {});
  allFavs[currentUser.id] = favorites;
  set(SK.FAVORITES, allFavs);
}

function saveProgress(bookId, page, total) {
  const pct = total > 0 ? Math.round((page / total) * 100) : 0;
  readingProgress[bookId] = { page, total, pct, lastRead: new Date().toISOString() };
  const allProgress = get(SK.PROGRESS, {});
  allProgress[currentUser.id] = readingProgress;
  set(SK.PROGRESS, allProgress);
}

/* ─────────────────────────────────────────────────────────────
   FAVORITES
   ───────────────────────────────────────────────────────────── */
function toggleFavorite(bookId) {
  const idx = favorites.indexOf(bookId);
  if (idx === -1) {
    favorites.push(bookId);
    showToast('❤️ Added to favorites!', 'success');
  } else {
    favorites.splice(idx, 1);
    showToast('💔 Removed from favorites.', '');
  }
  saveFavorites();
  refreshFavButtons();
  // Re-render favorites section if active
  if (document.getElementById('section-favorites').classList.contains('active')) {
    renderFavoritesSection();
  }
}

function isFavorite(bookId) {
  return favorites.includes(bookId);
}

function refreshFavButtons() {
  document.querySelectorAll('[data-fav-btn]').forEach(btn => {
    const id = btn.dataset.favBtn;
    btn.classList.toggle('active', isFavorite(id));
    btn.textContent = isFavorite(id) ? '❤️' : '🤍';
  });
}

/* ─────────────────────────────────────────────────────────────
   RENDER HELPERS — book card HTML
   ───────────────────────────────────────────────────────────── */
function bookCardHTML(book, showProgress = false) {
  const fav  = isFavorite(book.id);
  const prog = readingProgress[book.id];
  const pct  = prog ? prog.pct : 0;

  const progressHTML = showProgress && prog ? `
    <div class="progress-bar-wrap">
      <div class="progress-label">
        <span>Progress</span><span>${pct}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
    </div>` : '';

  return `
    <div class="book-card" onclick="openBook('${book.id}')">
      <div class="book-cover-area ${book.cover}">
        <button class="btn-fav ${fav ? 'active' : ''}"
                data-fav-btn="${book.id}"
                onclick="event.stopPropagation(); toggleFavorite('${book.id}')"
                aria-label="Toggle favorite">
          ${fav ? '❤️' : '🤍'}
        </button>
        ${book.featured ? '<div class="book-cover-badge">Featured</div>' : ''}
        <div class="book-cover-title-txt">${book.title}</div>
      </div>
      <div class="book-card-body">
        <div class="book-card-title">${book.title}</div>
        <div class="book-card-author">${book.author}</div>
        <div class="book-card-meta">
          <div class="book-card-rating">★ <span>${book.rating}</span></div>
          <div class="book-card-category">${book.category}</div>
        </div>
        ${progressHTML}
      </div>
    </div>`;
}

/* ─────────────────────────────────────────────────────────────
   SECTION: DASHBOARD HOME
   ───────────────────────────────────────────────────────────── */
function renderDashboardHome() {
  // Stats
  const inProgress = Object.keys(readingProgress).filter(id => {
    const p = readingProgress[id];
    return p.pct > 0 && p.pct < 100;
  });
  const completed = Object.keys(readingProgress).filter(id => readingProgress[id].pct >= 100);

  document.getElementById('stat-total-books').textContent   = allBooks.length;
  document.getElementById('stat-favorites').textContent     = favorites.length;
  document.getElementById('stat-in-progress').textContent   = inProgress.length;
  document.getElementById('stat-completed').textContent     = completed.length;

  // Continue Reading (last 4 in-progress)
  const continueBooks = inProgress
    .map(id => allBooks.find(b => b.id === id))
    .filter(Boolean)
    .sort((a, b) => {
      const ta = readingProgress[a.id]?.lastRead || '';
      const tb = readingProgress[b.id]?.lastRead || '';
      return tb.localeCompare(ta);
    })
    .slice(0, 4);

  const continueGrid = document.getElementById('continue-reading-grid');
  if (continueBooks.length === 0) {
    continueGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1; padding:28px 24px;">
        <div class="empty-state-icon">📖</div>
        <div class="empty-state-title">Nothing in progress yet</div>
        <div class="empty-state-msg">Start reading any book and it will appear here.</div>
      </div>`;
  } else {
    continueGrid.innerHTML = continueBooks.map(b => bookCardHTML(b, true)).join('');
  }

  // Featured Books (books with featured:true)
  const featuredGrid = document.getElementById('featured-books-grid');
  const featured = allBooks.filter(b => b.featured).slice(0, 4);
  featuredGrid.innerHTML = featured.map(b => bookCardHTML(b)).join('');

  // Recent activity list
  renderRecentActivity();
}

function renderRecentActivity() {
  const list = document.getElementById('activity-list');
  const activities = [];

  Object.entries(readingProgress).forEach(([id, p]) => {
    const book = allBooks.find(b => b.id === id);
    if (book) {
      activities.push({
        icon:  p.pct >= 100 ? '✅' : '📖',
        text:  p.pct >= 100 ? `Finished <strong>${book.title}</strong>` : `Reading <strong>${book.title}</strong> — ${p.pct}% complete`,
        time:  p.lastRead,
      });
    }
  });

  favorites.forEach(id => {
    const book = allBooks.find(b => b.id === id);
    if (book) {
      activities.push({
        icon: '❤️',
        text: `Added <strong>${book.title}</strong> to favorites`,
        time: new Date().toISOString(),
      });
    }
  });

  activities.sort((a, b) => b.time.localeCompare(a.time));
  const recent = activities.slice(0, 6);

  if (recent.length === 0) {
    list.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted); font-size:0.85rem;">No activity yet — start exploring books!</div>`;
    return;
  }

  list.innerHTML = recent.map(a => `
    <div style="display:flex; align-items:flex-start; gap:12px; padding:12px 0; border-bottom:1px solid rgba(67,48,42,0.06);">
      <div style="width:34px; height:34px; background:rgba(196,150,44,0.10); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0;">
        ${a.icon}
      </div>
      <div>
        <div style="font-size:0.83rem; color:var(--text-dark); line-height:1.5;">${a.text}</div>
        <div style="font-size:0.71rem; color:var(--text-muted); margin-top:2px;">${formatDate(a.time)}</div>
      </div>
    </div>`).join('');
}

/* ─────────────────────────────────────────────────────────────
   SECTION: EXPLORE / ALL BOOKS
   ───────────────────────────────────────────────────────────── */
function renderExploreSection(searchTerm = '', category = 'all', sort = 'default') {
  let books = [...allBooks];

  // Filter by search
  if (searchTerm.trim()) {
    const q = searchTerm.toLowerCase();
    books = books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  }

  // Filter by category
  if (category && category !== 'all') {
    books = books.filter(b => b.category === category);
  }

  // Sort
  if (sort === 'rating')    books.sort((a, b) => b.rating - a.rating);
  if (sort === 'title')     books.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === 'featured')  books = books.filter(b => b.featured).concat(books.filter(b => !b.featured));

  const grid = document.getElementById('explore-books-grid');
  document.getElementById('explore-count').textContent = `${books.length} books found`;

  if (books.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">No books found</div>
        <div class="empty-state-msg">Try a different search term or category filter.</div>
      </div>`;
    return;
  }

  grid.innerHTML = books.map(b => bookCardHTML(b)).join('');
}

function buildCategoryFilter() {
  const cats  = [...new Set(allBooks.map(b => b.category))].sort();
  const select = document.getElementById('explore-category-filter');
  select.innerHTML = `<option value="all">All Categories</option>` +
    cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

/* ─────────────────────────────────────────────────────────────
   SECTION: FAVORITES
   ───────────────────────────────────────────────────────────── */
function renderFavoritesSection() {
  const grid = document.getElementById('favorites-grid');
  const favBooks = favorites.map(id => allBooks.find(b => b.id === id)).filter(Boolean);

  document.getElementById('fav-count').textContent = `${favBooks.length} saved`;

  if (favBooks.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">🤍</div>
        <div class="empty-state-title">No favorites yet</div>
        <div class="empty-state-msg">Tap the heart ❤️ on any book to save it here.</div>
        <button class="btn btn-gold" onclick="switchSection('explore')">Browse Books</button>
      </div>`;
    return;
  }

  grid.innerHTML = favBooks.map(b => bookCardHTML(b)).join('');
}

/* ─────────────────────────────────────────────────────────────
   SECTION: READING PROGRESS / CONTINUE
   ───────────────────────────────────────────────────────────── */
function renderReadingSection() {
  const inProgress = Object.keys(readingProgress)
    .map(id => ({ book: allBooks.find(b => b.id === id), prog: readingProgress[id] }))
    .filter(x => x.book && x.prog.pct < 100)
    .sort((a, b) => b.prog.lastRead.localeCompare(a.prog.lastRead));

  const completed = Object.keys(readingProgress)
    .map(id => ({ book: allBooks.find(b => b.id === id), prog: readingProgress[id] }))
    .filter(x => x.book && x.prog.pct >= 100);

  const grid = document.getElementById('reading-progress-grid');
  document.getElementById('reading-in-progress-count').textContent = inProgress.length;
  document.getElementById('reading-completed-count').textContent   = completed.length;

  if (inProgress.length === 0 && completed.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">📚</div>
        <div class="empty-state-title">Start your reading journey</div>
        <div class="empty-state-msg">Open any book and your progress will be tracked here automatically.</div>
        <button class="btn btn-gold" onclick="switchSection('explore')">Find a Book</button>
      </div>`;
    return;
  }

  const allItems = [...inProgress, ...completed];
  grid.innerHTML = allItems.map(({ book, prog }) => `
    <div class="book-card" onclick="openBook('${book.id}')">
      <div class="book-cover-area ${book.cover}">
        ${prog.pct >= 100 ? '<div class="book-cover-badge" style="background:#2e7d52;">✓ Done</div>' : ''}
        <div class="book-cover-title-txt">${book.title}</div>
      </div>
      <div class="book-card-body">
        <div class="book-card-title">${book.title}</div>
        <div class="book-card-author">${book.author}</div>
        <div class="progress-bar-wrap">
          <div class="progress-label">
            <span>${prog.pct >= 100 ? 'Completed!' : 'Reading...'}</span>
            <span>${prog.pct}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${prog.pct}%"></div>
          </div>
        </div>
        <div style="font-size:0.68rem; color:var(--text-muted); margin-top:6px;">
          Last read: ${formatDate(prog.lastRead)}
        </div>
      </div>
    </div>`).join('');
}

/* ─────────────────────────────────────────────────────────────
   BOOK READER MODAL
   ───────────────────────────────────────────────────────────── */

/*
  The reader builds a flat list of "sections" from the book's structure:
    front matter (enabled only) → chapters → back matter (enabled only)
  Each section is one "page" in the reader. Progress tracks section index.
*/

let _readerSections   = [];  // flat list of { type, label, icon, body }
let _readerSectionIdx = 0;   // current section index

function _buildReaderSections(book) {
  const sections = [];

  /* ── FRONT MATTER ── */
  const front = book.frontMatter || [];
  front.filter(s => s.enabled && s.type !== 'table-of-contents').forEach(s => {
    sections.push({ type: 'front', label: s.title, icon: _secIcon(s.type, 'front'), body: s.body || '' });
  });

  /* ── AUTO TABLE OF CONTENTS ── */
  const hasToc = front.some(s => s.type === 'table-of-contents' && s.enabled !== false);
  if (hasToc && (book.chapters || []).length > 0) {
    const tocBody = (book.chapters || [])
      .map(c => `Chapter ${c.order}: ${c.title}`)
      .join('\n');
    sections.push({ type: 'toc', label: 'Table of Contents', icon: '📑', body: tocBody });
  }

  /* ── CHAPTERS ── */
  (book.chapters || []).sort((a, b) => a.order - b.order).forEach(c => {
    sections.push({ type: 'chapter', label: c.title, chapterNum: c.order, icon: '📖', body: c.body || '' });
  });

  /* ── BACK MATTER ── */
  (book.backMatter || []).filter(s => s.enabled).forEach(s => {
    sections.push({ type: 'back', label: s.title, icon: _secIcon(s.type, 'back'), body: s.body || '' });
  });

  return sections;
}

function _secIcon(type, mat) {
  const map = {
    'copyright':'©','dedication':'💌','epigraph':'✍️','foreword':'📝',
    'preface':'📖','acknowledgments':'🙏','introduction':'🚪','half-title':'📄',
    'epilogue':'🌅','afterword':'📬','appendix':'📎','notes':'🗒️',
    'glossary':'📚','bibliography':'🔖','resources':'🌐','index':'🔍',
    'about-author':'👤',
  };
  return map[type] || (mat === 'front' ? '📄' : '📎');
}

/* ─────────────────────────────────────────────────────────────
   BOOK PREVIEW MODAL
   ───────────────────────────────────────────────────────────── */

let _previewBookId = null; // book ID currently shown in preview

function openBook(bookId) {
  // Entry point from book cards — shows preview first
  const book = allBooks.find(b => b.id === bookId);
  if (!book) return;
  _previewBookId = bookId;

  // Populate preview fields
  document.getElementById('preview-title').textContent       = book.title;
  document.getElementById('preview-author').textContent      = 'by ' + book.author;
  document.getElementById('preview-category').textContent    = book.category;
  document.getElementById('preview-category-chip').textContent = book.category;
  document.getElementById('preview-rating').textContent      = '★ ' + book.rating;
  document.getElementById('preview-pages').textContent       = book.pages + ' pages';
  document.getElementById('preview-description').textContent = book.description || 'No description available.';

  // Cover colour
  const coverBox = document.getElementById('preview-cover-box');
  coverBox.className = '';
  coverBox.style.cssText = 'width:80px; height:108px; border-radius:5px 10px 10px 5px; flex-shrink:0; box-shadow:3px 4px 14px rgba(67,48,42,0.18);';
  coverBox.classList.add(book.cover);

  // Favourite state
  _refreshPreviewFavBtn(bookId);

  document.getElementById('book-preview-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function _refreshPreviewFavBtn(bookId) {
  const fav = isFavorite(bookId);
  document.getElementById('preview-fav-btn').classList.toggle('active', fav);
  document.getElementById('preview-fav-label').textContent = fav ? 'In Favorites' : 'Add to Favorites';
  document.getElementById('preview-fav-btn').innerHTML =
    (fav ? '❤️' : '🤍') + ' <span id="preview-fav-label">' + (fav ? 'In Favorites' : 'Add to Favorites') + '</span>';
}

function previewToggleFavorite() {
  if (!_previewBookId) return;
  toggleFavorite(_previewBookId);
  _refreshPreviewFavBtn(_previewBookId);
}

function closeBookPreview() {
  document.getElementById('book-preview-modal').classList.remove('open');
  document.body.style.overflow = '';
  _previewBookId = null;
}

function openBookFromPreview() {
  // Called when member clicks "Read →" inside the preview modal
  const bookId = _previewBookId;
  closeBookPreview();
  openBookReader(bookId);
}

function openBookReader(bookId) {
  const book = allBooks.find(b => b.id === bookId);
  if (!book) return;
  currentReadBook = book;

  /* Build structured sections */
  _readerSections = _buildReaderSections(book);

  /* If no structured content, fall back to description placeholder */
  if (_readerSections.length === 0) {
    _readerSections = [{
      type: 'placeholder', label: book.title, icon: '📖',
      body: book.description || 'No content available for this book yet.',
    }];
  }

  /* Restore progress — map old page-number progress to section index */
  const prog = readingProgress[bookId] || { page: 0, total: _readerSections.length, pct: 0 };
  _readerSectionIdx = Math.min(prog.page || 0, _readerSections.length - 1);

  /* Populate modal header */
  document.getElementById('reader-title').textContent    = book.title;
  document.getElementById('reader-author').textContent   = 'by ' + book.author;
  document.getElementById('reader-category').textContent = book.category;

  /* Render */
  _renderReaderSection();

  /* Progress bar */
  document.getElementById('reader-page-input').value       = _readerSectionIdx + 1;
  document.getElementById('reader-total-pages').textContent = _readerSections.length;
  updateReaderProgress(_readerSectionIdx, _readerSections.length);

  document.getElementById('reader-modal').classList.add('open');
  document.body.style.overflow = 'hidden';

  /* Attach keyboard navigation (once per open) */
  _readerAttachKeyboard();
}

function _renderReaderSection() {
  const sec = _readerSections[_readerSectionIdx];
  if (!sec) return;

  const isChapter = sec.type === 'chapter';
  const isToc     = sec.type === 'toc';

  /* Render paragraphs — split on blank lines */
  const paragraphs = (sec.body || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

  let bodyHTML = '';

  if (isToc) {
    /* TOC: render as a clean list */
    const lines = (sec.body || '').split('\n').filter(Boolean);
    bodyHTML = `
      <div style="margin-top:20px;">
        ${lines.map((line, i) => `
          <div onclick="_readerJumpToChapterByLine(${i})"
               style="display:flex; align-items:center; gap:14px; padding:11px 0;
                      border-bottom:1px solid rgba(67,48,42,0.07); cursor:pointer;
                      transition:background 0.15s; border-radius:4px;"
               onmouseover="this.style.background='rgba(196,150,44,0.06)'"
               onmouseout="this.style.background='transparent'">
            <span style="font-size:0.72rem; font-weight:700; color:var(--gold);
                         min-width:30px; font-family:'Poppins',sans-serif;">${i + 1}</span>
            <span style="font-size:0.95rem; color:var(--brown-dark); font-family:'Georgia',serif;">${line}</span>
            <span style="margin-left:auto; font-size:0.78rem; color:var(--text-muted);">→</span>
          </div>`).join('')}
      </div>`;
  } else if (paragraphs.length === 0) {
    bodyHTML = `
      <div style="text-align:center; padding:48px 24px; color:var(--text-muted);">
        <div style="font-size:2.5rem; margin-bottom:12px; opacity:0.3;">${sec.icon}</div>
        <div style="font-size:0.9rem;">No content has been added to this section yet.</div>
      </div>`;
  } else {
    bodyHTML = paragraphs.map(p =>
      `<p style="font-size:1.05rem; line-height:1.95; color:#3a2e28; margin-bottom:24px;
                 font-family:'Georgia',serif; letter-spacing:0.01em;">${p}</p>`
    ).join('');
  }

  document.getElementById('reader-content').innerHTML = `
    <div style="max-width:660px; margin:0 auto;">
      <!-- Section header -->
      <div style="margin-bottom:32px; padding-bottom:22px; border-bottom:1px solid rgba(67,48,42,0.10);">
        ${isChapter ? `
          <div style="font-size:0.72rem; font-weight:700; letter-spacing:0.16em; text-transform:uppercase;
                      color:var(--gold); margin-bottom:10px; font-family:'Poppins',sans-serif;">
            Chapter ${sec.chapterNum}
          </div>` : `
          <div style="font-size:0.72rem; font-weight:700; letter-spacing:0.14em; text-transform:uppercase;
                      color:var(--text-muted); margin-bottom:10px; font-family:'Poppins',sans-serif;">
            ${sec.icon} ${sec.type === 'toc' ? 'Table of Contents' : sec.type.replace('-',' ')}
          </div>`}
        <h3 style="font-family:'Playfair Display',serif; font-size:1.65rem; color:var(--brown-dark);
                   font-weight:700; line-height:1.25; margin:0;">
          ${sec.label}
        </h3>
      </div>

      <!-- Body -->
      ${bodyHTML}

      <!-- Navigation hint at bottom -->
      <div style="margin-top:40px; padding-top:20px; border-top:1px solid rgba(67,48,42,0.08);
                  display:flex; justify-content:space-between; align-items:center;
                  font-size:0.78rem; color:var(--text-muted);">
        <span>${_readerSectionIdx + 1} of ${_readerSections.length}</span>
        <span>${_readerSectionIdx < _readerSections.length - 1
          ? 'Next: ' + _readerSections[_readerSectionIdx + 1].label
          : '✓ End of book'}</span>
      </div>
    </div>`;

  /* Scroll content area back to top on every page change */
  const contentEl = document.getElementById('reader-content');
  if (contentEl) contentEl.scrollTop = 0;
}

/* Jump to chapter by its position in the TOC list */
function _readerJumpToChapterByLine(lineIdx) {
  /* Count how many front-matter + toc sections exist before chapters */
  const chapterStart = _readerSections.findIndex(s => s.type === 'chapter');
  if (chapterStart === -1) return;
  const target = chapterStart + lineIdx;
  if (target < _readerSections.length) {
    _readerSectionIdx = target;
    _renderReaderSection();
    _syncReaderControls();
  }
}

function _syncReaderControls() {
  document.getElementById('reader-page-input').value = _readerSectionIdx + 1;
  document.getElementById('reader-total-pages').textContent = _readerSections.length;
  updateReaderProgress(_readerSectionIdx, _readerSections.length);
  saveProgress(currentReadBook.id, _readerSectionIdx, _readerSections.length);
}

function updateReaderProgress(page, total) {
  const pct = total > 0 ? Math.min(100, Math.round((page / total) * 100)) : 0;
  document.getElementById('reader-progress-fill').style.width = pct + '%';
  document.getElementById('reader-progress-pct').textContent  = pct + '%';
}

function readerNavigate(direction) {
  if (!currentReadBook) return;
  if (direction === 'prev') _readerSectionIdx = Math.max(0, _readerSectionIdx - 1);
  if (direction === 'next') _readerSectionIdx = Math.min(_readerSections.length - 1, _readerSectionIdx + 1);

  _renderReaderSection();
  _syncReaderControls();

  if (document.getElementById('section-home').classList.contains('active'))    renderDashboardHome();
  if (document.getElementById('section-reading').classList.contains('active')) renderReadingSection();
}

function readerJumpToPage() {
  if (!currentReadBook) return;
  const input = document.getElementById('reader-page-input');
  _readerSectionIdx = Math.max(0, Math.min(_readerSections.length - 1, (parseInt(input.value, 10) || 1) - 1));
  _renderReaderSection();
  _syncReaderControls();
}

/* ─────────────────────────────────────────────────────────────
   KEYBOARD NAVIGATION — ← / → arrow keys while reader is open
   ───────────────────────────────────────────────────────────── */
let _readerKeyHandler = null;

function _readerAttachKeyboard() {
  /* Remove any previous handler to avoid duplicates */
  _readerDetachKeyboard();

  _readerKeyHandler = function(e) {
    /* Only fire when the reader modal is open */
    if (!document.getElementById('reader-modal').classList.contains('open')) return;

    /* Don't steal keys when user is typing in an input/textarea */
    const tag = (e.target || document.activeElement || {}).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      readerNavigate('next');
      /* Brief visual flash on the Next button for feedback */
      _readerButtonFlash('reader-next-btn');
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      readerNavigate('prev');
      _readerButtonFlash('reader-prev-btn');
    } else if (e.key === 'Escape') {
      closeReader();
    }
  };

  document.addEventListener('keydown', _readerKeyHandler);
}

function _readerDetachKeyboard() {
  if (_readerKeyHandler) {
    document.removeEventListener('keydown', _readerKeyHandler);
    _readerKeyHandler = null;
  }
}

/* Brief highlight pulse on a nav button for keyboard feedback */
function _readerButtonFlash(btnId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.style.transition = 'background 0.05s';
  btn.style.background = 'rgba(196,150,44,0.20)';
  setTimeout(() => { btn.style.background = ''; }, 160);
}

function closeReader() {
  document.getElementById('reader-modal').classList.remove('open');
  document.body.style.overflow = '';
  currentReadBook = null;
  _readerSections = [];
  _readerSectionIdx = 0;
  /* Detach keyboard listener when reader closes */
  _readerDetachKeyboard();
  const active = document.querySelector('.page-section.active');
  if (active) {
    const id = active.id.replace('section-', '');
    switchSection(id, false);
  }
}

/* ─────────────────────────────────────────────────────────────
   SECTION: PROFILE
   ───────────────────────────────────────────────────────────── */
function renderProfileSection() {
  if (!currentUser) return;
  document.getElementById('profile-name-display').textContent    = `${currentUser.firstName} ${currentUser.lastName}`;
  document.getElementById('profile-email-display').textContent   = currentUser.email;
  document.getElementById('profile-role-display').textContent    = 'Member';
  document.getElementById('profile-joined-display').textContent  = formatDate(currentUser.createdAt || new Date().toISOString());
  document.getElementById('profile-avatar-display').textContent  = currentUser.avatar || 'U';
  document.getElementById('profile-books-read').textContent      = Object.keys(readingProgress).length;
  document.getElementById('profile-fav-count').textContent       = favorites.length;
  document.getElementById('profile-completed-count').textContent = Object.values(readingProgress).filter(p => p.pct >= 100).length;

  // Pre-fill edit fields
  document.getElementById('edit-first-name').value = currentUser.firstName;
  document.getElementById('edit-last-name').value  = currentUser.lastName;
  document.getElementById('edit-email').value      = currentUser.email;
}

function saveProfileChanges() {
  const firstName = document.getElementById('edit-first-name').value.trim();
  const lastName  = document.getElementById('edit-last-name').value.trim();
  const email     = document.getElementById('edit-email').value.trim();

  if (!firstName || !lastName || !email) {
    showToast('⚠️ All fields are required.', 'error');
    return;
  }

  // Update in accounts array
  const accounts = get(SK.ACCOUNTS, []);
  const idx = accounts.findIndex(a => a.id === currentUser.id);
  if (idx !== -1) {
    accounts[idx].firstName = firstName;
    accounts[idx].lastName  = lastName;
    accounts[idx].email     = email;
    accounts[idx].avatar    = (firstName[0] + (lastName[0] || '')).toUpperCase();
    set(SK.ACCOUNTS, accounts);

    // Update session
    currentUser = { ...currentUser, firstName, lastName, email, avatar: accounts[idx].avatar };
    set(SK.SESSION, currentUser);
  }

  // Update UI
  populateUserUI();
  renderProfileSection();
  showToast('✓ Profile updated successfully!', 'success');
}

/* ─────────────────────────────────────────────────────────────
   SECTION: SETTINGS
   ───────────────────────────────────────────────────────────── */
function savePasswordChange() {
  const current  = document.getElementById('settings-current-pw').value;
  const newPw    = document.getElementById('settings-new-pw').value;
  const confirmPw = document.getElementById('settings-confirm-pw').value;

  if (!current || !newPw || !confirmPw) {
    showToast('⚠️ Please fill in all password fields.', 'error');
    return;
  }

  const accounts = get(SK.ACCOUNTS, []);
  const account  = accounts.find(a => a.id === currentUser.id);

  if (!account || account.password !== current) {
    showToast('Current password is incorrect.', 'error');
    return;
  }

  if (newPw.length < 8) {
    showToast('New password must be at least 8 characters.', 'error');
    return;
  }

  if (newPw !== confirmPw) {
    showToast('New passwords do not match.', 'error');
    return;
  }

  const idx = accounts.findIndex(a => a.id === currentUser.id);
  accounts[idx].password = newPw;
  set(SK.ACCOUNTS, accounts);

  // Clear fields
  document.getElementById('settings-current-pw').value  = '';
  document.getElementById('settings-new-pw').value      = '';
  document.getElementById('settings-confirm-pw').value  = '';

  showToast('✓ Password changed successfully!', 'success');
}

function handleDeleteAccount() {
  const confirm = document.getElementById('delete-confirm-input').value;
  if (confirm !== 'DELETE') {
    showToast('⚠️ Type DELETE exactly to confirm.', 'error');
    return;
  }

  const accounts = get(SK.ACCOUNTS, []).filter(a => a.id !== currentUser.id);
  set(SK.ACCOUNTS, accounts);

  // Clear user's favorites and progress
  const allFavs = get(SK.FAVORITES, {});
  delete allFavs[currentUser.id];
  set(SK.FAVORITES, allFavs);

  const allProgress = get(SK.PROGRESS, {});
  delete allProgress[currentUser.id];
  set(SK.PROGRESS, allProgress);

  // Clear session
  localStorage.removeItem(SK.SESSION);

  showToast('Account deleted. Redirecting...', '');
  setTimeout(() => { window.location.href = 'index.html'; }, 1500);
}

/* ─────────────────────────────────────────────────────────────
   UI POPULATION
   ───────────────────────────────────────────────────────────── */
function populateUserUI() {
  if (!currentUser) return;
  const fullName = `${currentUser.firstName} ${currentUser.lastName}`;
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = fullName);
  document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = currentUser.email);
  document.querySelectorAll('[data-user-avatar]').forEach(el => el.textContent = currentUser.avatar || 'U');
  document.querySelectorAll('[data-user-first]').forEach(el => el.textContent = currentUser.firstName);
}

/* ─────────────────────────────────────────────────────────────
   NAVIGATION — section switching
   ───────────────────────────────────────────────────────────── */
function switchSection(sectionId, updateNav = true) {
  // Hide all sections
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  // Show target
  const target = document.getElementById('section-' + sectionId);
  if (target) target.classList.add('active');

  // Update sidebar nav
  if (updateNav) {
    document.querySelectorAll('.sidebar-nav a').forEach(a => {
      a.classList.toggle('active', a.dataset.section === sectionId);
    });
  }

  // Update topbar title
  const titles = {
    home:     ['My Dashboard',       'Welcome back 👋'],
    explore:  ['Explore Books',      'Discover your next great read'],
    favorites:['My Favorites',       'Your saved books collection'],
    reading:  ['Reading Progress',   'Track your reading journey'],
    profile:  ['My Profile',         'Manage your account details'],
    settings: ['Account Settings',   'Preferences & security'],
  };
  const [title, sub] = titles[sectionId] || ['Dashboard', ''];
  document.getElementById('topbar-title').textContent    = title;
  document.getElementById('topbar-subtitle').textContent = sub;

  // Render section content
  switch (sectionId) {
    case 'home':     renderDashboardHome();   break;
    case 'explore':  renderExploreSection();  break;
    case 'favorites':renderFavoritesSection();break;
    case 'reading':  renderReadingSection();  break;
    case 'profile':  renderProfileSection();  break;
    case 'settings': /* static */            break;
  }

  // Close mobile sidebar
  closeMobileSidebar();
}

/* ─────────────────────────────────────────────────────────────
   MOBILE SIDEBAR
   ───────────────────────────────────────────────────────────── */
function openMobileSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('show');
  document.body.style.overflow = '';
}

/* ─────────────────────────────────────────────────────────────
   TOAST NOTIFICATIONS
   ───────────────────────────────────────────────────────────── */
function showToast(message, type = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast-item ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ️'}</span>
    <span>${message}</span>`;
  container.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove after delay
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

/* ─────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return 'N/A';
  try {
    return new Date(iso).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return iso; }
}

/* ─────────────────────────────────────────────────────────────
   INIT — runs on DOMContentLoaded
   ───────────────────────────────────────────────────────────── */
function init() {
  seedBooks();
  loadUserData();
  populateUserUI();
  buildCategoryFilter();
  switchSection('home');
}

document.addEventListener('DOMContentLoaded', init);