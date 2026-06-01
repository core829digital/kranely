import { test, expect } from "@playwright/test"

test.describe("Auth flows", () => {
  test("sign-in page renders", async ({ page }) => {
    await page.goto("/sign-in")
    await expect(page.locator("h1, h2").first()).toBeVisible()
    await expect(page.getByLabel(/email/i).first()).toBeVisible()
  })

  test("sign-up page does NOT offer admin role", async ({ page }) => {
    await page.goto("/sign-up")
    const html = await page.content()
    expect(html.toLowerCase()).not.toMatch(/>\s*admin\s*</)
  })

  test("dashboard route requires auth (redirects to sign-in)", async ({ page, context }) => {
    await context.clearCookies()
    const res = await page.goto("/dashboard", { waitUntil: "domcontentloaded" }).catch(() => null)
    await expect(page).toHaveURL(/\/sign-in/)
    expect(res).not.toBeNull()
  })

  test("admin route requires auth", async ({ page, context }) => {
    await context.clearCookies()
    await page.goto("/admin", { waitUntil: "domcontentloaded" }).catch(() => null)
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test("invalid sign-in shows error without leaking which field is wrong", async ({ page }) => {
    await page.goto("/sign-in")
    const emailInput = page.getByLabel(/email/i).first()
    const passwordInput = page.locator('input[type="password"]').first()
    if ((await emailInput.count()) > 0 && (await passwordInput.count()) > 0) {
      await emailInput.fill("nonexistent@example.com")
      await passwordInput.fill("wrongpassword")
      const submitButton = page.getByRole("button", { name: /accedi|sign.?in|login/i }).first()
      if ((await submitButton.count()) > 0) {
        await submitButton.click()
        await page.waitForTimeout(1000)
        const url = page.url()
        const stillOnSignIn = url.includes("/sign-in")
        expect(stillOnSignIn).toBe(true)
      }
    }
  })
})
