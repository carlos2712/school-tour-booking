import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex flex-col">
          <span className="text-gold font-bold text-xl tracking-wide uppercase">
            American Stage
          </span>
          <span className="text-gray-600 text-xs tracking-widest uppercase">
            School Tour
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="https://www.americanstage.org"
            target="_blank"
            className="text-gray-600 hover:text-gold transition-colors"
          >
            Main Site
          </Link>
          <Link
            href="https://www.americanstage.org/education"
            target="_blank"
            className="text-gray-600 hover:text-gold transition-colors"
          >
            Education
          </Link>
        </nav>
      </div>
    </header>
  );
}
