import { resolveDriver } from "@/lib/db";
import { describeAi } from "@/lib/ai/mode";

export const dynamic = "force-dynamic";

export function GET() {
  const ai = describeAi();
  return Response.json({
    ok: true,
    driver: resolveDriver(),
    ai: ai.mode,
    aiSource: ai.source,
  });
}
