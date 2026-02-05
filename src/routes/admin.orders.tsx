import { Outlet, useParams } from "@remix-run/react";
import AdminOrders from "@/pages/admin/AdminOrders";

export default function AdminOrdersLayout() {
  const params = useParams();
  if (params.id) return <Outlet />;
  return <AdminOrders />;
}
