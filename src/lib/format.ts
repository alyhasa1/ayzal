export const formatPrice = (price: number): string => {
  return `Rs. ${price.toLocaleString('en-PK')}`;
};

export const formatOrderNumber = (order: {
  _id: string;
  order_number?: string;
  created_at?: number;
  _creationTime?: number;
}): string => {
  if (order.order_number) {
    return order.order_number;
  }
  const timestamp = order.created_at ?? order._creationTime ?? Date.now();
  const date = new Date(timestamp);
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const suffix = order._id.slice(-6).toUpperCase();
  return `AYZ-${yy}${mm}${dd}-${suffix}`;
};
