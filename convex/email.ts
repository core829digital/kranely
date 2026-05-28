import { v } from "convex/values"
import { internalAction } from "./_generated/server"

const FROM_EMAIL = "Kranely <noreply@kranely.app>"

export const sendPasswordReset = internalAction({
  args: { email: v.string(), token: v.string() },
  handler: async (_, args) => {
    const { Resend } = await import("resend")
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return

    const resend = new Resend(apiKey)
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${args.token}`

    await resend.emails.send({
      from: FROM_EMAIL,
      to: args.email,
      subject: "Recupero password - Kranely",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#1C1A18;color:#fff;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="width:40px;height:40px;background:#FFC703;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-weight:bold;font-size:20px;color:#1C1A18;">K</div>
          </div>
          <h1 style="font-size:20px;margin:0 0 12px;">Recupero password</h1>
          <p style="color:#aaa;margin:0 0 20px;line-height:1.5;">Hai richiesto il reset della password. Clicca il pulsante qui sotto per impostarne una nuova.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#FFC703;color:#1C1A18;text-decoration:none;font-weight:600;border-radius:8px;">Reimposta password</a>
          <p style="color:#666;font-size:12px;margin-top:20px;">Se non hai richiesto il reset, ignora questa email. Il link scade tra 1 ora.</p>
        </div>
      `,
    })
  },
})

export const sendOnboarding = internalAction({
  args: { email: v.string(), fullName: v.string(), organizationName: v.string() },
  handler: async (_, args) => {
    const { Resend } = await import("resend")
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return

    const resend = new Resend(apiKey)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    await resend.emails.send({
      from: FROM_EMAIL,
      to: args.email,
      subject: "Benvenuto su Kranely!",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#1C1A18;color:#fff;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="width:40px;height:40px;background:#FFC703;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-weight:bold;font-size:20px;color:#1C1A18;">K</div>
          </div>
          <h1 style="font-size:20px;margin:0 0 8px;">Benvenuto, ${args.fullName}!</h1>
          <p style="color:#aaa;margin:0 0 16px;line-height:1.5;">La tua organizzazione <strong style="color:#fff;">${args.organizationName}</strong> è stata creata con successo.</p>
          <p style="color:#aaa;margin:0 0 20px;line-height:1.5;">Accedi per iniziare a gestire cantieri, preventivi, collaboratori e molto altro.</p>
          <a href="${appUrl}/sign-in" style="display:inline-block;padding:12px 24px;background:#FFC703;color:#1C1A18;text-decoration:none;font-weight:600;border-radius:8px;">Accedi ora</a>
        </div>
      `,
    })
  },
})

export const sendNotification = internalAction({
  args: { email: v.string(), subject: v.string(), htmlBody: v.string() },
  handler: async (_, args) => {
    const { Resend } = await import("resend")
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return

    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: FROM_EMAIL,
      to: args.email,
      subject: args.subject,
      html: args.htmlBody,
    })
  },
})
