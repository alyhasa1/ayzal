# Admin Panel UI/UX Enhancement — 2025-01-27

## Phase 0: Shared Components
- **FormField** (`src/components/admin/FormField.tsx`): Reusable label+hint+error wrapper with exported class constants
- **Toast** (`src/components/admin/Toast.tsx`): Context-based toast notification system (success/error/info)
- **ConfirmDialog** (`src/components/admin/ConfirmDialog.tsx`): Modal confirmation for destructive actions, supports children

## Phase 1: Admin Form Refactors
- **AdminProducts**: Full rewrite — labeled fields, image previews, collapsible sections, search/filter, delete confirmation, loading states
- **AdminPayments**: Draft-and-save pattern (no more keystroke saves), FormField labels, toast feedback
- **AdminTestimonials**: Draft-and-save pattern, FormField labels, toast, confirm dialog for delete

## Phase 2: Order Management
- **AdminOrders**: Status filter tabs with counts, search bar, date display, color-coded StatusBadge, Link to detail page
- **AdminOrderDetail** (new): Full order detail view with labeled update form, timeline, customer/shipping/items sections, print button
- **OrderTimeline** (`src/components/OrderTimeline.tsx`): Reusable visual timeline with color-coded dots and StatusBadge export
- **Backend**: Added `orders.adminGetById` query
- **Route**: Added `admin.orders.$id.tsx`

## Phase 3: Customer-Facing Improvements
- **CheckoutPage**: Added proper labels to all fields (email, phone, address), section headers, focus styling
- **AccountOrders**: Replaced button/onClick with Link, added date, item count, StatusBadge
- **AccountOrderDetail**: Visual OrderTimeline, prominent tracking card, product images, Link navigation, ArrowLeft back button

## Phase 4: Remaining Admin Pages
- **AdminCategories**: FormField labels, image thumbnail in list, image preview in form, toast feedback, ConfirmDialog with reassign dropdown
- **AdminSettings**: Grouped into Brand/Contact, SEO, Footer/Social sections with FormField labels, toast feedback
- **AdminSections**: JSON validation with line number hints, dirty-tracking (Save only shows when changed), toast, icon buttons for reorder

## Phase 5: New Features
- **AdminCustomers** (new): Customer listing table with search, order count, total spent, last order date, joined date
- **Backend**: Added `userProfiles.adminListAll` query
- **Route**: Added `admin.customers.tsx`
- **AdminDashboard**: Rich overview with revenue breakdowns (today/week/month/all-time), orders-by-status bar chart, recent orders list, out-of-stock alerts, clickable stat cards

## Phase 6: Navigation & Layout
- **DashboardLayout**: NavItem interface extended with optional `icon` prop, renders icons in both mobile and desktop sidebars
- **AdminLayout**: All 9 nav items now have Lucide icons (LayoutDashboard, ShoppingCart, Package, FolderOpen, Users, CreditCard, LayoutList, MessageSquareQuote, Settings)

---

# Bugfix — 2025-02-06

## Routing: Admin & Customer Order Detail Pages Not Rendering
**Root cause**: Remix flat-file routing treats `admin.orders.tsx` as a layout route that wraps `admin.orders.$id.tsx`. Since the layout rendered `<AdminOrders />` directly with no `<Outlet />`, the `$id` child route could never render. Same on the account side.

**Fix**: Converted layout routes to smart components that check `useParams()` — render `<Outlet />` when `id` param is present (detail view), otherwise render the list component directly. Applied to:
- `admin.orders.tsx` — AdminOrders list / AdminOrderDetail via Outlet
- `account.orders.tsx` — AccountOrders list / AccountOrderDetail via Outlet
- `admin.customers.tsx` — AdminCustomers list / AdminCustomerDetail via Outlet

## Admin Order Detail: State Sync After Save
**Root cause**: `AdminOrderDetail.tsx` used a one-shot `initialized` flag to sync local state from server data. After saving, local state wouldn't re-sync.

**Fix**: Replaced with `useEffect` + `syncKey` counter — after save, `syncKey` increments to trigger fresh sync from server.

## Customer Detail Page (new)
- **AdminCustomerDetail** (`src/pages/admin/AdminCustomerDetail.tsx`): Full customer profile view with email, phone, saved address, join date, order count, total spent, and a list of all orders with shipping addresses, items, and payment methods. Each order links to admin order detail.
- **Backend**: Added `userProfiles.adminGetById` query returning enriched customer + all orders with items/events/payment
- **Route**: `admin.customers.$id.tsx`
- **AdminCustomers**: Customer name/email cell now clickable via Link to detail page
