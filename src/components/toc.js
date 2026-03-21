export function render(headings) {
  if (!headings || headings.length === 0) {
    return `
      <nav class="toc" aria-label="Table of contents">
        <div class="toc-title">Contents</div>
        <div class="toc-empty">No headings found</div>
      </nav>
    `;
  }

  return `
    <nav class="toc" aria-label="Table of contents">
      <div class="toc-title">Contents</div>
      ${buildList(headings)}
    </nav>
  `;
}

function buildList(headings) {
  // Find the minimum heading level
  const minLevel = Math.min(...headings.map((h) => h.level));

  let html = '<ul class="toc-list">';
  let currentLevel = minLevel;
  let openLists = 0;
  let isFirstItem = true;

  for (const h of headings) {
    while (h.level > currentLevel) {
      html += '<ul class="toc-list">';
      currentLevel++;
      openLists++;
      isFirstItem = true;
    }
    while (h.level < currentLevel) {
      html += '</li></ul></li>';
      currentLevel--;
      openLists--;
    }
    // Close previous sibling <li> at same level
    if (!isFirstItem) {
      html += '</li>';
    }
    isFirstItem = false;
    html += `<li class="toc-item"><a class="toc-link" href="#${h.id}" data-heading-id="${h.id}">${escapeHtml(h.text)}</a>`;
  }

  // Close the last <li> and any remaining nested lists
  if (headings.length > 0) html += '</li>';
  while (openLists > 0) {
    html += '</ul></li>';
    openLists--;
  }
  html += '</ul>';

  return html;
}

let observer = null;
let tocKeydownHandler = null;

export function mount() {
  // Smooth scroll on click
  document.querySelectorAll('.toc-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.getAttribute('data-heading-id');
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        // Close mobile TOC if open
        const overlay = document.querySelector('.toc-overlay');
        if (overlay) overlay.classList.remove('open');
      }
    });
  });

  // Scroll spy with IntersectionObserver
  const headingEls = document.querySelectorAll(
    '.markdown-body h1[id], .markdown-body h2[id], .markdown-body h3[id], .markdown-body h4[id], .markdown-body h5[id], .markdown-body h6[id]'
  );

  if (headingEls.length === 0) return;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      }
    },
    {
      rootMargin: '-80px 0px -70% 0px',
      threshold: 0,
    }
  );

  headingEls.forEach((el) => observer.observe(el));
}

export function destroy() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (tocKeydownHandler) {
    document.removeEventListener('keydown', tocKeydownHandler);
    tocKeydownHandler = null;
  }
}

function setActive(id) {
  document.querySelectorAll('.toc-link').forEach((link) => {
    link.classList.toggle('toc-active', link.getAttribute('data-heading-id') === id);
  });
}

// Mobile TOC FAB + overlay
export function renderMobileToc(headings) {
  if (!headings || headings.length === 0) return '';

  return `
    <button class="toc-fab" id="toc-fab" aria-label="Open table of contents">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    </button>
    <div class="toc-overlay" id="toc-overlay" role="dialog" aria-label="Table of contents">
      <div class="toc-overlay-backdrop" id="toc-overlay-backdrop"></div>
      <div class="toc-overlay-panel">
        ${render(headings)}
      </div>
    </div>
  `;
}

export function mountMobileToc() {
  const fab = document.getElementById('toc-fab');
  const overlay = document.getElementById('toc-overlay');
  const backdrop = document.getElementById('toc-overlay-backdrop');

  if (!fab || !overlay) return;

  fab.addEventListener('click', () => {
    overlay.classList.toggle('open');
  });

  backdrop?.addEventListener('click', () => {
    overlay.classList.remove('open');
  });

  // Close on Escape — store reference for cleanup
  tocKeydownHandler = (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      overlay.classList.remove('open');
    }
  };
  document.addEventListener('keydown', tocKeydownHandler);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
