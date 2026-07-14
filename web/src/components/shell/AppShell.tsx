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
      {/* Klavye kullanıcıları için: Tab'a ilk basışta görünür, nav'ı atlar. */}
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        İçeriğe atla
      </a>
      {/* Derinlik için ince nokta dokusu — sabit, içeriğin arkasında */}
      <div className="bg-dotgrid pointer-events-none fixed inset-0 -z-10" aria-hidden />
      <div className="mx-auto max-w-[1320px] px-4 pb-12 pt-6 sm:px-6">
        <Nav initial={initial} points={points} isAdmin={isAdmin} />
        <main id="icerik" className="mt-6">
          {children}
        </main>
      </div>
    </>
  );
}
