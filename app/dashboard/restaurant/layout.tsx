import DashboardLayout from '@/components/layout/DashboardLayout';

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="restaurant">{children}</DashboardLayout>;
}
