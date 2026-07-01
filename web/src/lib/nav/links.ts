// Nav linklerinin tek kaynağı (Nav, AdminMenu, MobileMenu paylaşır).

export type NavLink = { href: string; label: string };

export const MEMBER_LINKS: NavLink[] = [
  { href: "/mufredat", label: "Müfredat" },
  { href: "/panom", label: "Panom" },
  { href: "/liderlik", label: "Liderlik" },
  { href: "/duyurular", label: "Duyurular" },
  { href: "/etkinlikler", label: "Etkinlikler" },
  { href: "/kaynaklar", label: "Kaynaklar" },
];

export const ADMIN_LINKS: NavLink[] = [
  { href: "/admin/mufredat", label: "Müfredat" },
  { href: "/admin/uyeler", label: "Üyeler" },
  { href: "/admin/onaylar", label: "Onaylar" },
  { href: "/admin/oneriler", label: "Öneriler" },
  { href: "/admin/duyurular", label: "Duyurular" },
  { href: "/admin/etkinlikler", label: "Etkinlikler" },
  { href: "/admin/kaynaklar", label: "Kaynaklar" },
  { href: "/admin/analitik", label: "Analitik" },
];
