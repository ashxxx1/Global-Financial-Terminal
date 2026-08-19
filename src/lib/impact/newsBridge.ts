/**
 * News headline → impact question.
 * Reuses the same extract/analyze path as a typed query.
 */
export function headlineToQuestion(title: string, description?: string): string {
  const t = title.replace(/\s+/g, " ").trim();
  const d = (description || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (d && d.length < 180) return `${t} — ${d}`;
  return t;
}
