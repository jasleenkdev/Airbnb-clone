import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="text-6xl font-bold text-brand">Oops!</h1>
      <p className="mt-4 text-xl">We can&apos;t seem to find the page you&apos;re looking for.</p>
      <Link href="/" className="mt-8 inline-block rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white">
        Go home
      </Link>
    </div>
  );
}
