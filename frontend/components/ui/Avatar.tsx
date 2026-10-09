import { cn } from "@/lib/cn";

export function Avatar({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={cn("rounded-full object-cover", className)} />;
  }
  return (
    <span
      className={cn("flex items-center justify-center rounded-full bg-gray-800 font-semibold text-white", className)}
      aria-label={name}
    >
      {name.charAt(0)}
    </span>
  );
}
