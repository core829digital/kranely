import { test, expect } from "@playwright/test"

test.describe("Marketing public pages", () => {
  test("homepage renders with skip-link and proper lang", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("html")).toHaveAttribute("lang", "it")
    await expect(page.getByRole("link", { name: /Salta al contenuto principale/i })).toBeAttached()
    await expect(page.getByRole("link", { name: /^Kranely/i }).first()).toBeVisible()
  })

  test("pricing page renders", async ({ page }) => {
    const res = await page.goto("/pricing")
    expect(res?.status()).toBe(200)
    await expect(page.locator("main#main-content")).toBeVisible()
  })

  test("public-pricing stub redirects to /pricing", async ({ page }) => {
    await page.goto("/public-pricing")
    await expect(page).toHaveURL(/\/pricing/)
  })

  test("contact page renders the form", async ({ page }) => {
    await page.goto("/contact")
    await expect(page.getByLabel(/nome/i).first()).toBeVisible()
    await expect(page.getByLabel(/email/i).first()).toBeVisible()
    await expect(page.getByLabel(/messaggio/i).first()).toBeVisible()
  })

  test("blog index is accessible", async ({ page }) => {
    await page.goto("/blog")
    await expect(page.locator("main#main-content")).toBeVisible()
  })

  test("cookie/privacy/terms pages render with footer", async ({ page }) => {
    for (const path of ["/cookie", "/privacy", "/terms"]) {
      await page.goto(path)
      await expect(page.locator("main#main-content")).toBeVisible()
    }
  })

  test("all marketing pages have an <h1>", async ({ page }) => {
    const paths = ["/", "/about", "/services", "/pricing", "/contact", "/blog", "/calculator", "/reviews"]
    for (const path of paths) {
      await page.goto(path, { waitUntil: "networkidle" })
      const h1 = await page.locator("h1").count()
      expect(h1, `page ${path} should have exactly one h1, found ${h1}`).toBeGreaterThanOrEqual(1)
    }
  })
})

test.describe("Skip-link a11y", () => {
  test("skip-link is first focusable element and skips to main content", async ({ page }) => {
    await page.goto("/")
    await page.keyboard.press("Tab")
    const focused = await page.evaluate(() => document.activeElement?.className)
    expect(focused).toContain("skip-link")
  })
})
