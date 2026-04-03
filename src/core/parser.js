import markdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';

// Register common languages
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import ruby from 'highlight.js/lib/languages/ruby';
import php from 'highlight.js/lib/languages/php';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import markdown from 'highlight.js/lib/languages/markdown';
import diff from 'highlight.js/lib/languages/diff';
import csharp from 'highlight.js/lib/languages/csharp';
import kotlin from 'highlight.js/lib/languages/kotlin';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('c', c);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('php', php);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('diff', diff);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cs', csharp);
hljs.registerLanguage('kotlin', kotlin);

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const md = markdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch {
        // fall through
      }
    }
    try {
      return hljs.highlightAuto(str).value;
    } catch {
      return '';
    }
  },
});

// Custom heading renderer to inject IDs
const defaultHeadingOpen =
  md.renderer.rules.heading_open ||
  function (tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options);
  };

const headingIds = new Set();

md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx];
  const nextToken = tokens[idx + 1];
  if (nextToken && nextToken.children) {
    const text = nextToken.children
      .filter((t) => t.type === 'text' || t.type === 'code_inline')
      .map((t) => t.content)
      .join('');
    let id = slugify(text);
    // Ensure unique
    let base = id;
    let counter = 1;
    while (headingIds.has(id)) {
      id = `${base}-${counter++}`;
    }
    headingIds.add(id);
    token.attrSet('id', id);
  }
  return defaultHeadingOpen(tokens, idx, options, env, self);
};

export const SUPPORTED_EXTENSIONS = [
  '.md', '.markdown', '.mdown', '.mkd', '.mdx',
  '.txt', '.json', '.yaml', '.yml', '.toml', '.csv',
  '.spec', '.log', '.ini', '.env', '.xml',
];

const MD_EXTENSIONS = new Set(['.md', '.markdown', '.mdown', '.mkd', '.mdx']);

const PLAIN_TEXT_FORMATS = {
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.xml': 'xml',
  '.toml': 'toml',
  '.ini': 'ini',
  '.csv': 'plaintext',
  '.txt': 'plaintext',
  '.spec': 'plaintext',
  '.log': 'plaintext',
  '.env': 'plaintext',
};

export function parseFile(content, filename) {
  const raw = filename || '';
  const dotIdx = raw.lastIndexOf('.');
  const ext = dotIdx >= 0 ? raw.slice(dotIdx).toLowerCase() : '';
  if (!ext || MD_EXTENSIONS.has(ext)) {
    return parse(content);
  }
  const lang = PLAIN_TEXT_FORMATS[ext] || 'plaintext';
  return parse('```' + lang + '\n' + content + '\n```');
}

export function parse(markdown) {
  headingIds.clear();
  const raw = md.render(markdown);
  return DOMPurify.sanitize(raw, {
    ADD_TAGS: ['mark'],
    ADD_ATTR: ['id'],
  });
}

export function extractHeadings(markdown) {
  // Use a regex-based approach to avoid triggering the renderer's headingIds state
  const headings = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    // Strip inline markdown formatting from heading text
    const text = match[2]
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();
    headings.push({ level, text, id: slugify(text) });
  }
  // De-duplicate IDs (same logic as renderer)
  const seen = new Set();
  for (const h of headings) {
    let id = h.id;
    const base = id;
    let counter = 1;
    while (seen.has(id)) {
      id = `${base}-${counter++}`;
    }
    seen.add(id);
    h.id = id;
  }
  return headings;
}
