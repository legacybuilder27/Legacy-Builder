export type ProviderMode = "mock" | "openai";
export type AiSource = "none" | "openai" | "netlify-gateway";

export type AiSetup = {
  mode: ProviderMode;
  source: AiSource;
};

// A present OPENAI_API_KEY still selects the OpenAI call path. Netlify's AI
// Gateway can inject that variable plus OPENAI_BASE_URL without the site owner
// adding a key. The source field records that case. Calls themselves stay
// pointed at api.openai.com.
export function providerMode(): ProviderMode {
  return describeAi().mode;
}

export function describeAi(env: NodeJS.ProcessEnv = process.env): AiSetup {
  if (env.AI_PROVIDER === "mock" || !env.OPENAI_API_KEY?.trim()) {
    return { mode: "mock", source: "none" };
  }
  if (gatewayIsSupplyingOpenAi(env)) {
    return { mode: "openai", source: "netlify-gateway" };
  }
  return { mode: "openai", source: "openai" };
}

export function footerNote(setup: AiSetup): string {
  if (setup.source === "netlify-gateway") {
    return "Netlify's AI Gateway is on for this site. This app is not using it. Live transcription and drafting do not complete, and nothing is billed to OpenAI or to your Netlify credits.";
  }
  if (setup.mode === "mock") {
    return "Demo mode is on. Transcripts and drafts stay on this server and are not sent to an AI provider.";
  }
  return "An OpenAI key is set. Audio you transcribe, and the text used to draft a chapter, are sent to OpenAI.";
}

function gatewayIsSupplyingOpenAi(env: NodeJS.ProcessEnv): boolean {
  const base = strip(env.OPENAI_BASE_URL);
  if (!base) return false;
  const gateway = strip(env.NETLIFY_AI_GATEWAY_URL || env.NETLIFY_AI_GATEWAY_BASE_URL);
  if (gateway && base === gateway) return true;
  const host = hostOf(base);
  return host === "ai-gateway.netlify.com" || host.endsWith(".ai-gateway.netlify.com");
}

function strip(value: string | undefined): string {
  return (value || "").trim().replace(/\/+$/, "").toLowerCase();
}

function hostOf(value: string): string {
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return "";
  }
}
