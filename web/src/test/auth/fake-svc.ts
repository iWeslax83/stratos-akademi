/* eslint-disable @typescript-eslint/no-explicit-any */
export type SvcOpts = {
  ipCount?: number;
  noCount?: number;
  countError?: boolean;
  insertError?: boolean;
  allow?: { email: string; role: string } | null;
  allowError?: boolean;
  profile?: { id: string; role: string } | null;
  // id ile profil sorgusu (admin kontrolü). undefined: { role: "uye" }, null: profil yok.
  profileById?: { role: string } | null;
  createUser?:(...a: any[]) => Promise<any>;
  generateLink?: (...a: any[]) => Promise<any>;
  inserts?: unknown[];
};

function attempts(o: SvcOpts) {
  let op = "select";
  let col = "";
  const c: any = {
    select: () => ((op = "select"), c),
    insert: (row: unknown) => ((op = "insert"), o.inserts?.push(row), c),
    delete: () => ((op = "delete"), c),
    eq: (k: string) => ((col = k), c),
    gte: () => c,
    lt: () => c,
    then: (res: any, rej: any) =>
      Promise.resolve(
        op === "select"
          ? o.countError
            ? { count: null, error: { message: "boom" } }
            : { count: col === "ip" ? (o.ipCount ?? 0) : (o.noCount ?? 0), error: null }
          : { error: op === "insert" && o.insertError ? { message: "boom" } : null },
      ).then(res, rej),
  };
  return c;
}

function single(result: unknown) {
  const c: any = { select: () => c, eq: () => c, maybeSingle: async () => result };
  return c;
}

export function makeSvc(o: SvcOpts = {}) {
  return {
    from(table: string) {
      if (table === "student_login_attempts") return attempts(o);
      if (table === "allowlist")
        return single(o.allowError ? { data: null, error: { message: "boom" } } : { data: o.allow ?? null, error: null });
      if (table === "profiles") {
        let col = "";
        const c: any = {
          select: () => c,
          eq: (k: string) => ((col = k), c),
          maybeSingle: async () =>
            col === "id"
              ? { data: o.profileById === undefined ? { role: "uye" } : o.profileById, error: null }
              : { data: o.profile ?? null, error: null },
        };
        return c;
      }
      throw new Error(`beklenmeyen tablo: ${table}`);
    },
    auth: {
      admin: {
        createUser: o.createUser ?? (async () => ({ data: {}, error: null })),
        generateLink:
          o.generateLink ?? (async () => ({ data: { properties: { hashed_token: "hash123" }, user: { id: "u1" } }, error: null })),
      },
    },
  };
}
