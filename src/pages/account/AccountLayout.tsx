import { Outlet } from '@remix-run/react';
import DashboardLayout from '@/components/DashboardLayout';

const navItems = [
  { label: 'Orders', href: '/account/orders' },
  { label: 'Profile', href: '/account/profile' },
  { label: 'Wishlist', href: '/account/wishlist' },
  { label: 'Returns', href: '/account/returns' },
  { label: 'Notifications', href: '/account/notifications' },
];

export default function AccountLayout() {
  return (
    <DashboardLayout title="My Account" navItems={navItems}>
      <Outlet />
    </DashboardLayout>
  );
}
