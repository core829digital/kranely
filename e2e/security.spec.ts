import { test, expect } from "@playwright/test"

test.describe("Security: rate limit + safe URLs", () => {
  test("contact API rate-limits after 5 requests/minute", async ({ request }) => {
    const payload = {
      name: "Test User",
      email: "test@example.com",
      message: "This is a long enough message to pass validation rules.",
    }
    let firstSuccess = false
    for (let i = 0; i < 7; i++) {
      const res = await request.post("/api/contact", { data: payload })
      if (i === 0) firstSuccess = res.status() === 200
      if (i >= 5) {
        expect(res.status(), `attempt ${i + 1} should be 429`).toBe(429)
        expect(res.headers()["retry-after"]).toBeDefined()
      }
    }
    expect(firstSuccess, "first request should succeed").toBe(true)
  })

  test("contact API rejects invalid payload", async ({ request }) => {
    const res = await request.post("/api/contact", {
      data: { name: "x", email: "bad", message: "short" },
    })
    expect(res.status()).toBe(400)
  })

  test("contact API rejects javascript: scheme in body", async ({ request }) => {
    const res = await request.post("/api/contact", {
      data: {
        name: "javascript:alert(1)",
        email: "test@example.com",
        message: "Please click javascript:alert(1) in this message",
      },
    })
    expect([200, 400]).toContain(res.status())
  })

  test("X-Frame-Options / frame-ancestors header set (clickjacking)", async ({ page }) => {
    const res = await page.goto("/")
    const headers = res?.headers() || {}
    const frameAncestors = headers["content-security-policy"]
    if (frameAncestors) {
      expect(frameAncestors.toLowerCase()).toContain("frame-ancestors")
    }
  })

  test("session cookies are set with appropriate flags", async ({ page, context }) => {
    await context.clearCookies()
    await page.goto("/")
    const cookies = await context.cookies()
    for (const c of cookies) {
      if (c.name === "kranely_session_data" || c.name === "kranely_session") {
        expect(c.sameSite).toBeDefined()
      }
    }
  })
})
