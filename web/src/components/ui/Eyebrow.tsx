export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-gold-soft px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a6d12] dark:bg-gold-dark dark:text-[#ffd54a]">
      {children}
    </span>
  );
}
