import { createClient } from "@supabase/supabase-js";

// SADECE sunucuda kullanılır (server action). Servis anahtarı RLS'i bypass eder.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
