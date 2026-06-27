// Bir bildirime tıklayınca ne olacağını çözer (saf mantık → test edilebilir).
// Okunmamışsa okundu işaretlenir; link varsa oraya gidilir, yoksa okunmuşluğu
// yansıtmak için sayfa tazelenir.

export type ClickPlan = {
  mark: boolean; // okundu işaretlensin mi
  navigateTo: string | null; // gidilecek link
  refresh: boolean; // link yoksa ve durum değiştiyse tazele
};

export function resolveClick(okundu: boolean, link: string | null): ClickPlan {
  const mark = !okundu;
  if (link) return { mark, navigateTo: link, refresh: false };
  return { mark, navigateTo: null, refresh: mark };
}
