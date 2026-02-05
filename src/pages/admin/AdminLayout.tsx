import { Outlet } from '@remix-run/react';
import DashboardLayout from '@/components/DashboardLayout';
import { ToastProvider } from '@/components/admin/Toast';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderOpen,
  Users,
  CreditCard,
  LayoutList,
  MessageSquareQuote,
  Settings,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Categories', href: '/admin/categories', icon: FolderOpen },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Sections', href: '/admin/sections', icon: LayoutList },
  { label: 'Testimonials', href: '/admin/testimonials', icon: MessageSquareQuote },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout() {
  return (
    <ToastProvider>
      <DashboardLayout title="Admin Panel" navItems={navItems}>
        <Outlet />
      </DashboardLayout>
    </ToastProvider>
  );
}
