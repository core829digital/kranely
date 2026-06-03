import { v } from "convex/values"
import { mutation, internalMutation, internalQuery, httpAction } from "./_generated/server"
import { internal } from "./_generated/api"
import { assertOrgAccess } from "./auth"

export const createPaymentCheckoutSession = mutation({
  args: {
    organizationId: v.id("organizations"),
    paymentId: v.id("payments"),
    returnUrl: v.string(),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const payment = await ctx.db.get(args.paymentId)
    if (!payment || payment.organizationId !== args.organizationId) throw new Error("Pagamento non trovato")
    if (payment.status === "pagato") throw new Error("Pagamento già saldato")

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY non configurata")

    const Stripe = (await import("stripe")).default
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-02-24.acacia" } as any)

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: { name: payment.description || `Pagamento #${payment._id.slice(-6)}` },
          unit_amount: Math.round(payment.amount * 100),
        },
        quantity: 1,
      }],
      success_url: `${args.returnUrl}?payment_ok=1`,
      cancel_url: `${args.returnUrl}?payment_cancel=1`,
      metadata: {
        organizationId: args.organizationId,
        paymentId: args.paymentId,
        type: "payment",
      },
    })

    if (!session.url) throw new Error("Impossibile creare la sessione di pagamento")
    return { url: session.url }
  },
})

export const createCheckoutSession = mutation({
  args: {
    organizationId: v.id("organizations"),
    plan: v.union(v.literal("pro"), v.literal("enterprise")),
    email: v.string(),
    returnUrl: v.string(),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertOrgAccess(ctx, args.userEmail, args.organizationId)
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .first()
    if (existing && existing.plan !== "free") {
      throw new Error("Abbonamento già attivo")
    }

    const priceIds: Record<string, string> = {
      pro: "price_pro_monthly",
      enterprise: "price_enterprise_monthly",
    }
    const priceId = priceIds[args.plan]
    if (!priceId) throw new Error("Piano non valido")

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY non configurata")

    const Stripe = (await import("stripe")).default
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-02-24.acacia" } as any)

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: args.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${args.returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${args.returnUrl}`,
      metadata: {
        organizationId: args.organizationId,
        plan: args.plan,
      },
    })

    if (!session.url) throw new Error("Impossibile creare la sessione di pagamento")

    await ctx.db.insert("subscriptions", {
      organizationId: args.organizationId,
      plan: args.plan,
      status: "trialing",
      stripeSubscriptionId: session.id,
      stripePriceId: priceId,
    })

    return { url: session.url }
  },
})

export const handleSubscriptionEvent = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    status: v.union(v.literal("active"), v.literal("past_due"), v.literal("canceled"), v.literal("trialing")),
    currentPeriodStart: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.string()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    stripeCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripePriceId: args.stripePriceId,
        plan: args.plan,
        status: args.status,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      })
    } else {
      await ctx.db.insert("subscriptions", {
        organizationId: args.organizationId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripePriceId: args.stripePriceId,
        plan: args.plan,
        status: args.status,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      })
    }

    const org = await ctx.db.get(args.organizationId)
    if (org) {
      await ctx.db.patch(args.organizationId, {
        plan: args.plan,
        ...(args.stripeCustomerId ? { stripeCustomerId: args.stripeCustomerId } : {}),
      })
    }
  },
})

export const handlePaymentCheckoutCompleted = mutation({
  args: {
    organizationId: v.id("organizations"),
    paymentId: v.id("payments"),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.paymentId)
    if (!payment || payment.status === "pagato") return
    await ctx.db.patch(args.paymentId, {
      status: "pagato",
      paidDate: new Date().toISOString().split("T")[0],
      method: "online",
    })
    await ctx.db.insert("activityLog", {
      organizationId: args.organizationId,
      userEmail: "system",
      action: "updated",
      entityType: "payment",
      entityId: args.paymentId,
      entityName: payment.description,
      details: `Pagamento "${payment.description}" saldato via Stripe`,
    })
  },
})

export const checkStripeEvent = internalQuery({
  args: { stripeEventId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stripeEvents")
      .withIndex("by_stripeEventId", (q) => q.eq("stripeEventId", args.stripeEventId))
      .first()
  },
})

export const upsertStripeEvent = internalMutation({
  args: {
    stripeEventId: v.string(),
    processed: v.boolean(),
    processedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("stripeEvents")
      .withIndex("by_stripeEventId", (q) => q.eq("stripeEventId", args.stripeEventId))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, {
        processed: args.processed,
        processedAt: args.processedAt,
      })
    } else {
      await ctx.db.insert("stripeEvents", {
        stripeEventId: args.stripeEventId,
        processed: args.processed,
        processedAt: args.processedAt,
      })
    }
  },
})

export const stripeWebhook = httpAction(async (ctx, request) => {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")
  if (!signature) return new Response("Signature mancante", { status: 400 })

  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripeKey || !webhookSecret) return new Response("Config mancante", { status: 500 })

  const StripeClass = (await import("stripe")).default
  const stripe = new StripeClass(stripeKey, { apiVersion: "2025-02-24.acacia" } as any)

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return new Response("Firma non valida", { status: 400 })
  }

  const stripeEventId = event.id

  const existingEvent = await ctx.runQuery(internal.stripe.checkStripeEvent, { stripeEventId })
  if (existingEvent?.processed) {
    return new Response(JSON.stringify({ success: true, idempotent: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (!existingEvent) {
    await ctx.runMutation(internal.stripe.upsertStripeEvent, {
      stripeEventId,
      processed: false,
    })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any
      const orgId = session.metadata?.organizationId
      const plan = session.metadata?.plan as "pro" | "enterprise"
      if (!orgId || !plan) return new Response("Metadata mancanti", { status: 400 })

      const sub = session.subscription
      let subDetails: any = {}
      if (sub) {
        const subscription: any = await stripe.subscriptions.retrieve(sub)
        subDetails = {
          currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          stripePriceId: subscription.items?.data[0]?.price?.id,
        }
      }

      await ctx.runMutation(internal.stripe.handleSubscriptionEvent, {
        organizationId: orgId as any,
        stripeSubscriptionId: sub as string || session.id,
        plan,
        status: "active",
        stripeCustomerId: session.customer,
        ...subDetails,
      })
      break
    }

    case "invoice.payment_succeeded":
    case "invoice.payment_failed": {
      const invoice = event.data.object as any
      const subId = invoice.subscription
      if (!subId) return new Response("No subscription", { status: 200 })
      const subData: any = await stripe.subscriptions.retrieve(subId)
      const orgId2 = subData.metadata?.organizationId
      if (!orgId2) return new Response("No org", { status: 200 })

      await ctx.runMutation(internal.stripe.handleSubscriptionEvent, {
        organizationId: orgId2 as any,
        stripeSubscriptionId: subId,
        plan: (subData.metadata?.plan as "pro" | "enterprise") || "pro",
        status: event.type === "invoice.payment_succeeded" ? "active" : "past_due",
        currentPeriodStart: new Date(subData.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subData.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subData.cancel_at_period_end,
        stripePriceId: subData.items?.data[0]?.price?.id,
      })
      break
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as any
      const statusMap: Record<string, "active" | "past_due" | "canceled"> = {
        active: "active",
        past_due: "past_due",
        canceled: "canceled",
        incomplete_expired: "canceled",
        unpaid: "past_due",
      }
      const orgId3 = subscription.metadata?.organizationId
      if (!orgId3) return new Response("No org", { status: 200 })

      const newStatus = statusMap[subscription.status] || "canceled"

      await ctx.runMutation(internal.stripe.handleSubscriptionEvent, {
        organizationId: orgId3 as any,
        stripeSubscriptionId: subscription.id,
        plan: (subscription.metadata?.plan as "pro" | "enterprise") || "pro",
        status: newStatus,
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        stripePriceId: subscription.items?.data?.[0]?.price?.id,
      })
      break
    }
  }

  await ctx.runMutation(internal.stripe.upsertStripeEvent, {
    stripeEventId,
    processed: true,
    processedAt: Date.now(),
  })

  return new Response(null, { status: 200 })
})
