import { parse, extractHeadings } from '../core/parser.js';
import { addRecentFile } from '../core/storage.js';
import * as topBar from '../components/top-bar.js';
import * as toc from '../components/toc.js';
import * as search from '../components/search.js';
import * as codeBlock from '../components/code-block.js';

export function render(data) {
  const { name, content } = data;

  if (!content || content.trim().length === 0) {
    return `
      <div class="reader-layout view-enter">
        ${topBar.render(name, data)}
        <div class="reader-search-bar">${search.render()}</div>
        <div class="reader-sidebar"></div>
        <div class="reader-content">
          <div class="reader-empty">
            <div class="reader-empty-icon">&#128196;</div>
            <p>This file appears to be empty.</p>
          </div>
        </div>
      </div>
    `;
  }

  const headings = extractHeadings(content);
  const html = parse(content);

  return `
    <div class="reader-layout view-enter">
      ${topBar.render(name, data)}
      <div class="reader-search-bar">${search.render()}</div>
      <aside class="reader-sidebar">
        ${toc.render(headings)}
      </aside>
      <main class="reader-content" id="main-content">
        <article class="markdown-body">${html}</article>
      </main>
      ${toc.renderMobileToc(headings)}
    </div>
  `;
}

export function mount(data) {
  const { name, content } = data;

  // Save to recent files (skip empty content)
  if (content && content.trim().length > 0) {
    addRecentFile({ name, content });
  }

  // Mount sub-components
  topBar.mount();
  toc.mount();
  toc.mountMobileToc();
  search.mount();
  codeBlock.mount();
}

export function destroy() {
  search.destroy();
  toc.destroy();
}
