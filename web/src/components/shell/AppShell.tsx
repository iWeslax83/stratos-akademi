import { Nav } from "./Nav";

export function AppShell({ children, initial }: { children: React.ReactNode; initial?: string }) {
  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-12 pt-6">
      <Nav initial={initial} />
      <main className="mt-6">{children}</main>
    </div>
  );
}
