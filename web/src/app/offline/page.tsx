import Link from "next/link";

export const metadata = { title: "Çevrimdışı · Stratos Akademi" };

// Service worker, ağ yokken gezinme isteklerinde bu sayfayı gösterir. Auth gerektirmez.
export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#16243F] px-6 text-center text-white">
      <div className="max-w-sm">
        <h1 className="font-display text-2xl font-bold">Çevrimdışısın</h1>
        <p className="mt-3 text-[15px] leading-6 text-[#9fb0c9]">
          Şu an internet bağlantın yok gibi görünüyor. Bağlantı gelince kaldığın yerden
          devam edebilirsin.
        </p>
        <Link
          href="/panom"
          className="mt-6 inline-block rounded-full bg-[#4FB3BF] px-5 py-2 text-sm font-semibold text-[#16243F]"
        >
          Tekrar dene
        </Link>
      </div>
    </main>
  );
}
