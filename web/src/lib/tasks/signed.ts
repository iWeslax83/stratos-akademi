import { createServiceClient } from "@/lib/supabase/service";

export async function signedUrlMap(paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const clean = [...new Set(paths.filter((p): p is string => !!p))];
  if (clean.length === 0) return map;
  const svc = createServiceClient();
  const { data } = await svc.storage.from("gorev-dosyalari").createSignedUrls(clean, 3600);
  for (const item of data ?? []) {
    if (item.signedUrl && item.path) map.set(item.path, item.signedUrl);
  }
  return map;
}
