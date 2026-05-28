import Image from "next/image"
import Link from "next/link"

type LogoSize = "sm" | "md" | "lg"

const sizeMap: Record<LogoSize, { w: number; h: number }> = {
  sm: { w: 28, h: 28 },
  md: { w: 36, h: 36 },
  lg: { w: 48, h: 48 },
}

export function Logo({ size = "md", showText = true }: { size?: LogoSize; showText?: boolean }) {
  const dims = sizeMap[size]

  return (
    <div className="flex items-center gap-2">
      <Image
        src="/kranely-logo.png"
        alt="Kranely"
        width={dims.w}
        height={dims.h}
        className="object-contain"
        priority
      />
      {showText && (
        <span className="text-white font-semibold" style={{ fontSize: size === "lg" ? "1.25rem" : size === "md" ? "1rem" : "0.875rem" }}>
          Kranely
        </span>
      )}
    </div>
  )
}

export function LogoLink({ size = "md", showText = true, href = "/dashboard" }: { size?: LogoSize; showText?: boolean; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <Logo size={size} showText={showText} />
    </Link>
  )
}
