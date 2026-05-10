import { redirect } from "next/navigation";

/**
 * Glossary content folded into the Education page. Old `/glossary` URLs
 * 308-redirect server-side to `/education#glossary` so external links keep
 * resolving.
 */
export default function GlossaryPage() {
  redirect("/education#glossary");
}
