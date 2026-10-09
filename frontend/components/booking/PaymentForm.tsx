"use client";

import { CreditCard, Lock } from "lucide-react";

import { cn } from "@/lib/cn";

export interface PaymentDetails {
  cardNumber: string;
  expiry: string;
  cvv: string;
  zip: string;
  country: string;
}

export const EMPTY_PAYMENT: PaymentDetails = { cardNumber: "", expiry: "", cvv: "", zip: "", country: "India" };
export const TEST_CARD: PaymentDetails = { cardNumber: "4242 4242 4242 4242", expiry: "12/30", cvv: "123", zip: "560001", country: "India" };

const digits = (s: string) => s.replace(/\D/g, "");

/** Client-side format validation only. No payment is processed anywhere. */
export function validatePayment(p: PaymentDetails): Partial<Record<keyof PaymentDetails, string>> {
  const errors: Partial<Record<keyof PaymentDetails, string>> = {};
  const num = digits(p.cardNumber);
  if (num.length < 13 || num.length > 19) errors.cardNumber = "Enter a valid card number.";
  const m = p.expiry.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) errors.expiry = "Use MM/YY.";
  else {
    const month = Number(m[1]);
    const year = 2000 + Number(m[2]);
    const now = new Date();
    if (month < 1 || month > 12) errors.expiry = "Invalid month.";
    else if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1))
      errors.expiry = "This card has expired.";
  }
  if (!/^\d{3,4}$/.test(p.cvv)) errors.cvv = "3 or 4 digits.";
  if (p.zip.trim().length < 3) errors.zip = "Enter a ZIP / postal code.";
  return errors;
}

export function PaymentForm({
  value,
  onChange,
  errors,
}: {
  value: PaymentDetails;
  onChange: (v: PaymentDetails) => void;
  errors: Partial<Record<keyof PaymentDetails, string>>;
}) {
  const set = (patch: Partial<PaymentDetails>) => onChange({ ...value, ...patch });
  const field = (hasError?: string) =>
    cn("w-full bg-transparent px-3 pt-6 pb-2 outline-none", hasError && "placeholder:text-red-300");
  const label = "pointer-events-none absolute top-2 left-3 text-xs text-gray-500";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <CreditCard className="h-5 w-5" /> Credit or debit card
        </div>
        <button type="button" className="text-sm font-semibold underline" onClick={() => onChange(TEST_CARD)}>
          Use test card
        </button>
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-400">
        <label className={cn("relative block border-b border-gray-400", errors.cardNumber && "bg-red-50")}>
          <span className={label}>Card number</span>
          <input
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="0000 0000 0000 0000"
            value={value.cardNumber}
            onChange={(e) =>
              set({
                cardNumber: digits(e.target.value)
                  .slice(0, 19)
                  .replace(/(\d{4})(?=\d)/g, "$1 "),
              })
            }
            className={field(errors.cardNumber)}
          />
          <Lock className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </label>
        <div className="grid grid-cols-2">
          <label className={cn("relative block border-r border-gray-400", errors.expiry && "bg-red-50")}>
            <span className={label}>Expiration</span>
            <input
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              value={value.expiry}
              onChange={(e) => {
                const d = digits(e.target.value).slice(0, 4);
                set({ expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d });
              }}
              className={field(errors.expiry)}
            />
          </label>
          <label className={cn("relative block", errors.cvv && "bg-red-50")}>
            <span className={label}>CVV</span>
            <input
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              value={value.cvv}
              onChange={(e) => set({ cvv: digits(e.target.value).slice(0, 4) })}
              className={field(errors.cvv)}
            />
          </label>
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-gray-400">
        <label className={cn("relative block border-b border-gray-400", errors.zip && "bg-red-50")}>
          <span className={label}>ZIP code</span>
          <input
            autoComplete="postal-code"
            value={value.zip}
            onChange={(e) => set({ zip: e.target.value.slice(0, 10) })}
            className={field(errors.zip)}
          />
        </label>
        <label className="relative block">
          <span className={label}>Country/region</span>
          <select
            value={value.country}
            onChange={(e) => set({ country: e.target.value })}
            className="w-full appearance-none bg-transparent px-3 pt-6 pb-2 outline-none"
          >
            {["India", "United States", "United Kingdom", "Germany", "France", "Japan", "Australia", "Canada"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      {Object.values(errors).some(Boolean) && (
        <ul className="mt-3 space-y-1 text-sm text-red-600" role="alert">
          {Object.entries(errors).map(([k, msg]) => msg && <li key={k}>{msg}</li>)}
        </ul>
      )}
      <p className="mt-3 text-xs text-gray-500">Demo checkout: card details never leave your browser and nothing is charged.</p>
    </div>
  );
}
