import { Construction } from "lucide-react";
import Link from "next/link";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <Construction className="h-8 w-8 text-gray-700" />
      </div>
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-3 text-gray-600">{description}</p>
      <span className="mt-4 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold tracking-wide text-gray-700 uppercase">
        Coming soon
      </span>
      <Link href="/" className="mt-8 rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white hover:bg-black">
        Keep exploring
      </Link>
    </div>
  );
}
