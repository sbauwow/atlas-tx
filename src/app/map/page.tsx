import { redirect } from "next/navigation";

export const metadata = {
  title: "Atlas TX — Map",
};

export default async function MapRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string") qs.set(k, v);
    else if (Array.isArray(v)) qs.set(k, v[0] ?? "");
  }
  const search = qs.toString();
  redirect(search ? `/maps?${search}` : "/maps");
}
