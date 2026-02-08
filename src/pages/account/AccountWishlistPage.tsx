import { Link } from "@remix-run/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatPrice } from "@/lib/format";
import { useState } from "react";

export default function AccountWishlistPage() {
  const wishlist = useQuery(api.wishlist.list, {});
  const removeItem = useMutation(api.wishlist.remove);
  const [removingId, setRemovingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl">My Wishlist</h2>
      {wishlist === undefined ? (
        <div className="bg-white border border-[#111]/10 p-5 text-sm text-[#6E6E6E]">
          Loading wishlist...
        </div>
      ) : (wishlist?.items ?? []).length === 0 ? (
        <div className="bg-white border border-[#111]/10 p-6 text-center space-y-3">
          <p className="text-sm text-[#6E6E6E]">Your wishlist is empty.</p>
          <Link to="/" className="btn-primary inline-block">
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(wishlist?.items ?? []).map((item: any) => (
            <article key={item._id} className="bg-white border border-[#111]/10 p-4 flex gap-3">
              <div className="w-20 h-24 bg-gray-100 overflow-hidden flex-shrink-0">
                {item.product?.primary_image_url ? (
                  <img
                    src={item.product.primary_image_url}
                    alt={item.product?.name}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium truncate">{item.product?.name}</p>
                <p className="text-xs text-[#6E6E6E]">{formatPrice(item.product?.price ?? 0)}</p>
                <div className="flex gap-2 pt-1">
                  <Link
                    to={`/product/${item.product?.slug ?? item.product?._id}`}
                    className="text-xs uppercase tracking-widest border border-[#111]/10 px-2 py-1 hover:border-[#D4A05A]"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    className="text-xs uppercase tracking-widest border border-red-200 text-red-500 px-2 py-1"
                    disabled={removingId === item._id}
                    onClick={async () => {
                      setRemovingId(item._id);
                      try {
                        await removeItem({ item_id: item._id });
                      } finally {
                        setRemovingId(null);
                      }
                    }}
                  >
                    {removingId === item._id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
