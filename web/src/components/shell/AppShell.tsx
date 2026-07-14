import { Nav } from "./Nav";

export function AppShell({
  children,
  initial,
  points,
  isAdmin,
}: {
  children: React.ReactNode;
  initial?: string;
  points?: number;
  isAdmin?: boolean;
}) {
  return (
    <>
      {/* Derinlik için ince nokta dokusu — sabit, içeriğin arkasında */}
      <div className="bg-dotgrid pointer-events-none fixed inset-0 -z-10" aria-hidden />
      <div className="mx-auto max-w-[1320px] px-4 pb-12 pt-6 sm:px-6">
        <Nav initial={initial} points={points} isAdmin={isAdmin} />
        <main className="mt-6">{children}</main>
      </div>
    </>
  );
}
