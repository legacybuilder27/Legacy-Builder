import { afterEach, describe, expect, it } from "vitest";
import { describeAi, footerNote } from "@/lib/ai/mode";

const original = {
  AI_PROVIDER: process.env.AI_PROVIDER,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  NETLIFY_AI_GATEWAY_URL: process.env.NETLIFY_AI_GATEWAY_URL,
  NETLIFY_AI_GATEWAY_BASE_URL: process.env.NETLIFY_AI_GATEWAY_BASE_URL,
};

afterEach(() => {
  restore("AI_PROVIDER", original.AI_PROVIDER);
  restore("OPENAI_API_KEY", original.OPENAI_API_KEY);
  restore("OPENAI_BASE_URL", original.OPENAI_BASE_URL);
  restore("NETLIFY_AI_GATEWAY_URL", original.NETLIFY_AI_GATEWAY_URL);
  restore("NETLIFY_AI_GATEWAY_BASE_URL", original.NETLIFY_AI_GATEWAY_BASE_URL);
});

describe("AI key detection", () => {
  it("stays in demo mode when no key is set", () => {
    const setup = describeAi({});
    expect(setup).toEqual({ mode: "mock", source: "none" });
    expect(footerNote(setup)).toMatch(/Demo mode is on/);
  });

  it("treats a key you set yourself as OpenAI", () => {
    const setup = describeAi({ OPENAI_API_KEY: "sk-user" });
    expect(setup).toEqual({ mode: "openai", source: "openai" });
    expect(footerNote(setup)).toMatch(/An OpenAI key is set/);
  });

  it("recognizes a Netlify AI Gateway key without changing the call mode", () => {
    const setup = describeAi({
      OPENAI_API_KEY: "gateway-token",
      OPENAI_BASE_URL: "https://ai-gateway.netlify.com/",
      NETLIFY_AI_GATEWAY_URL: "https://ai-gateway.netlify.com",
    });
    expect(setup).toEqual({ mode: "openai", source: "netlify-gateway" });
    expect(footerNote(setup)).toMatch(/AI Gateway is on/);
    expect(footerNote(setup)).toMatch(/nothing is billed/);
  });

  it("matches the gateway when only the Netlify URL variable is set", () => {
    const setup = describeAi({
      OPENAI_API_KEY: "gateway-token",
      OPENAI_BASE_URL: "https://ai-gateway.netlify.com/v1",
      NETLIFY_AI_GATEWAY_BASE_URL: "https://ai-gateway.netlify.com/v1",
    });
    expect(setup.source).toBe("netlify-gateway");
  });

  it("does not treat api.openai.com as the Netlify gateway", () => {
    const setup = describeAi({
      OPENAI_API_KEY: "sk-user",
      OPENAI_BASE_URL: "https://api.openai.com/v1",
    });
    expect(setup).toEqual({ mode: "openai", source: "openai" });
  });

  it("lets AI_PROVIDER=mock win over a key", () => {
    const setup = describeAi({ AI_PROVIDER: "mock", OPENAI_API_KEY: "sk-user" });
    expect(setup).toEqual({ mode: "mock", source: "none" });
  });
});

function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
