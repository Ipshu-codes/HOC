import "server-only";

import fs from "node:fs";
import path from "node:path";
import { newsPortalSchema, type NewsPortalContent } from "@/types/news";

/** Local JSON adapter; replace this boundary with a database/API repository when the admin is ready. */
export function getNewsPortalContent(): NewsPortalContent {
  const file = path.join(process.cwd(), "content", "news.json");
  const raw: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
  const parsed = newsPortalSchema.safeParse(raw);
  if (!parsed.success) throw new Error(`Invalid ${file}: ${parsed.error.message}`);
  return parsed.data;
}
