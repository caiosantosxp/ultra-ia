export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header>{/* Public header - to be implemented */}</header>
      <main>{children}</main>
      <footer>{/* Public footer - to be implemented */}</footer>
    </>
  );
}
