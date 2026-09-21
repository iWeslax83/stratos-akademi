"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { onizle, addLessonsFromVideos, type OnizleSonuc, type OnizleSatir } from "@/app/actions/lesson-add";
import { KOD_METNI } from "@/lib/lessons/add-check";
import { formatSure } from "@/lib/lessons/format";

type Sonuc = Extract<OnizleSonuc, { ok: true }>;

const INPUT =
  "w-full rounded-xl border border-[var(--line)] bg-transparent px-3 py-2 text-sm text-fg placeholder:text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
const LINK_BTN =
  "text-xs font-semibold text-accent-fg underline underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

// CSP img-src yalnız i.ytimg.com'a izin verir.
const kucukResim = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

function Durum({ satir, id }: { satir: OnizleSatir; id?: string }) {
  if (satir.engeller.length === 0 && satir.uyarilar.length === 0) return null;
  return (
    <ul id={id} className="mt-1 space-y-0.5">
      {satir.engeller.map((k) => (
        <li key={k} className="flex items-start gap-1.5 text-xs text-danger-fg">
          <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
          <span><span className="font-semibold">Engel:</span> {KOD_METNI[k]}</span>
        </li>
      ))}
      {satir.uyarilar.map((k) => (
        <li key={k} className="flex items-start gap-1.5 text-xs text-warn-fg">
          <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
          <span>
            <span className="font-semibold">Uyarı:</span> {KOD_METNI[k]}
            {k === "baska_modulde" && satir.baskaModulde ? ` (${satir.baskaModulde})` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

function temiz(s: OnizleSatir) {
  return s.engeller.length === 0 && s.uyarilar.length === 0;
}

export function VideoEkle({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [giris, setGiris] = useState("");
  const [sonuc, setSonuc] = useState<Sonuc | null>(null);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [baslik, setBaslik] = useState("");
  const [ters, setTers] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [mesaj, setMesaj] = useState("");
  const [getiriyor, getirStart] = useTransition();
  const [ekleniyor, ekleStart] = useTransition();

  function getir(metin: string) {
    const t = metin.trim();
    if (!t) return;
    setHata(null);
    setMesaj("");
    getirStart(async () => {
      const r = await onizle(t, moduleId);
      if (!r.ok) {
        setSonuc(null);
        setHata(r.error);
        return;
      }
      setSonuc(r);
      setTers(false);
      setSecili(new Set(r.satirlar.filter(temiz).map((s) => s.id)));
      setBaslik(r.tur === "video" ? r.satirlar[0].baslik : "");
    });
  }

  function vazgec() {
    setSonuc(null);
    setHata(null);
    inputRef.current?.focus();
  }

  const gorunen = sonuc ? (ters ? [...sonuc.satirlar].reverse() : sonuc.satirlar) : [];

  function ekle() {
    if (!sonuc) return;
    const tek = sonuc.tur === "video";
    const ids = tek ? [sonuc.satirlar[0].id] : gorunen.filter((s) => secili.has(s.id)).map((s) => s.id);
    if (ids.length === 0) return;
    setHata(null);
    ekleStart(async () => {
      const r = await addLessonsFromVideos(moduleId, ids, tek ? { [ids[0]]: baslik } : {});
      const atlanan = r.atlanan?.length
        ? ` ${r.atlanan.length} video atlandı: ${r.atlanan.map((a) => a.neden).join(" ")}`
        : "";
      if (!r.ok) {
        setHata((r.error ?? "Eklenemedi.") + atlanan);
        return;
      }
      const e = r.eklenenler ?? [];
      setMesaj(
        e.length === 1
          ? `Eklendi: ${e[0].baslik} (${formatSure(e[0].sure_sn)}).${atlanan}`
          : `${e.length} ders eklendi.${atlanan}`,
      );
      setSonuc(null);
      setGiris("");
      router.refresh();
      inputRef.current?.focus();
    });
  }

  const uygunSayisi = sonuc ? sonuc.satirlar.filter((s) => s.engeller.length === 0).length : 0;
  const engelliSayisi = sonuc ? sonuc.satirlar.length - uygunSayisi : 0;
  const uyarili = sonuc ? sonuc.satirlar.filter((s) => s.engeller.length === 0 && s.uyarilar.length > 0).length : 0;

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          getir(giris);
        }}
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <label className="block flex-1">
          <span className="mb-1 block text-xs font-semibold text-muted">YouTube video veya playlist linki</span>
          <input
            ref={inputRef}
            name="youtube_link"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={giris}
            onChange={(e) => setGiris(e.target.value)}
            onPaste={(e) => getir(e.clipboardData.getData("text"))}
            placeholder="https://youtu.be/… veya https://youtube.com/playlist?list=…"
            className={INPUT}
          />
        </label>
        <Button type="submit" variant="accent" loading={getiriyor} disabled={!giris.trim()}>
          Getir
        </Button>
      </form>

      <FormError box>{hata}</FormError>
      <p role="status" aria-live="polite" className={mesaj ? "text-sm font-semibold text-success-fg" : "sr-only"}>
        {mesaj}
      </p>

      {sonuc && sonuc.tur === "video" && (() => {
        const s = sonuc.satirlar[0];
        const engelli = s.engeller.length > 0;
        return (
          <div className="rounded-core border border-[var(--line)] p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={kucukResim(s.id)}
                alt=""
                width={160}
                height={90}
                loading="lazy"
                className="h-[90px] w-[160px] shrink-0 rounded-lg bg-tint object-cover"
              />
              <div className="min-w-0 flex-1">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-muted">Ders başlığı</span>
                  <input
                    name="baslik"
                    autoComplete="off"
                    value={baslik}
                    onChange={(e) => setBaslik(e.target.value)}
                    className={INPUT}
                  />
                </label>
                <p className="mt-1.5 text-xs text-muted">
                  {s.kanal || "Kanal bilinmiyor"} · Süre {formatSure(s.sure_sn)}
                </p>
                <Durum satir={s} id="video-durum" />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                loading={ekleniyor}
                disabled={engelli || !baslik.trim()}
                aria-describedby={engelli ? "video-durum" : undefined}
                onClick={ekle}
              >
                Derse ekle
              </Button>
              <button type="button" onClick={vazgec} className={LINK_BTN}>Vazgeç</button>
              {sonuc.playlistId && (
                <button
                  type="button"
                  onClick={() => getir(`https://www.youtube.com/playlist?list=${sonuc.playlistId}`)}
                  className={LINK_BTN}
                >
                  Playlist&apos;in tamamını getir
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {sonuc && sonuc.tur === "playlist" && (
        <div className="rounded-core border border-[var(--line)]">
          <div className="border-b border-[var(--line)] p-4">
            <p className="text-sm font-semibold text-fg">
              {sonuc.satirlar.length} video: {uygunSayisi} uygun, {engelliSayisi} engelli, {uyarili} uyarılı
            </p>
            {sonuc.truncated && (
              <p className="mt-1 text-xs text-muted">Playlist uzun, ilk {sonuc.satirlar.length} video gösteriliyor.</p>
            )}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <button
                type="button"
                className={LINK_BTN}
                onClick={() => setSecili(new Set(sonuc.satirlar.filter((s) => s.engeller.length === 0).map((s) => s.id)))}
              >
                Uygunların hepsini seç
              </button>
              <button type="button" className={LINK_BTN} onClick={() => setSecili(new Set())}>Seçimi temizle</button>
              <button type="button" className={LINK_BTN} onClick={() => setTers((t) => !t)}>
                Sırayı ters çevir{ters ? " (ters)" : ""}
              </button>
            </div>
          </div>
          <ul className="max-h-[28rem] overflow-y-auto overscroll-contain px-4">
            {gorunen.map((s) => {
              const engelli = s.engeller.length > 0;
              return (
                <li key={s.id} className="border-b border-[var(--line)] last:border-b-0">
                  <label className={`flex items-start gap-3 py-3 ${engelli ? "opacity-70" : "cursor-pointer"}`}>
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 accent-accent"
                      checked={secili.has(s.id)}
                      disabled={engelli}
                      onChange={(e) =>
                        setSecili((prev) => {
                          const n = new Set(prev);
                          if (e.target.checked) n.add(s.id); else n.delete(s.id);
                          return n;
                        })
                      }
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={kucukResim(s.id)}
                      alt=""
                      width={96}
                      height={54}
                      loading="lazy"
                      className="h-[54px] w-[96px] shrink-0 rounded-md bg-tint object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-semibold text-fg">{s.baslik}</span>
                      <span className="block text-xs text-muted">
                        {s.kanal || "Kanal bilinmiyor"} · {formatSure(s.sure_sn)}
                      </span>
                      <Durum satir={s} />
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] p-4">
            <Button variant="primary" loading={ekleniyor} disabled={secili.size === 0} onClick={ekle}>
              {secili.size} ders ekle
            </Button>
            <button type="button" onClick={vazgec} className={LINK_BTN}>Vazgeç</button>
          </div>
        </div>
      )}
    </div>
  );
}
