const RECENT_KEY = 'mdreader_recent';
const PREFS_KEY = 'mdreader_prefs';
const MAX_RECENT = 10;

function safeGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function makeSnippet(content) {
  return content
    .replace(/^#+\s+/gm, '')
    .replace(/[*_~`>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 150);
}

export function getRecentFiles() {
  return safeGet(RECENT_KEY) || [];
}

export function addRecentFile({ name, content }) {
  const files = getRecentFiles();

  // Remove existing entry with same name
  const idx = files.findIndex((f) => f.name === name);
  if (idx !== -1) files.splice(idx, 1);

  const contentTooLarge = content.length > 10 * 1024 * 1024;
  const entry = {
    id: crypto.randomUUID(),
    name,
    snippet: makeSnippet(content),
    content: contentTooLarge ? null : content,
    contentTooLarge,
    timestamp: Date.now(),
  };

  files.unshift(entry);

  // Trim to max
  while (files.length > MAX_RECENT) files.pop();

  // Try to store, remove oldest if quota exceeded
  if (!safeSet(RECENT_KEY, files)) {
    while (files.length > 1) {
      files.pop();
      if (safeSet(RECENT_KEY, files)) return entry;
    }
  }
  return entry;
}

export function removeRecentFile(id) {
  const files = getRecentFiles().filter((f) => f.id !== id);
  safeSet(RECENT_KEY, files);
}

export function getPreference(key) {
  const prefs = safeGet(PREFS_KEY) || {};
  return prefs[key] ?? null;
}

export function setPreference(key, value) {
  const prefs = safeGet(PREFS_KEY) || {};
  prefs[key] = value;
  safeSet(PREFS_KEY, prefs);
}
