export function toIdSet(values: Iterable<string>) {
  const set = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    set.add(String(value));
  }
  return set;
}

export function dedupeProductsById<T extends { id: string }>(
  products: T[],
  options?: {
    excludeIds?: Iterable<string>;
    limit?: number;
  }
) {
  const seen = new Set<string>();
  const excluded = options?.excludeIds ? toIdSet(options.excludeIds) : new Set<string>();
  const limit = Math.max(1, options?.limit ?? products.length);
  const result: T[] = [];

  for (const product of products) {
    const id = String(product.id);
    if (excluded.has(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(product);
    if (result.length >= limit) break;
  }

  return result;
}

export function pickCrossSellCandidates<T extends { _id?: string; id?: string }>(
  products: T[],
  options?: {
    excludeIds?: Iterable<string>;
    limit?: number;
  }
) {
  const excluded = options?.excludeIds ? toIdSet(options.excludeIds) : new Set<string>();
  const limit = Math.max(1, options?.limit ?? products.length);
  const result: T[] = [];

  for (const product of products) {
    const id = String(product._id ?? product.id ?? "");
    if (!id) continue;
    if (excluded.has(id)) continue;
    result.push(product);
    if (result.length >= limit) break;
  }

  return result;
}

export function getFreeShippingState(subtotal: number, threshold = 15000) {
  const safeSubtotal = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;
  const safeThreshold = Number.isFinite(threshold) ? Math.max(1, threshold) : 15000;
  const remaining = Math.max(0, safeThreshold - safeSubtotal);
  const progress = Math.max(
    0,
    Math.min(100, Math.round((safeSubtotal / safeThreshold) * 100))
  );

  return {
    threshold: safeThreshold,
    remaining,
    progress,
    unlocked: remaining === 0,
  };
}
