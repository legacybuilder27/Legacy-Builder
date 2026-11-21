import { resolveDriver } from "@/lib/db";
import { providerMode } from "@/lib/ai/mode";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    ok: true,
    driver: resolveDriver(),
    ai: providerMode(),
  });
}
