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
  Warehouse,
  BadgePercent,
  Truck,
  FileText,
  RotateCcw,
  Star,
  Megaphone,
  UsersRound,
  LineChart,
  ShieldCheck,
  ClipboardList,
  Headset,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Inventory', href: '/admin/inventory', icon: Warehouse },
  { label: 'Categories', href: '/admin/categories', icon: FolderOpen },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Promotions', href: '/admin/promotions', icon: BadgePercent },
  { label: 'Shipping', href: '/admin/shipping', icon: Truck },
  { label: 'Taxes', href: '/admin/taxes', icon: FileText },
  { label: 'Returns', href: '/admin/returns', icon: RotateCcw },
  { label: 'Reviews', href: '/admin/reviews', icon: Star },
  { label: 'Campaigns', href: '/admin/campaigns', icon: Megaphone },
  { label: 'Segments', href: '/admin/segments', icon: UsersRound },
  { label: 'Support', href: '/admin/support', icon: Headset },
  { label: 'Analytics', href: '/admin/analytics', icon: LineChart },
  { label: 'Team', href: '/admin/team', icon: ShieldCheck },
  { label: 'Audit', href: '/admin/audit', icon: ClipboardList },
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
