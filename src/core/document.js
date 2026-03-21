let doc = { name: null, content: null, originalContent: null, filePath: null };

export function openDocument({ name, content, filePath = null }) {
  doc.name = name;
  doc.content = content;
  doc.originalContent = content;
  doc.filePath = filePath;
}

export function updateContent(newContent) {
  doc.content = newContent;
}

export function isDirty() {
  return doc.content !== doc.originalContent;
}

export function getDocument() {
  return { ...doc };
}

export function markSaved() {
  doc.originalContent = doc.content;
}

export function setFilePath(filePath) {
  doc.filePath = filePath;
}
