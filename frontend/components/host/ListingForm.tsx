"use client";

import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, MapPin, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { LocationPicker } from "@/components/host/pickers";
import { Button } from "@/components/ui/Button";
import { Counter } from "@/components/ui/Counter";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { money, plural, PROPERTY_TYPE_LABELS } from "@/lib/format";
import { Icon } from "@/lib/icons";
import type { Amenity, Category, ListingDetail, ListingInput, PropertyType } from "@/types";

const STEPS = ["Basics", "Location", "Amenities", "Photos", "Price", "Review"] as const;
type Step = (typeof STEPS)[number];

export const EMPTY_LISTING: ListingInput = {
  title: "",
  description: "",
  property_type: "house",
  category: "trending",
  city: "",
  state: "",
  country: "",
  address: "",
  latitude: 20.5937,
  longitude: 78.9629,
  price_per_night: 100,
  cleaning_fee: 25,
  service_fee_pct: 14,
  max_guests: 2,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  amenity_ids: [],
  image_urls: [],
};

export function listingToInput(l: ListingDetail): ListingInput {
  return {
    title: l.title,
    description: l.description,
    property_type: l.property_type,
    category: l.category,
    city: l.city,
    state: l.state ?? "",
    country: l.country,
    address: l.address,
    latitude: l.latitude,
    longitude: l.longitude,
    price_per_night: l.price_per_night,
    cleaning_fee: l.cleaning_fee,
    service_fee_pct: l.service_fee_pct,
    max_guests: l.max_guests,
    bedrooms: l.bedrooms,
    beds: l.beds,
    bathrooms: l.bathrooms,
    amenity_ids: l.amenities.map((a) => a.id),
    image_urls: l.images.map((i) => i.url),
  };
}

function validateStep(step: Step, v: ListingInput): string | null {
  switch (step) {
    case "Basics":
      if (v.title.trim().length < 5) return "Give your place a title (at least 5 characters).";
      if (v.description.trim().length < 20) return "Describe your place (at least 20 characters).";
      return null;
    case "Location":
      if (!v.address.trim() || !v.city.trim() || !v.country.trim()) return "Address, city and country are required.";
      return null;
    case "Photos":
      if (!v.image_urls.length) return "Add at least one photo URL.";
      if (v.image_urls.some((u) => !/^https?:\/\/\S+$/i.test(u))) return "Every photo must be a valid http(s) URL.";
      return null;
    case "Price":
      if (!(v.price_per_night > 0)) return "Set a nightly price above $0.";
      if (v.cleaning_fee < 0) return "Cleaning fee can't be negative.";
      return null;
    default:
      return null;
  }
}

interface ListingFormProps {
  initial?: ListingInput;
  mode: "create" | "edit";
  onSubmit: (data: ListingInput) => Promise<void>;
}

/** Multi-step create/edit flow modelled on Airbnb's host onboarding. */
export function ListingForm({ initial = EMPTY_LISTING, mode, onSubmit }: ListingFormProps) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<ListingInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.amenities().then(setAmenities).catch(() => {});
    api.categories().then(setCategories).catch(() => {});
  }, []);

  const set = (patch: Partial<ListingInput>) => {
    setValues((v) => ({ ...v, ...patch }));
    setError(null);
  };
  const current = STEPS[step];

  const next = () => {
    const err = validateStep(current, values);
    if (err) {
      setError(err);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    for (const s of STEPS) {
      const err = validateStep(s, values);
      if (err) {
        setStep(STEPS.indexOf(s));
        setError(err);
        return;
      }
    }
    setSaving(true);
    try {
      await onSubmit({
        ...values,
        title: values.title.trim(),
        description: values.description.trim(),
        state: values.state?.trim() || null,
        image_urls: values.image_urls.map((u) => u.trim()),
      });
    } catch (err) {
      setError(errorMessage(err));
      toast.error(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-80px)] flex-col">
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 pt-8 pb-40">
        <ol className="no-scrollbar mb-10 flex gap-2 overflow-x-auto text-sm" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => (i < step || mode === "edit") && setStep(i)}
                className={cn(
                  "rounded-full px-3 py-1.5 font-semibold whitespace-nowrap transition",
                  i === step ? "bg-gray-900 text-white" : i < step ? "bg-gray-100 text-gray-900" : "text-gray-400",
                )}
                aria-current={i === step ? "step" : undefined}
              >
                {i + 1}. {s}
              </button>
            </li>
          ))}
        </ol>

        {current === "Basics" && <BasicsStep values={values} set={set} categories={categories} />}
        {current === "Location" && <LocationStep values={values} set={set} />}
        {current === "Amenities" && <AmenitiesStep values={values} set={set} amenities={amenities} />}
        {current === "Photos" && <PhotosStep values={values} set={set} />}
        {current === "Price" && <PriceStep values={values} set={set} />}
        {current === "Review" && <ReviewStep values={values} amenities={amenities} categories={categories} />}

        {error && (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-gray-200 bg-white md:bottom-0">
        <div className="h-1.5 bg-gray-200">
          <div className="h-full bg-gray-900 transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="font-semibold underline disabled:invisible"
          >
            Back
          </button>
          {current === "Review" ? (
            <Button variant="brand" size="lg" loading={saving} onClick={submit}>
              {mode === "create" ? "Publish listing" : "Save changes"}
            </Button>
          ) : (
            <Button variant="dark" size="lg" onClick={next}>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

type StepProps = { values: ListingInput; set: (p: Partial<ListingInput>) => void };

const input =
  "w-full rounded-lg border border-gray-400 px-4 py-3 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-sm text-gray-500">{hint}</span>}
    </label>
  );
}

function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-[32px] leading-tight font-semibold">{title}</h1>
      {subtitle && <p className="mt-2 text-lg text-gray-600">{subtitle}</p>}
    </div>
  );
}

function BasicsStep({ values, set, categories }: StepProps & { categories: Category[] }) {
  return (
    <div className="space-y-8">
      <StepTitle title="Tell us about your place" subtitle="Share some basic info, like what kind of place it is and how many guests can stay." />
      <div>
        <span className="mb-3 block font-semibold">Which of these best describes your place?</span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={values.property_type === t}
              onClick={() => set({ property_type: t })}
              className={cn(
                "rounded-xl border p-4 text-left font-semibold transition",
                values.property_type === t ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900" : "border-gray-300 hover:border-gray-900",
              )}
            >
              {PROPERTY_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>
      <Field label="Category" hint="Where should guests discover your place on the explore page?">
        <select value={values.category} onChange={(e) => set({ category: e.target.value })} className={input}>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Title" hint={`${values.title.length}/200`}>
        <input
          value={values.title}
          maxLength={200}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Cozy cabin with mountain views"
          className={input}
        />
      </Field>
      <Field label="Description" hint={`${values.description.length}/5000`}>
        <textarea
          value={values.description}
          maxLength={5000}
          rows={6}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="What makes your place special? Describe the space, the neighbourhood and what guests can access."
          className={input}
        />
      </Field>
      <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 px-5">
        <Counter label="Guests" value={values.max_guests} min={1} max={16} onChange={(max_guests) => set({ max_guests })} />
        <Counter label="Bedrooms" value={values.bedrooms} min={0} max={20} onChange={(bedrooms) => set({ bedrooms })} />
        <Counter label="Beds" value={values.beds} min={1} max={30} onChange={(beds) => set({ beds })} />
        <BathroomCounter value={values.bathrooms} onChange={(bathrooms) => set({ bathrooms })} />
      </div>
    </div>
  );
}

function BathroomCounter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  // Counter works on integers; store half-baths as steps of 0.5.
  return <Counter label="Bathrooms" description="Half steps allowed" value={value * 2} min={0} max={40} onChange={(v) => onChange(v / 2)} />;
}

function LocationStep({ values, set }: StepProps) {
  const [looking, setLooking] = useState(false);
  const geocode = async () => {
    const q = [values.address, values.city, values.state, values.country].filter(Boolean).join(", ");
    if (!q) return toast.error("Enter an address or city first.");
    setLooking(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { lat: string; lon: string }[];
      if (!data.length) {
        toast.error("Couldn't find that place. Click the map to set the pin.");
        return;
      }
      set({ latitude: Number(Number(data[0].lat).toFixed(5)), longitude: Number(Number(data[0].lon).toFixed(5)) });
      toast.success("Pin placed on the map");
    } catch {
      toast.error("Geocoding is unavailable. Click the map to set the pin.");
    } finally {
      setLooking(false);
    }
  };

  return (
    <div className="space-y-6">
      <StepTitle title="Where's your place located?" subtitle="Your address is only shared with guests after they've made a reservation." />
      <Field label="Street address">
        <input value={values.address} onChange={(e) => set({ address: e.target.value })} placeholder="12 MG Road" className={input} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City">
          <input value={values.city} onChange={(e) => set({ city: e.target.value })} placeholder="Bengaluru" className={input} />
        </Field>
        <Field label="State / region">
          <input value={values.state ?? ""} onChange={(e) => set({ state: e.target.value })} placeholder="Karnataka" className={input} />
        </Field>
        <Field label="Country">
          <input value={values.country} onChange={(e) => set({ country: e.target.value })} placeholder="India" className={input} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" /> {values.latitude.toFixed(4)}, {values.longitude.toFixed(4)} · click the map to adjust
        </p>
        <Button variant="outline" size="sm" onClick={geocode} loading={looking}>
          Find address on map
        </Button>
      </div>
      <div className="isolate h-80 overflow-hidden rounded-xl border border-gray-200">
        <LocationPicker lat={values.latitude} lng={values.longitude} onChange={(latitude, longitude) => set({ latitude, longitude })} />
      </div>
    </div>
  );
}

function AmenitiesStep({ values, set, amenities }: StepProps & { amenities: Amenity[] }) {
  const toggle = (id: number) =>
    set({ amenity_ids: values.amenity_ids.includes(id) ? values.amenity_ids.filter((x) => x !== id) : [...values.amenity_ids, id] });
  return (
    <div>
      <StepTitle title="Tell guests what your place has to offer" subtitle="You can add more amenities after you publish." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {amenities.map((a) => {
          const on = values.amenity_ids.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(a.id)}
              className={cn(
                "flex flex-col gap-3 rounded-xl border p-4 text-left transition",
                on ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900" : "border-gray-300 hover:border-gray-900",
              )}
            >
              <Icon name={a.icon} className="h-7 w-7" strokeWidth={1.5} />
              <span className="font-semibold">{a.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PhotosStep({ values, set }: StepProps) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const urls = draft
      .split(/\s+/)
      .map((u) => u.trim())
      .filter(Boolean);
    const bad = urls.find((u) => !/^https?:\/\/\S+$/i.test(u));
    if (bad) return toast.error(`Not a valid URL: ${bad}`);
    if (!urls.length) return;
    set({ image_urls: [...values.image_urls, ...urls].slice(0, 20) });
    setDraft("");
  };
  const move = (i: number, dir: -1 | 1) => {
    const next = [...values.image_urls];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    set({ image_urls: next });
  };
  return (
    <div>
      <StepTitle title="Add some photos of your place" subtitle="Paste image URLs (one or more, separated by spaces). The first photo is your cover." />
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="https://images.unsplash.com/photo-..."
          className={input}
          aria-label="Photo URL"
        />
        <Button variant="dark" onClick={add}>
          <ImagePlus className="h-4 w-4" /> Add
        </Button>
      </div>
      {values.image_urls.length === 0 ? (
        <div className="mt-6 flex h-56 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-500">
          <ImagePlus className="mb-2 h-10 w-10" strokeWidth={1.2} />
          No photos yet
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {values.image_urls.map((url, i) => (
            <li key={`${url}-${i}`} className={cn("group relative overflow-hidden rounded-xl bg-gray-100", i === 0 && "sm:col-span-2")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Photo ${i + 1}`} className={cn("w-full object-cover", i === 0 ? "aspect-[16/9]" : "aspect-[4/3]")} />
              {i === 0 && <span className="absolute top-3 left-3 rounded-md bg-white px-2 py-1 text-xs font-semibold shadow">Cover photo</span>}
              <div className="absolute top-3 right-3 flex gap-1">
                {i > 0 && (
                  <button type="button" onClick={() => move(i, -1)} aria-label="Move photo earlier" className="rounded-full bg-white p-1.5 shadow hover:scale-105">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                )}
                {i < values.image_urls.length - 1 && (
                  <button type="button" onClick={() => move(i, 1)} aria-label="Move photo later" className="rounded-full bg-white p-1.5 shadow hover:scale-105">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => set({ image_urls: values.image_urls.filter((_, j) => j !== i) })}
                  aria-label="Remove photo"
                  className="rounded-full bg-white p-1.5 shadow hover:scale-105"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PriceStep({ values, set }: StepProps) {
  const guestFee = Math.round(((values.price_per_night + values.cleaning_fee) * values.service_fee_pct) / 100);
  return (
    <div>
      <StepTitle title="Now, set your price" subtitle="You can change it anytime." />
      <div className="flex items-center justify-center py-6 text-6xl font-bold md:text-7xl">
        $
        <input
          type="number"
          min={1}
          value={values.price_per_night || ""}
          onChange={(e) => set({ price_per_night: Math.max(0, Math.floor(Number(e.target.value))) })}
          aria-label="Price per night"
          className="w-56 bg-transparent text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
      <p className="text-center text-gray-600">per night</p>
      <div className="mx-auto mt-8 max-w-md space-y-4">
        <Field label="Cleaning fee (one-time, per stay)">
          <input
            type="number"
            min={0}
            value={values.cleaning_fee}
            onChange={(e) => set({ cleaning_fee: Math.max(0, Math.floor(Number(e.target.value))) })}
            className={input}
          />
        </Field>
        <div className="rounded-xl border border-gray-200 p-5 text-sm">
          <div className="flex justify-between">
            <span>Base price (1 night)</span>
            <span>{money(values.price_per_night)}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span>Cleaning fee</span>
            <span>{money(values.cleaning_fee)}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span>Guest service fee ({values.service_fee_pct}%)</span>
            <span>{money(guestFee)}</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 font-semibold">
            <span>Guest pays (1 night)</span>
            <span>{money(values.price_per_night + values.cleaning_fee + guestFee)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ values, amenities, categories }: { values: ListingInput; amenities: Amenity[]; categories: Category[] }) {
  const chosen = amenities.filter((a) => values.amenity_ids.includes(a.id));
  return (
    <div>
      <StepTitle title="Review your listing" subtitle="Here's what we'll show to guests. Make sure everything looks good." />
      <div className="grid gap-8 md:grid-cols-[minmax(0,320px)_1fr]">
        <div className="overflow-hidden rounded-2xl shadow-card">
          {values.image_urls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={values.image_urls[0]} alt="Cover" className="aspect-square w-full object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center bg-gray-100">
              <LoaderCircle className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div className="p-4">
            <div className="font-semibold">{values.title || "Untitled listing"}</div>
            <div className="text-gray-600">
              <b className="text-gray-900">{money(values.price_per_night)}</b> night
            </div>
          </div>
        </div>
        <dl className="space-y-4 text-sm">
          <Row label="Type">{PROPERTY_TYPE_LABELS[values.property_type]}</Row>
          <Row label="Category">{categories.find((c) => c.slug === values.category)?.label ?? values.category}</Row>
          <Row label="Location">{[values.address, values.city, values.state, values.country].filter(Boolean).join(", ")}</Row>
          <Row label="Capacity">
            {[plural(values.max_guests, "guest"), plural(values.bedrooms, "bedroom"), plural(values.beds, "bed"), plural(values.bathrooms, "bath")].join(" · ")}
          </Row>
          <Row label="Amenities">{chosen.length ? chosen.map((a) => a.name).join(", ") : "None selected"}</Row>
          <Row label="Photos">{plural(values.image_urls.length, "photo")}</Row>
          <Row label="Pricing">
            {money(values.price_per_night)} / night · {money(values.cleaning_fee)} cleaning fee
          </Row>
        </dl>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 border-b border-gray-100 pb-3">
      <dt className="font-semibold">{label}</dt>
      <dd className="text-gray-700">{children}</dd>
    </div>
  );
}
