import { money, plural } from "@/lib/format";
import type { PriceQuote } from "@/types";

export function PriceBreakdown({ quote, className }: { quote: PriceQuote; className?: string }) {
  return (
    <div className={className}>
      <dl className="space-y-3 text-gray-800">
        <div className="flex justify-between">
          <dt className="underline">
            {money(quote.nightly_price)} x {plural(quote.nights, "night")}
          </dt>
          <dd>{money(quote.subtotal)}</dd>
        </div>
        {quote.cleaning_fee > 0 && (
          <div className="flex justify-between">
            <dt className="underline">Cleaning fee</dt>
            <dd>{money(quote.cleaning_fee)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="underline">Airbnb service fee</dt>
          <dd>{money(quote.service_fee)}</dd>
        </div>
      </dl>
      <div className="mt-6 flex justify-between border-t border-gray-200 pt-6 font-semibold">
        <span>Total</span>
        <span>{money(quote.total_price)}</span>
      </div>
    </div>
  );
}
