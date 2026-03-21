let matches = [];
let currentIndex = -1;
let debounceTimer = null;
let keydownHandler = null;

export function render() {
  return `
    <div class="search-bar" id="search-bar">
      <input class="search-input" id="search-input" type="text" placeholder="Search in document..." aria-label="Search in document" />
      <span class="search-count" id="search-count"></span>
      <button class="search-nav-btn" id="search-prev" aria-label="Previous match" title="Previous">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </button>
      <button class="search-nav-btn" id="search-next" aria-label="Next match" title="Next">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <button class="search-close-btn" id="search-close" aria-label="Close search" title="Close (Esc)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `;
}

export function mount() {
  const searchBar = document.getElementById('search-bar');
  const input = document.getElementById('search-input');
  const countEl = document.getElementById('search-count');
  const prevBtn = document.getElementById('search-prev');
  const nextBtn = document.getElementById('search-next');
  const closeBtn = document.getElementById('search-close');
  const toggleBtn = document.getElementById('search-toggle-btn');

  function toggle() {
    const isOpen = searchBar.classList.toggle('open');
    if (isOpen) {
      input.focus();
    } else {
      clearHighlights();
      input.value = '';
      countEl.textContent = '';
    }
  }

  toggleBtn?.addEventListener('click', toggle);
  closeBtn?.addEventListener('click', toggle);

  input?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => doSearch(input.value, countEl), 300);
  });

  prevBtn?.addEventListener('click', () => navigateMatch(-1, countEl));
  nextBtn?.addEventListener('click', () => navigateMatch(1, countEl));

  // Keyboard shortcuts — store reference for cleanup
  keydownHandler = (e) => {
    // Ctrl+F / Cmd+F to open search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      if (document.querySelector('.reader-layout')) {
        e.preventDefault();
        if (!searchBar.classList.contains('open')) {
          searchBar.classList.add('open');
        }
        input.focus();
        input.select();
      }
    }

    if (!searchBar.classList.contains('open')) return;

    if (e.key === 'Escape') {
      toggle();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      navigateMatch(e.shiftKey ? -1 : 1, countEl);
    }
  };
  document.addEventListener('keydown', keydownHandler);
}

export function destroy() {
  clearTimeout(debounceTimer);
  clearHighlights();
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  }
  matches = [];
  currentIndex = -1;
  debounceTimer = null;
}

function doSearch(query, countEl) {
  clearHighlights();
  matches = [];
  currentIndex = -1;

  if (!query || query.length < 2) {
    countEl.textContent = '';
    return;
  }

  const contentEl = document.querySelector('.markdown-body');
  if (!contentEl) return;

  // Collect all text node ranges that match, without modifying the DOM yet
  const queryLower = query.toLowerCase();
  const rangesToMark = [];

  const collectRanges = () => {
    const walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement?.closest('mark.search-highlight')) continue;

      const text = node.textContent;
      const textLower = text.toLowerCase();
      let startIdx = 0;

      while (startIdx < text.length) {
        const idx = textLower.indexOf(queryLower, startIdx);
        if (idx === -1) break;
        rangesToMark.push({ node, start: idx, end: idx + query.length });
        startIdx = idx + query.length;
      }
    }
  };

  collectRanges();

  // Now wrap all matches — iterate in reverse to preserve offsets within same node
  // Group by node first
  const byNode = new Map();
  for (const r of rangesToMark) {
    if (!byNode.has(r.node)) byNode.set(r.node, []);
    byNode.get(r.node).push(r);
  }

  for (const [node, ranges] of byNode) {
    // Process ranges in reverse order so earlier offsets remain valid
    const sorted = ranges.sort((a, b) => b.start - a.start);
    for (const { start, end } of sorted) {
      try {
        const range = document.createRange();
        range.setStart(node, start);
        range.setEnd(node, end);
        const mark = document.createElement('mark');
        mark.className = 'search-highlight';
        range.surroundContents(mark);
        matches.unshift(mark); // unshift since we go in reverse
      } catch {
        // Skip ranges that span across element boundaries
      }
    }
  }

  if (matches.length > 0) {
    currentIndex = 0;
    highlightCurrent(countEl);
  } else {
    countEl.textContent = '0 results';
  }
}

function navigateMatch(direction, countEl) {
  if (matches.length === 0) return;
  currentIndex = (currentIndex + direction + matches.length) % matches.length;
  highlightCurrent(countEl);
}

function highlightCurrent(countEl) {
  matches.forEach((m) => m.classList.remove('active'));
  if (matches[currentIndex]) {
    matches[currentIndex].classList.add('active');
    matches[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  countEl.textContent = `${currentIndex + 1} of ${matches.length}`;
}

function clearHighlights() {
  document.querySelectorAll('mark.search-highlight').forEach((mark) => {
    const parent = mark.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    }
  });
  matches = [];
  currentIndex = -1;
}
