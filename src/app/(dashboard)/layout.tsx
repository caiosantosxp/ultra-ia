export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside>{/* Sidebar - to be implemented */}</aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
