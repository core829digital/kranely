# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> Accessibility (WCAG 2.2 AA smoke) >> marketing pages have exactly one h1 and proper lang
- Location: e2e\a11y.spec.ts:4:7

# Error details

```
Error: /blog should have ≥1 h1, got 0

expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 1
Received:    0
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Salta al contenuto principale" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - alert [ref=e3]
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test"
  2  | 
  3  | test.describe("Accessibility (WCAG 2.2 AA smoke)", () => {
  4  |   test("marketing pages have exactly one h1 and proper lang", async ({ page }) => {
  5  |     for (const path of ["/", "/about", "/services", "/pricing", "/contact", "/blog"]) {
  6  |       await page.goto(path)
  7  |       const lang = await page.locator("html").getAttribute("lang")
  8  |       expect(lang, `lang attr on ${path}`).toBe("it")
  9  |       const h1Count = await page.locator("h1").count()
> 10 |       expect(h1Count, `${path} should have ≥1 h1, got ${h1Count}`).toBeGreaterThanOrEqual(1)
     |                                                                    ^ Error: /blog should have ≥1 h1, got 0
  11 |       const main = await page.locator("main#main-content").count()
  12 |       expect(main, `${path} should have <main id="main-content">`).toBe(1)
  13 |     }
  14 |   })
  15 | 
  16 |   test("all interactive buttons/links have accessible names", async ({ page }) => {
  17 |     await page.goto("/")
  18 |     const issues = await page.evaluate(() => {
  19 |       const els = Array.from(document.querySelectorAll('button, a, [role="button"]'))
  20 |       return els
  21 |         .filter((el) => {
  22 |           const text = (el.textContent || "").trim()
  23 |           const aria = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")
  24 |           const title = el.getAttribute("title")
  25 |           return !text && !aria && !title
  26 |         })
  27 |         .map((el) => el.outerHTML.slice(0, 80))
  28 |     })
  29 |     expect(issues, `unnamed interactive elements: ${JSON.stringify(issues)}`).toHaveLength(0)
  30 |   })
  31 | 
  32 |   test("all form inputs have associated labels", async ({ page }) => {
  33 |     await page.goto("/contact")
  34 |     const unlabelled = await page.evaluate(() => {
  35 |       const inputs = Array.from(document.querySelectorAll("input, textarea, select"))
  36 |       return inputs
  37 |         .filter((el) => {
  38 |           const id = el.id
  39 |           if (id && document.querySelector(`label[for="${id}"]`)) return false
  40 |           const aria = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")
  41 |           if (aria) return false
  42 |           const wrapped = el.closest("label")
  43 |           if (wrapped) return false
  44 |           const type = el.getAttribute("type")
  45 |           if (type === "hidden" || type === "submit" || type === "button") return false
  46 |           return true
  47 |         })
  48 |         .map((el) => `<${el.tagName.toLowerCase()} type="${el.getAttribute("type")}">`)
  49 |     })
  50 |     expect(unlabelled, `unlabelled inputs: ${JSON.stringify(unlabelled)}`).toHaveLength(0)
  51 |   })
  52 | 
  53 |   test("focus-visible outline is set on focusable elements", async ({ page }) => {
  54 |     await page.goto("/")
  55 |     await page.keyboard.press("Tab")
  56 |     const hasFocusVisible = await page.evaluate(() => {
  57 |       const el = document.activeElement
  58 |       if (!el) return false
  59 |       const style = window.getComputedStyle(el, ":focus-visible")
  60 |       return style.outlineStyle !== "none" || style.outlineWidth !== "0px"
  61 |     })
  62 |     expect(hasFocusVisible).toBe(true)
  63 |   })
  64 | 
  65 |   test("all images have alt attributes (or alt= for decorative)", async ({ page }) => {
  66 |     await page.goto("/")
  67 |     const badImages = await page.evaluate(() => {
  68 |       return Array.from(document.querySelectorAll("img"))
  69 |         .filter((img) => !img.hasAttribute("alt"))
  70 |         .map((img) => img.src)
  71 |     })
  72 |     expect(badImages, `images without alt: ${JSON.stringify(badImages)}`).toHaveLength(0)
  73 |   })
  74 | })
  75 | 
```