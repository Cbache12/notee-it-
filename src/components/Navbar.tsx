import Link from "next/link";

const LINKS = [
  { href: "/diary", label: "Diary" },
  { href: "/foods", label: "Foods" },
  { href: "/recipes", label: "Recipes" },
  { href: "/weight", label: "Weight" },
  { href: "/goals", label: "Goals" },
  { href: "/plan", label: "Plan" },
];

export default function Navbar() {
  return (
    <header className="border-b border-slate-800">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/diary" className="font-semibold text-emerald-400">
          Calorie Tracker
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-slate-300 hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
