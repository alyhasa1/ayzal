import { Outlet, useParams } from "@remix-run/react";
import AccountOrders from "@/pages/account/AccountOrders";

export default function AccountOrdersLayout() {
  const params = useParams();
  if (params.id) return <Outlet />;
  return <AccountOrders />;
}
