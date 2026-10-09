import { Globe } from "lucide-react";

const COLUMNS = [
  { title: "Support", links: ["Help Center", "AirCover", "Anti-discrimination", "Disability support", "Cancellation options"] },
  { title: "Hosting", links: ["Airbnb your home", "AirCover for Hosts", "Hosting resources", "Community forum", "Hosting responsibly"] },
  { title: "Airbnb", links: ["Newsroom", "New features", "Careers", "Investors", "Gift cards"] },
];

export function Footer() {
  return (
    <footer className="hidden border-t border-gray-200 bg-gray-50 md:block">
      <div className="mx-auto max-w-[1760px] px-10 py-12 xl:px-20">
        <div className="grid grid-cols-3 gap-8">
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <h3 className="mb-3 text-sm font-semibold">{c.title}</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                {c.links.map((l) => (
                  <li key={l}>
                    <span className="cursor-default hover:underline">{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-6 text-sm text-gray-700">
          <p>© 2026 Airbnb Clone · Built for a take-home assignment · Not affiliated with Airbnb, Inc.</p>
          <p className="flex items-center gap-4 font-semibold">
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4" /> English (US)
            </span>
            <span>$ USD</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
