// components/Logo.tsx
import Link from "next/link";
import Image from "next/image";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
};

const SIZE_MAP: Record<NonNullable<LogoProps["size"]>, number> = {
  sm: 24,
  md: 28,
  lg: 32,
};

export default function Logo({
  size = "md",
  showWordmark = true,
}: LogoProps) {
  const dimension = SIZE_MAP[size];

  return (
    <Link
      href="/"
      className="flex items-center gap-2 text-[#000435]"
      aria-label="Resourcin home"
    >
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white sm:h-10 sm:w-10">
        {/* IMPORTANT: logo file must be at public/logo.svg */}
        <Image
          src="/logo.svg"
          alt="Resourcin"
          width={dimension}
          height={dimension}
          className="h-auto w-auto"
          priority
        />
      </div>

      {showWordmark && (
        <span className="hidden text-[15px] font-semibold tracking-tight text-[#000435] sm:inline-block">
          Resourcin
        </span>
      )}
    </Link>
  );
}
