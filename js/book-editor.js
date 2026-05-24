'use strict';

/* ─────────────────────────────────────────────────────────────
   BOOK STRUCTURE SCHEMA
   Every book object now has:
   {
     ...existing fields (title, author, cover, etc.)...
     description:  string   — short back-cover blurb (cards/search)
     frontMatter:  Section[] — copyright, dedication, epigraph, etc.
     chapters:     Chapter[] — numbered chapters with title + body
     backMatter:   Section[] — appendix, glossary, index, etc.
   }

   Section:  { id, type, title, body, enabled }
   Chapter:  { id, order, title, body }
   ───────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────
   FRONT MATTER SECTION TYPES (in canonical display order)
   ───────────────────────────────────────────────────────────── */
const FRONT_MATTER_TYPES = [
  { type: 'half-title',       label: 'Half Title',       icon: '', hint: 'Usually just the book title, sometimes a subtitle. Appears before the full title page.' },
  { type: 'copyright',        label: 'Copyright',        icon: '',  hint: 'Legal copyright notice, ISBN, publisher info, edition details.' },
  { type: 'dedication',       label: 'Dedication',       icon: '', hint: 'A short personal note from the author to someone meaningful.' },
  { type: 'epigraph',         label: 'Epigraph',         icon: '', hint: 'A short quote or poem that sets the tone of the book.' },
  { type: 'table-of-contents',label: 'Table of Contents',icon: '', hint: 'Auto-generated from your chapters. No need to write this manually.' },
  { type: 'foreword',         label: 'Foreword',         icon: '', hint: 'Written by someone other than the author — introduces the book.' },
  { type: 'preface',          label: 'Preface',          icon: '', hint: 'Written by the author — explains why they wrote the book.' },
  { type: 'acknowledgments',  label: 'Acknowledgments',  icon: '', hint: 'The author thanks people who helped bring the book to life.' },
  { type: 'introduction',     label: 'Introduction',     icon: '', hint: 'Sets up the book\'s themes or context before Chapter 1.' },
];

/* ─────────────────────────────────────────────────────────────
   BACK MATTER SECTION TYPES (in canonical display order)
   ───────────────────────────────────────────────────────────── */
const BACK_MATTER_TYPES = [
  { type: 'epilogue',      label: 'Epilogue',          icon: '', hint: 'A closing section that follows the main narrative.' },
  { type: 'afterword',     label: 'Afterword',         icon: '', hint: 'The author\'s reflection written after the book is finished.' },
  { type: 'appendix',      label: 'Appendix',          icon: '', hint: 'Supplemental material — data, charts, extended notes.' },
  { type: 'notes',         label: 'Notes',             icon: '', hint: 'Footnotes or endnotes, expanded.' },
  { type: 'glossary',      label: 'Glossary',          icon: '', hint: 'Key terms and their definitions.' },
  { type: 'bibliography',  label: 'Bibliography',      icon: '', hint: 'Sources, references, and further reading.' },
  { type: 'resources',     label: 'Resources',         icon: '', hint: 'Recommended books, websites, or tools.' },
  { type: 'index',         label: 'Index',             icon: '', hint: 'Alphabetical list of topics with page references.' },
  { type: 'about-author',  label: 'About the Author',  icon: '', hint: 'Short biography of the author.' },
];

/* ─────────────────────────────────────────────────────────────
   EDITOR STATE
   ───────────────────────────────────────────────────────────── */
let _beBookId      = null;       // null = new book
let _beActiveTab   = 'front';    // 'front' | 'chapters' | 'back'
let _beChapters    = [];         // working copy of chapters array
let _beFront       = [];         // working copy of front matter
let _beBack        = [];         // working copy of back matter
let _beActiveChIdx = null;       // index of chapter being edited in right pane
let _beSaveCallback = null;      // fn(bookId, structure) called on Save

/* ─────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────── */
function _beId() {
  return 'be_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

function _beEscape(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* Build a default section object for a given type */
function _beDefaultSection(typeDef) {
  return { id: _beId(), type: typeDef.type, title: typeDef.label, body: '', enabled: false };
}

/* Merge saved sections with the canonical type list, preserving saved data */
function _beMergeSections(saved, typeDefs) {
  return typeDefs.map(def => {
    const found = (saved || []).find(s => s.type === def.type);
    const merged = found ? { ...found, enabled: found.enabled !== false } : _beDefaultSection(def);
    /* TOC is always enabled — it is auto-generated and must always be included */
    if (def.type === 'table-of-contents') merged.enabled = true;
    return merged;
  });
}

/* ─────────────────────────────────────────────────────────────
   OPEN THE BOOK STRUCTURE EDITOR
   Call this from openAdminBookModal / openEditModal instead of
   the old small modal, after the basic fields are already set.

   bookId    — existing book id, or null for a new book
   book      — the full book object (or partial defaults for new)
   onSave    — callback(bookId, { frontMatter, chapters, backMatter })
   ───────────────────────────────────────────────────────────── */
function openBookEditor(bookId, book, onSave) {
  _beBookId       = bookId;
  _beSaveCallback = onSave;
  _beActiveTab    = 'front';
  _beActiveChIdx  = null;

  /* Load or initialise structure */
  _beFront    = _beMergeSections(book.frontMatter,  FRONT_MATTER_TYPES);
  _beBack     = _beMergeSections(book.backMatter,   BACK_MATTER_TYPES);
  _beChapters = (book.chapters || []).map(c => ({ ...c }));

  /* Ensure at least one chapter for new books */
  if (_beChapters.length === 0) {
    _beChapters.push({ id: _beId(), order: 1, title: 'Chapter 1', body: '' });
  }

  /* Sort chapters by order */
  _beChapters.sort((a, b) => a.order - b.order);

  /* Inject or show the editor overlay */
  _beEnsureModal();
  _beRender();

  document.getElementById('be-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeBookEditor() {
  const overlay = document.getElementById('be-overlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

/* ─────────────────────────────────────────────────────────────
   INJECT MODAL HTML (once)
   ───────────────────────────────────────────────────────────── */
function _beEnsureModal() {
  if (document.getElementById('be-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'be-overlay';
  /* FIX: 'modal-overlay' class provides display:none by default and display:flex when
     .open is added. z-index is overridden inline so this editor sits above other modals. */
  overlay.className = 'modal-overlay';
  overlay.style.cssText = `
    z-index:800;
    align-items:stretch; justify-content:center; padding:0;
  `;
  overlay.innerHTML = `
    <div id="be-shell" style="
      width:100%; max-width:1060px; margin:auto;
      background:white; border-radius:0; display:flex; flex-direction:column;
      height:100vh; overflow:hidden; position:relative;
      box-shadow:0 0 80px rgba(42,31,26,0.35);
    ">
      <!-- Header -->
      <div id="be-header" style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:0 28px;
        height:62px;
        flex-shrink:0;
        background:var(--brown-dark);
        color:var(--cream);
        border-bottom:2px solid rgba(196,150,44,0.30);
      ">
        <div style=" font-family:'Playfair Display',serif; font-size:1.15rem; font-weight:700; width:220px; flex-shrink:0;">
          📖 <span id="be-header-title">Book Content Editor</span>
        </div>
        <!-- Tabs -->
        <div style="display:flex; gap:4px; background:rgba(0,0,0,0.20); border-radius:8px; padding:4px;">
          ${['front','chapters','back'].map(t => `
            <button id="be-tab-${t}" onclick="beSetTab('${t}')"
              style="padding:6px 16px; border:none; border-radius:6px; cursor:pointer;
                     font-family:'Poppins',sans-serif; font-size:0.8rem; font-weight:600;
                     transition:all 0.2s; background:transparent; color:rgb(250, 242, 215);">
              ${t === 'front' ? 'Front Matter' : t === 'chapters' ? 'Chapters' : 'Back Matter'}
            </button>`).join('')}
        </div>
        <button onclick="closeBookEditor()" style="
          width:34px; height:34px; border:none; background:rgba(255,255,255,0.10);
          border-radius:8px; cursor:pointer; font-size:1.1rem; color:var(--cream);
          display:flex; align-items:center; justify-content:center;
          transition:background 0.2s; flex-shrink:0;
        " onmouseover="this.style.background='rgba(201,64,64,0.35)'"
           onmouseout="this.style.background='rgba(255,255,255,0.10)'">✕</button>
      </div>

      <!-- Body -->
      <div id="be-body" style="flex:1; overflow:hidden; display:flex; flex-direction:column;">
        <!-- Content injected by _beRender() -->
      </div>

      <!-- Footer -->
      <div style="
        display:flex; align-items:center; justify-content:space-between;
        padding:14px 28px; flex-shrink:0;
        background:var(--cream); border-top:1px solid rgba(196,150,44,0.15);
      ">
        <div style="font-size:0.78rem; color:var(--text-muted);">
          <strong>Description</strong> (short blurb) is edited in the main book form.
          This editor handles the full structured content members read.
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-outline" onclick="closeBookEditor()">Cancel</button>
          <button class="btn btn-gold" onclick="beSave()">
            <i data-lucide="save"></i> Save Book Structure
          </button>
        </div>
      </div>
    </div>`;

  /* inject CSS */
  const style = document.createElement('style');
  style.textContent = `
    .be-tab-active {
      background:var(--gold) !important;
      color:var(--brown-dark) !important;
      box-shadow:0 2px 8px rgba(196,150,44,0.35);
    }
    .be-section-card {
      border:1.5px solid rgba(67,48,42,0.10);
      border-radius:10px; background:white;
      transition:border-color 0.2s, box-shadow 0.2s;
      margin-bottom:10px; overflow:hidden;
    }
    .be-section-card.enabled {
      border-color:rgba(196,150,44,0.35);
      box-shadow:0 2px 10px rgba(196,150,44,0.10);
    }
    .be-section-header {
      display:flex; align-items:center; gap:12px;
      padding:12px 16px; cursor:pointer;
      background:var(--cream); user-select:none;
    }
    .be-section-header:hover { background:rgba(196,150,44,0.06); }
    .be-section-body {
      padding:0 16px 16px; display:none;
      border-top:1px solid rgba(196,150,44,0.12);
    }
    .be-section-body.open { display:block; }
    .be-ch-item {
      display:flex; align-items:center; gap:10px;
      padding:10px 12px; border-radius:8px; cursor:pointer;
      transition:background 0.18s; border:1.5px solid transparent;
    }
    .be-ch-item:hover { background:rgba(196,150,44,0.07); }
    .be-ch-item.active {
      background:rgba(196,150,44,0.12);
      border-color:rgba(196,150,44,0.30);
    }
    .be-textarea {
      width:100%; padding:12px 14px;
      border:1.5px solid rgba(67,48,42,0.14);
      border-radius:8px; font-family:'Georgia',serif;
      font-size:0.92rem; line-height:1.75; color:var(--text-dark);
      background:white; outline:none; resize:vertical;
      transition:border-color 0.2s, box-shadow 0.2s;
    }
    .be-textarea:focus {
      border-color:var(--gold);
      box-shadow:0 0 0 3px rgba(196,150,44,0.12);
    }
    .be-input {
      width:100%; padding:9px 13px;
      border:1.5px solid rgba(67,48,42,0.14); border-radius:8px;
      font-family:'Poppins',sans-serif; font-size:0.88rem;
      color:var(--text-dark); background:var(--cream); outline:none;
      transition:border-color 0.2s, box-shadow 0.2s;
    }
    .be-input:focus {
      border-color:var(--gold); background:white;
      box-shadow:0 0 0 3px rgba(196,150,44,0.10);
    }
    .be-hint {
      font-size:0.72rem; color:var(--text-muted);
      margin-top:4px; line-height:1.5;
    }
    .be-label {
      font-size:0.75rem; font-weight:600; color:var(--brown-dark);
      margin-bottom:6px; display:block; letter-spacing:0.02em;
    }
    .be-ch-drag { cursor:grab; color:var(--text-muted); font-size:1rem; flex-shrink:0; }
    .be-toc-preview {
      font-size:0.82rem; color:var(--text-muted);
      padding:14px 16px; border-radius:8px;
      background:rgba(196,150,44,0.06);
      border:1px solid rgba(196,150,44,0.15);
      line-height:2;
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(overlay);
}

/* ─────────────────────────────────────────────────────────────
   RENDER — switches tab content
   ───────────────────────────────────────────────────────────── */
function _beRender() {
  /* Update tab button styles */
  ['front','chapters','back'].forEach(t => {
    const btn = document.getElementById('be-tab-' + t);
    if (!btn) return;
    btn.classList.toggle('be-tab-active', t === _beActiveTab);
  });

  const body = document.getElementById('be-body');
  if (!body) return;

  if (_beActiveTab === 'front')    body.innerHTML = _beRenderFront();
  if (_beActiveTab === 'chapters') body.innerHTML = _beRenderChapters();
  if (_beActiveTab === 'back')     body.innerHTML = _beRenderBack();

  if (window.lucide) lucide.createIcons();
}

/* ── TAB: FRONT MATTER ── */
function _beRenderFront() {
  return `
    <div style="overflow-y:auto; flex:1; padding:24px 28px;">
      <div style="max-width:720px; margin:0 auto;">
        <div style="margin-bottom:18px;">
          <div style="font-family:'Playfair Display',serif; font-size:1.1rem; font-weight:700; color:var(--brown-dark);">
            Front Matter
          </div>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-top:3px;">
            Toggle each section on/off. Only enabled sections appear in the book reader.
          </div>
        </div>
        ${_beFront.map((sec, idx) => _beSectionCard(sec, idx, 'front')).join('')}
      </div>
    </div>`;
}

/* ── TAB: BACK MATTER ── */
function _beRenderBack() {
  return `
    <div style="overflow-y:auto; flex:1; padding:24px 28px;">
      <div style="max-width:720px; margin:0 auto;">
        <div style="margin-bottom:18px;">
          <div style="font-family:'Playfair Display',serif; font-size:1.1rem; font-weight:700; color:var(--brown-dark);">
            Back Matter
          </div>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-top:3px;">
            Toggle each section on/off. Only enabled sections appear after the last chapter.
          </div>
        </div>
        ${_beBack.map((sec, idx) => _beSectionCard(sec, idx, 'back')).join('')}
      </div>
    </div>`;
}

/* ── SECTION CARD (reused for front + back) ── */
function _beSectionCard(sec, idx, mat) {
  const def = (mat === 'front' ? FRONT_MATTER_TYPES : BACK_MATTER_TYPES)
                .find(d => d.type === sec.type) || {};

  /* Table of contents is auto-generated — special read-only card */
  if (sec.type === 'table-of-contents') {
    const tocLines = _beChapters.map((c, i) =>
      `Chapter ${c.order}: ${c.title || 'Untitled'}`
    ).join('<br>');
    return `
      <div class="be-section-card enabled">
        <div class="be-section-header" style="cursor:default;">
          <span style="font-size:1.1rem;">${def.icon || '📑'}</span>
          <div style="flex:1;">
            <div style="font-size:0.88rem; font-weight:600; color:var(--brown-dark);">Table of Contents</div>
            <div class="be-hint">Auto-generated from your chapters — always included.</div>
          </div>
          <span style="font-size:0.72rem; padding:3px 10px; border-radius:20px;
                       background:rgba(196,150,44,0.15); color:var(--brown-mid); font-weight:700;">Auto</span>
        </div>
        <div class="be-section-body open" style="padding:14px 16px;">
          <div class="be-toc-preview">
            ${tocLines || '<em style="opacity:0.5;">Add chapters to see the table of contents.</em>'}
          </div>
        </div>
      </div>`;
  }

  const isEnabled = !!sec.enabled;
  return `
    <div class="be-section-card ${isEnabled ? 'enabled' : ''}" id="be-sec-${mat}-${idx}">
      <div class="be-section-header" onclick="_beToggleSectionBody('${mat}', ${idx})">
        <span style="font-size:1.1rem;">${def.icon || ''}</span>
        <div style="flex:1; min-width:0;">
          <div style="font-size:0.88rem; font-weight:600; color:var(--brown-dark);">${def.label || sec.title}</div>
          <div class="be-hint">${def.hint || ''}</div>
        </div>
        <!-- Toggle -->
        <label onclick="event.stopPropagation();" style="display:flex; align-items:center; gap:7px;
               cursor:pointer; flex-shrink:0;">
          <span style="font-size:0.72rem; color:var(--text-muted);">${isEnabled ? 'On' : 'Off'}</span>
          <input type="checkbox" ${isEnabled ? 'checked' : ''}
                 onchange="_beToggleSection('${mat}', ${idx}, this.checked)"
                 style="width:16px; height:16px; accent-color:var(--gold); cursor:pointer;" />
        </label>
        <span style="color:var(--text-muted); font-size:0.8rem; margin-left:8px;">▸</span>
      </div>
      <div class="be-section-body ${isEnabled ? 'open' : ''}" id="be-sbody-${mat}-${idx}">
        <div style="padding-top:14px;">
          <label class="be-label">Section Title</label>
          <input class="be-input" value="${_beEscape(sec.title)}"
                 oninput="_beUpdateSection('${mat}', ${idx}, 'title', this.value)"
                 placeholder="${def.label}" style="margin-bottom:12px;" />
          <label class="be-label">Content</label>
          <textarea class="be-textarea" rows="7"
                    oninput="_beUpdateSection('${mat}', ${idx}, 'body', this.value)"
                    placeholder="Write the ${def.label.toLowerCase()} here…">${_beEscape(sec.body)}</textarea>
        </div>
      </div>
    </div>`;
}

/* ── TAB: CHAPTERS ── */
function _beRenderChapters() {
  const ch = _beChapters[_beActiveChIdx] || null;

  return `
    <div style="display:flex; flex:1; overflow:hidden; height:100%;">

      <!-- LEFT: chapter list -->
      <div style="width:280px; flex-shrink:0; border-right:1px solid rgba(196,150,44,0.15);
                  background:var(--cream); display:flex; flex-direction:column; overflow:hidden;">
        <div style="padding:14px 16px; border-bottom:1px solid rgba(196,150,44,0.12);
                    display:flex; align-items:center; justify-content:space-between;">
          <div style="font-size:0.82rem; font-weight:600; color:var(--brown-dark);">
            ${_beChapters.length} Chapter${_beChapters.length !== 1 ? 's' : ''}
          </div>
          <button onclick="_beAddChapter()" style="
            display:flex; align-items:center; gap:5px;
            padding:5px 11px; border:none; border-radius:7px;
            background:var(--gold); color:white; font-size:0.75rem;
            font-weight:700; cursor:pointer; font-family:'Poppins',sans-serif;
            transition:opacity 0.2s;">
            + Add
          </button>
        </div>
        <div style="flex:1; overflow-y:auto; padding:10px;">
          ${_beChapters.map((c, i) => `
            <div class="be-ch-item ${i === _beActiveChIdx ? 'active' : ''}"
                 onclick="_beSelectChapter(${i})">
              <span class="be-ch-drag" title="Drag to reorder">⋮⋮</span>
              <div style="flex:1; min-width:0;">
                <div style="font-size:0.78rem; font-weight:700; color:var(--gold); margin-bottom:1px;">
                  Ch. ${c.order}
                </div>
                <div style="font-size:0.83rem; font-weight:600; color:var(--brown-dark);
                            white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${c.title || '<em style="opacity:0.5;">Untitled</em>'}
                </div>
                <div style="font-size:0.69rem; color:var(--text-muted); margin-top:1px;">
                  ${c.body ? Math.round(c.body.split(/\s+/).filter(Boolean).length / 200) + ' min read' : 'Empty'}
                </div>
              </div>
              <button onclick="event.stopPropagation(); _beDeleteChapter(${i})"
                      title="Delete chapter"
                      style="width:24px; height:24px; border:none; background:transparent;
                             cursor:pointer; color:rgba(201,64,64,0.45); font-size:0.85rem;
                             border-radius:5px; flex-shrink:0; transition:color 0.2s;"
                      onmouseover="this.style.color='var(--error)'"
                      onmouseout="this.style.color='rgba(201,64,64,0.45)'">✕</button>
            </div>`).join('')}
        </div>

        <!-- Re-order help -->
        <div style="padding:10px 14px; border-top:1px solid rgba(196,150,44,0.10);
                    font-size:0.68rem; color:var(--text-muted); line-height:1.5;">
          Click a chapter to edit. Use the ⋮⋮ handle to reorder (drag-and-drop) or the arrows below.
          ${_beActiveChIdx !== null ? `
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button onclick="_beMoveChapter(${_beActiveChIdx}, -1)" class="btn btn-outline btn-sm"
                    ${_beActiveChIdx === 0 ? 'disabled' : ''}>↑ Up</button>
            <button onclick="_beMoveChapter(${_beActiveChIdx}, 1)"  class="btn btn-outline btn-sm"
                    ${_beActiveChIdx === _beChapters.length - 1 ? 'disabled' : ''}>↓ Down</button>
          </div>` : ''}
        </div>
      </div>

      <!-- RIGHT: chapter editor -->
      <div style="flex:1; overflow-y:auto; padding:24px 28px; background:white;">
        ${ch ? `
          <div style="max-width:680px; margin:0 auto;">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
              <div style="background:var(--gold); color:white; font-family:'Playfair Display',serif;
                          font-size:1rem; font-weight:700; padding:6px 14px; border-radius:8px; flex-shrink:0;">
                Ch. ${ch.order}
              </div>
              <input class="be-input" style="font-size:1rem; font-weight:600; flex:1;"
                     value="${_beEscape(ch.title)}" placeholder="Chapter title"
                     oninput="_beUpdateChapter(${_beActiveChIdx}, 'title', this.value)" />
            </div>

            <label class="be-label">Chapter Content</label>
            <div class="be-hint" style="margin-bottom:10px;">
              Write the full text of this chapter. Use blank lines to separate paragraphs.
              Formatting tip: start sections with a heading line in ALL CAPS or followed by a blank line.
            </div>
            <textarea class="be-textarea" rows="24"
                      oninput="_beUpdateChapter(${_beActiveChIdx}, 'body', this.value)"
                      placeholder="Write chapter content here…\n\nSeparate paragraphs with a blank line.\n\nExample:\nThe morning sun crept over the mountains…"
                      >${_beEscape(ch.body)}</textarea>
            <div style="margin-top:8px; display:flex; justify-content:space-between;
                        font-size:0.72rem; color:var(--text-muted);">
              <span id="be-word-count-${_beActiveChIdx}">
                ${ch.body ? ch.body.split(/\s+/).filter(Boolean).length.toLocaleString() + ' words' : '0 words'}
              </span>
              <span>~${ch.body ? Math.round(ch.body.split(/\s+/).filter(Boolean).length / 200) : 0} min read</span>
            </div>
          </div>
        ` : `
          <div style="display:flex; align-items:center; justify-content:center;
                      height:100%; text-align:center; color:var(--text-muted);">
            <div>
              <div style="font-size:3rem; margin-bottom:14px; opacity:0.3;">📖</div>
              <div style="font-family:'Playfair Display',serif; font-size:1.1rem; color:var(--brown-dark); margin-bottom:8px;">
                Select a chapter to edit
              </div>
              <div style="font-size:0.83rem;">Click any chapter on the left, or add a new one.</div>
            </div>
          </div>`}
      </div>
    </div>`;
}

/* ─────────────────────────────────────────────────────────────
   TAB SWITCHING
   ───────────────────────────────────────────────────────────── */
function beSetTab(tab) {
  /* Flush any unsaved textarea changes before switching */
  _beFlushTextareas();
  _beActiveTab = tab;
  _beRender();
}

/* Read all live textarea/input values back into state before re-render */
function _beFlushTextareas() {
  if (_beActiveTab === 'front' || _beActiveTab === 'back') {
    const arr = _beActiveTab === 'front' ? _beFront : _beBack;
    arr.forEach((sec, idx) => {
      const body = document.querySelector(`#be-sbody-${_beActiveTab}-${idx} .be-textarea`);
      const title = document.querySelector(`#be-sbody-${_beActiveTab}-${idx} .be-input`);
      if (body)  sec.body  = body.value;
      if (title) sec.title = title.value;
    });
  }
  if (_beActiveTab === 'chapters' && _beActiveChIdx !== null) {
    const ch = _beChapters[_beActiveChIdx];
    if (ch) {
      const bodyEl  = document.querySelector('.be-textarea');
      const titleEl = document.querySelector('.be-input[placeholder="Chapter title"]');
      if (bodyEl)  ch.body  = bodyEl.value;
      if (titleEl) ch.title = titleEl.value;
    }
  }
}

/* ─────────────────────────────────────────────────────────────
   SECTION INTERACTIONS (front/back)
   ───────────────────────────────────────────────────────────── */
function _beToggleSection(mat, idx, enabled) {
  const arr = mat === 'front' ? _beFront : _beBack;
  arr[idx].enabled = enabled;

  /* Update card class without full re-render */
  const card  = document.getElementById(`be-sec-${mat}-${idx}`);
  const sbody = document.getElementById(`be-sbody-${mat}-${idx}`);
  if (card)  card.classList.toggle('enabled', enabled);
  if (sbody) sbody.classList.toggle('open', enabled);

  /* Update toggle label text */
  const label = card?.querySelector('label span');
  if (label) label.textContent = enabled ? 'On' : 'Off';
}

function _beToggleSectionBody(mat, idx) {
  const sbody = document.getElementById(`be-sbody-${mat}-${idx}`);
  if (sbody) sbody.classList.toggle('open');
}

function _beUpdateSection(mat, idx, field, value) {
  const arr = mat === 'front' ? _beFront : _beBack;
  if (arr[idx]) arr[idx][field] = value;
}

/* ─────────────────────────────────────────────────────────────
   CHAPTER INTERACTIONS
   ───────────────────────────────────────────────────────────── */
function _beSelectChapter(idx) {
  _beFlushTextareas();
  _beActiveChIdx = idx;
  _beRender();
}

function _beAddChapter() {
  _beFlushTextareas();
  const order = _beChapters.length + 1;
  _beChapters.push({ id: _beId(), order, title: `Chapter ${order}`, body: '' });
  _beActiveChIdx = _beChapters.length - 1;
  _beRender();
}

function _beDeleteChapter(idx) {
  if (_beChapters.length <= 1) {
    alert('A book must have at least one chapter.');
    return;
  }
  if (!confirm(`Delete "${_beChapters[idx].title || 'this chapter'}"? This cannot be undone.`)) return;
  _beChapters.splice(idx, 1);
  /* Re-number */
  _beChapters.forEach((c, i) => c.order = i + 1);
  _beActiveChIdx = Math.min(_beActiveChIdx || 0, _beChapters.length - 1);
  _beRender();
}

function _beMoveChapter(idx, dir) {
  _beFlushTextareas();
  const target = idx + dir;
  if (target < 0 || target >= _beChapters.length) return;
  [_beChapters[idx], _beChapters[target]] = [_beChapters[target], _beChapters[idx]];
  /* Re-number */
  _beChapters.forEach((c, i) => c.order = i + 1);
  _beActiveChIdx = target;
  _beRender();
}

function _beUpdateChapter(idx, field, value) {
  if (_beChapters[idx]) {
    _beChapters[idx][field] = value;
    /* Live word count update */
    if (field === 'body') {
      const wc = document.getElementById(`be-word-count-${idx}`);
      if (wc) wc.textContent = value.split(/\s+/).filter(Boolean).length.toLocaleString() + ' words';
    }
    /* Live TOC preview update — refresh whenever title changes */
    if (field === 'title') {
      _beRefreshTocPreview();
    }
  }
}

/* Surgically refresh the TOC preview pane without a full re-render.
   Called after chapter title edits or chapter add/delete/reorder. */
function _beRefreshTocPreview() {
  const preview = document.querySelector('.be-toc-preview');
  if (!preview) return; // TOC card is not currently visible (wrong tab)
  const tocLines = _beChapters.map(c =>
    `Chapter ${c.order}: ${c.title || 'Untitled'}`
  ).join('<br>');
  preview.innerHTML = tocLines ||
    '<em style="opacity:0.5;">Add chapters to see the table of contents.</em>';
}

/* ─────────────────────────────────────────────────────────────
   SAVE
   ───────────────────────────────────────────────────────────── */
function beSave() {
  _beFlushTextareas();

  /* Validate: at least one chapter with a title */
  if (_beChapters.length === 0 || !_beChapters[0].title.trim()) {
    alert('Please add at least one chapter with a title before saving.');
    return;
  }

  /* Ensure TOC is always enabled before saving */
  const tocSec = _beFront.find(s => s.type === 'table-of-contents');
  if (tocSec) tocSec.enabled = true;

  const structure = {
    frontMatter: _beFront,
    chapters:    _beChapters,
    backMatter:  _beBack,
  };

  if (typeof _beSaveCallback === 'function') {
    _beSaveCallback(_beBookId, structure);
  }

  closeBookEditor();
}

/* ─────────────────────────────────────────────────────────────
   MIGRATION HELPER
   Call this once to upgrade old book objects that lack structure.
   Safe to call multiple times (no-ops if already migrated).
   ───────────────────────────────────────────────────────────── */
function beEnsureBookStructure(book) {
  if (!book.frontMatter) book.frontMatter = [];
  if (!book.chapters)    book.chapters    = [];
  if (!book.backMatter)  book.backMatter  = [];
  return book;
}