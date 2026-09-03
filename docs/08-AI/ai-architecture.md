# Kisan Vyapar — AI Architecture

## Status

**No AI system is implemented.** No AI API key is configured, nothing is called,
and no feature depends on a model. Sprint 0 only reserves a clean boundary.

## Intended role of AI (Future)

Later sprints may add AI-assisted guidance that makes the platform more usable for
people with limited digital literacy. Candidate directions:

- A **farmer-facing advisor**: plain-language help on listing produce, reading a
  selling opportunity, or understanding what a number means.
- **Voice interaction** (voice queries in English / Hindi / Kannada / Marathi) so a
  user can speak instead of type.
- **Natural-language explanations** of matching/net-realization outputs already
  produced by deterministic algorithms.

## Guardrails (design intent)

- AI is an *assistant*, never the source of market truth. Prices and costs come
  from deterministic providers (mandi, maps, logistics); AI explains and guides.
- User data sent to any external AI provider must be minimized and consented.
- Any AI provider API key is server-side only (`AI_API_KEY`, future) and never in
  client code.
- Responses must be reviewable; fabricated numbers are unacceptable.

## Boundary established in Sprint 0

`src/services/ai/types.ts`:

- `AiService` — `getAdvice(query: AiAssistantQuery): Promise<AiAssistantReply>`
- `AiAssistantQuery` — a message plus optional structured context.
- `AiAssistantReply` — a text reply.

A concrete implementation (HTTP adapter to a chosen provider, or a wrapper over an
on-prem model) will be added later behind configuration and this interface.

## Not in scope (explicitly deferred)

- Prompt design and evaluation.
- Voice capture/transcription pipeline.
- Multilingual generation.
- Any training or fine-tuning.
