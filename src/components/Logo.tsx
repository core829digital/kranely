import Image from "next/image"
import Link from "next/link"

type LogoSize = "sm" | "md" | "lg"

const sizeMap: Record<LogoSize, { w: number; h: number }> = {
  sm: { w: 28, h: 28 },
  md: { w: 36, h: 36 },
  lg: { w: 48, h: 48 },
}

export function Logo({ size = "md" }: { size?: LogoSize }) {
  const dims = sizeMap[size]

  return (
    <Image
      src="/kranely-logo.png"
      alt="Kranely"
      width={dims.w}
      height={dims.h}
      className="object-contain"
      priority
    />
  )
}

export function LogoLink({ size = "md", href = "/dashboard" }: { size?: LogoSize; href?: string }) {
  return (
    <Link href={href}>
      <Logo size={size} />
    </Link>
  )
}
