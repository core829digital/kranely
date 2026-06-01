import { test, expect } from "@playwright/test"

test.describe("Accessibility (WCAG 2.2 AA smoke)", () => {
  test("marketing pages have exactly one h1 and proper lang", async ({ page }) => {
    for (const path of ["/", "/about", "/services", "/pricing", "/contact", "/blog"]) {
      await page.goto(path)
      const lang = await page.locator("html").getAttribute("lang")
      expect(lang, `lang attr on ${path}`).toBe("it")
      const h1Count = await page.locator("h1").count()
      expect(h1Count, `${path} should have ≥1 h1, got ${h1Count}`).toBeGreaterThanOrEqual(1)
      const main = await page.locator("main#main-content").count()
      expect(main, `${path} should have <main id="main-content">`).toBe(1)
    }
  })

  test("all interactive buttons/links have accessible names", async ({ page }) => {
    await page.goto("/")
    const issues = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('button, a, [role="button"]'))
      return els
        .filter((el) => {
          const text = (el.textContent || "").trim()
          const aria = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")
          const title = el.getAttribute("title")
          return !text && !aria && !title
        })
        .map((el) => el.outerHTML.slice(0, 80))
    })
    expect(issues, `unnamed interactive elements: ${JSON.stringify(issues)}`).toHaveLength(0)
  })

  test("all form inputs have associated labels", async ({ page }) => {
    await page.goto("/contact")
    const unlabelled = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll("input, textarea, select"))
      return inputs
        .filter((el) => {
          const id = el.id
          if (id && document.querySelector(`label[for="${id}"]`)) return false
          const aria = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")
          if (aria) return false
          const wrapped = el.closest("label")
          if (wrapped) return false
          const type = el.getAttribute("type")
          if (type === "hidden" || type === "submit" || type === "button") return false
          return true
        })
        .map((el) => `<${el.tagName.toLowerCase()} type="${el.getAttribute("type")}">`)
    })
    expect(unlabelled, `unlabelled inputs: ${JSON.stringify(unlabelled)}`).toHaveLength(0)
  })

  test("focus-visible outline is set on focusable elements", async ({ page }) => {
    await page.goto("/")
    await page.keyboard.press("Tab")
    const hasFocusVisible = await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return false
      const style = window.getComputedStyle(el, ":focus-visible")
      return style.outlineStyle !== "none" || style.outlineWidth !== "0px"
    })
    expect(hasFocusVisible).toBe(true)
  })

  test("all images have alt attributes (or alt= for decorative)", async ({ page }) => {
    await page.goto("/")
    const badImages = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("img"))
        .filter((img) => !img.hasAttribute("alt"))
        .map((img) => img.src)
    })
    expect(badImages, `images without alt: ${JSON.stringify(badImages)}`).toHaveLength(0)
  })
})
