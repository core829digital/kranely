"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef((/** @type {any} */ { className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // z-[200] ensures the overlay sits above the sidebar (z-[145]) and any other
      // fixed UI so the entire screen — including the sidebar — dims when a dialog opens.
      "fixed inset-0 z-[200] bg-black/75 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props} />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef((/** @type {any} */ { className, children, style, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // z-[201]: above the overlay (z-[200]) and the sidebar (z-[145]).
        // left-[50%]: CSS fallback only — overridden by the sidebar-aware inline style below.
        // max-h-[80dvh] + overflow-y-auto: sensible height defaults, overridable by
        //   consumer via their own max-h-* class (Tailwind last-class-wins).
        "fixed left-[50%] z-[201] grid w-full max-w-lg max-h-[80dvh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      style={{
        // Horizontal: center in the *visible* content area (viewport minus sidebar
        // minus the classic scrollbar gutter on Windows).
        //
        // Problem: 100vw includes the body scrollbar width (≈15px on Windows).
        // Without the correction the dialog sits ~7–8px to the right of visual centre.
        //
        // --sidebar-w   : set by VerticalMenu (0px mobile, 80/280px desktop)
        // --scrollbar-w : set by VerticalMenu = window.innerWidth − clientWidth
        //                 (≈15px on Windows with classic scrollbars, 0 on Mac overlay)
        //                 Cached before the dialog opens; not updated while body is locked.
        //
        // Formula: sidebar_w + (visibleViewport - sidebar_w) / 2
        //   where visibleViewport = 100vw - scrollbar_w
        // The translateX(-50%) from the Tailwind class still applies.
        left: 'calc(var(--sidebar-w, 0px) + (100vw - var(--sidebar-w, 0px) - var(--scrollbar-w, 0px)) / 2)',
        // Vertical: shift centre down by half the fixed navbar height so the dialog
        // sits symmetrically in the visible content area below the header.
        top: 'calc(50% + var(--private-header-h, 0px) / 2)',
        // Width: respect content-area width — 1rem gutter on each side minimum.
        // Consumer can override by passing style={{ maxWidth: '…' }}
        maxWidth: 'min(calc(100vw - var(--sidebar-w, 0px) - var(--scrollbar-w, 0px) - 2rem), 40rem)',
        // scrollbar-gutter: stable — reserves the scrollbar track space on the
        // inline-end (right) side at all times.  Without this, when the dialog
        // content is tall enough to trigger overflow-y:auto, the OS scrollbar
        // (~15px on Windows) physically overlaps the right p-6 padding, making
        // the right margin appear to vanish.  With `stable` the gutter is always
        // present so p-6 stays symmetric whether or not a scrollbar is rendered.
        scrollbarGutter: 'stable',
        // Consumer style always wins (spread last).
        ...style,
      }}
      {...props}>
      {children}
      <DialogPrimitive.Close
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = (/** @type {any} */ {
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = (/** @type {any} */ {
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef((/** @type {any} */ { className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef((/** @type {any} */ { className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
