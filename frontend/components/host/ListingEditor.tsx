"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { ListingForm, listingToInput } from "@/components/host/ListingForm";
import { Skeleton } from "@/components/ui/Skeleton";
import { useFetch } from "@/hooks/useFetch";
import { useUser } from "@/hooks/useUser";
import { api } from "@/lib/api";

export function NewListing() {
  const router = useRouter();
  const { user, ready } = useUser();
  if (ready && !user?.is_host) return <HostOnly />;
  return (
    <ListingForm
      mode="create"
      onSubmit={async (data) => {
        const created = await api.createListing(data);
        toast.success("Your listing is live!");
        router.push(`/rooms/${created.id}`);
      }}
    />
  );
}

export function EditListing() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, ready } = useUser();
  const listing = useFetch(() => api.listing(id), [id]);

  if (listing.error) return <p className="px-6 py-24 text-center text-gray-600">{listing.error}</p>;
  if (!listing.data || !ready) return <div className="mx-auto max-w-3xl px-6 py-10"><Skeleton className="h-96" /></div>;
  if (listing.data.host_id !== user?.id) return <HostOnly message="You can only edit your own listings." />;

  return (
    <ListingForm
      key={listing.data.id}
      mode="edit"
      initial={listingToInput(listing.data)}
      onSubmit={async (data) => {
        await api.updateListing(listing.data!.id, data);
        toast.success("Changes saved");
        router.push("/host");
      }}
    />
  );
}

function HostOnly({ message = "Only hosts can create listings. Switch to a host account from the menu." }: { message?: string }) {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">Hosts only</h1>
      <p className="mt-2 text-gray-600">{message}</p>
    </div>
  );
}
