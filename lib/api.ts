// lib/api.ts
export async function fetchData<T>(
  table: string,
  options?: { from?: string; to?: string; noDateFilter?: boolean }
): Promise<T[]> {
  const params = new URLSearchParams({ table });
  if (options?.from) params.set("from", options.from);
  if (options?.to) params.set("to", options.to);
  if (options?.noDateFilter) params.set("noDateFilter", "true");

  const res = await fetch(`/api/data?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Erro ao buscar ${table}`);
  }
  const { data } = await res.json();
  return data ?? [];
}
