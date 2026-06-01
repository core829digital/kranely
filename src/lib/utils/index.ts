import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false
  const trimmed = url.trim().toLowerCase()
  if (trimmed.startsWith("javascript:")) return false
  if (trimmed.startsWith("data:")) return false
  if (trimmed.startsWith("vbscript:")) return false
  if (trimmed.startsWith("file:")) return false
  return true
}

export function safeWindowOpen(url: string | null | undefined, target = "_blank"): void {
  if (!isSafeUrl(url) || !url) return
  window.open(url, target, "noopener,noreferrer")
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

export function generateSupplierCode(): string {
  return `KRN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

export function generateToken(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
