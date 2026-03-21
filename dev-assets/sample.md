# MD Reader — Sample Document

Welcome to **MD Reader**, a beautiful markdown reader PWA. This sample document demonstrates all supported markdown features.

## Typography

This is a paragraph with **bold text**, *italic text*, ~~strikethrough~~, and `inline code`. Here's a [link to somewhere](https://example.com).

### Headings

You can use headings from H1 through H6. The table of contents on the left automatically generates from these headings and tracks your scroll position.

#### Fourth-Level Heading

##### Fifth-Level Heading

###### Sixth-Level Heading

## Lists

### Unordered List

- First item
- Second item
  - Nested item A
  - Nested item B
- Third item

### Ordered List

1. First step
2. Second step
3. Third step
   1. Sub-step A
   2. Sub-step B

### Task List

- [x] Set up project
- [x] Build landing screen
- [x] Build reader screen
- [ ] Add more features

## Blockquotes

> "The best way to predict the future is to invent it."
> — Alan Kay

> **Note:** Blockquotes can contain **formatted text** and even
>
> Multiple paragraphs.

## Code Blocks

### JavaScript

```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Generate first 10 fibonacci numbers
const fibs = Array.from({ length: 10 }, (_, i) => fibonacci(i));
console.log(fibs); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

### Python

```python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

print(quicksort([3, 6, 8, 10, 1, 2, 1]))
```

### Bash

```bash
#!/bin/bash
echo "Hello from MD Reader!"
for i in {1..5}; do
  echo "Iteration $i"
done
```

## Tables

| Feature | Status | Notes |
|---------|--------|-------|
| File upload | Done | Supports .md, .markdown, .txt |
| Paste markdown | Done | Textarea input |
| URL fetch | Done | With CORS handling |
| Dark mode | Done | System preference aware |
| Font themes | Done | Modern & Classic |
| TOC | Done | Scroll spy enabled |
| Search | Done | With navigation |
| Code highlighting | Done | 20+ languages |
| PWA | Done | Installable, offline-ready |

## Images

Images are rendered with max-width: 100% so they never overflow:

![Placeholder](https://via.placeholder.com/600x300/4f46e5/ffffff?text=MD+Reader)

## Horizontal Rule

Content above the rule.

---

Content below the rule.

## Long Code Block (Scrollable)

```json
{
  "name": "mdreader",
  "version": "1.0.0",
  "description": "A beautiful, offline-capable Markdown reader PWA",
  "features": {
    "file_input": true,
    "paste_input": true,
    "url_input": true,
    "dark_mode": true,
    "font_themes": ["modern", "classic"],
    "toc": true,
    "search": true,
    "code_highlighting": true,
    "pwa": true,
    "recent_files": true
  }
}
```

## Conclusion

That's a tour of MD Reader's capabilities. Try switching between **light/dark mode** and **Modern/Classic font themes** using the buttons in the top bar. Use **Ctrl+F** to search within the document.
