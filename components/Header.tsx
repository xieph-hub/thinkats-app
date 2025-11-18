// components/Header.tsx (or whatever your header file is)
import Logo from "@/components/Logo";

export default function Header() {
  return (
    <header className="border-b border-neutral-100 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:py-4">
        <div className="shrink-0">
          <Logo size="md" />
        </div>

        {/* ...rest of your nav... */}
      </div>
    </header>
  );
}
