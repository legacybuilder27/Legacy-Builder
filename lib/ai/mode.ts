export type ProviderMode = "mock" | "openai";

export function providerMode(): ProviderMode {
  if (process.env.AI_PROVIDER === "mock") return "mock";
  if (!process.env.OPENAI_API_KEY) return "mock";
  return "openai";
}
