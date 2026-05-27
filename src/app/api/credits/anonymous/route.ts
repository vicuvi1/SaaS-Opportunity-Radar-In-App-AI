import { parseAnonFp, getAnonCredits } from "@/lib/anon-credits";

export async function GET(req: Request) {
  const fp = parseAnonFp(req.headers.get("x-anon-fp"));
  if (!fp) return Response.json({ credits: 0 });
  const credits = await getAnonCredits(fp);
  return Response.json({ credits });
}
