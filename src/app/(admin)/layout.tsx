export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside>{/* Admin sidebar - to be implemented */}</aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
