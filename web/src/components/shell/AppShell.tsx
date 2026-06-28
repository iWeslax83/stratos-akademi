import { Nav } from "./Nav";

export function AppShell({
  children,
  initial,
  streak,
  points,
  isAdmin,
}: {
  children: React.ReactNode;
  initial?: string;
  streak?: number;
  points?: number;
  isAdmin?: boolean;
}) {
  return (
    <>
      {/* Derinlik için ince nokta dokusu — sabit, içeriğin arkasında */}
      <div className="bg-dotgrid pointer-events-none fixed inset-0 -z-10" aria-hidden />
      <div className="mx-auto max-w-[1180px] px-6 pb-12 pt-6">
        <Nav initial={initial} streak={streak} points={points} isAdmin={isAdmin} />
        <main className="mt-6">{children}</main>
      </div>
    </>
  );
}
