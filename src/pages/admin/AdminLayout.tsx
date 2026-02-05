import { Outlet } from '@remix-run/react';
import DashboardLayout from '@/components/DashboardLayout';

const navItems = [
  { label: 'Overview', href: '/admin' },
  { label: 'Products', href: '/admin/products' },
  { label: 'Categories', href: '/admin/categories' },
  { label: 'Payments', href: '/admin/payments' },
  { label: 'Sections', href: '/admin/sections' },
  { label: 'Testimonials', href: '/admin/testimonials' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Settings', href: '/admin/settings' },
];

export default function AdminLayout() {
  return (
    <DashboardLayout title="Admin Panel" navItems={navItems}>
      <Outlet />
    </DashboardLayout>
  );
}
