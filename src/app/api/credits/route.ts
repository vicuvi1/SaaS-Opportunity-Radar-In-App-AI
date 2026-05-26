import { createClient } from "@/lib/supabase/server";
import { getCredits } from "@/lib/credits";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return Response.json({ error: "Auth not configured." }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const credits = await getCredits(user.id);
  return Response.json({ credits });
}
