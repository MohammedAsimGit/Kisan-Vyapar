export interface AiAssistantQuery {
  message: string;
  context?: Record<string, unknown>;
}

export interface AiAssistantReply {
  reply: string;
}

/**
 * Contract for an AI assistant / advisory provider.
 *
 * NOTE: no concrete provider is implemented yet and no AI API key is configured.
 * Sprint 0 only establishes the boundary. An implementation may be added in a
 * later sprint behind configuration (e.g. AI_API_KEY).
 */
export interface AiService {
  getAdvice(query: AiAssistantQuery): Promise<AiAssistantReply>;
}
