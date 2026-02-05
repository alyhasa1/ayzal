import { Outlet, useParams } from "@remix-run/react";
import AdminCustomers from "@/pages/admin/AdminCustomers";

export default function AdminCustomersLayout() {
  const params = useParams();
  if (params.id) return <Outlet />;
  return <AdminCustomers />;
}
