export interface N8NAgentCreatedPayload {
  id: string;
  name: string;
  slug: string;
  domain: string;
  description: string;
  price: number;
  language: string;
  isActive: boolean;
  createdAt: string;
  webhookUrl?: string | null;
  systemPrompt?: string | null;
  scopeLimits?: string | null;
}

export async function notifyN8NAgentCreated(payload: N8NAgentCreatedPayload): Promise<void> {
  const webhookUrl = process.env.N8N_AGENT_CREATED_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[n8n] N8N_AGENT_CREATED_WEBHOOK_URL não configurado');
    return;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.N8N_API_KEY}`,
      },
      body: JSON.stringify({ action: 'agent_created', ...payload }),
      signal: AbortSignal.timeout(10_000),
    });
    console.log('[n8n] agent_created response:', res.status, res.statusText);
  } catch (err) {
    console.error('[n8n] falha ao notificar criação do agent:', err);
  }
}

export interface N8NKnowledgeUploadPayload {
  documentId: string;
  specialistId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileBase64: string;
}

export interface N8NKnowledgeDeletePayload {
  documentId: string;
  geminiFileId: string;
  specialistId: string;
}

export async function notifyN8NKnowledgeUpload(payload: N8NKnowledgeUploadPayload): Promise<void> {
  const webhookUrl = process.env.N8N_KNOWLEDGE_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('[n8n] N8N_KNOWLEDGE_WEBHOOK_URL não configurado');
    return;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.N8N_API_KEY}`,
      },
      body: JSON.stringify({ action: 'upload', ...payload }),
      signal: AbortSignal.timeout(30_000),
    });
    console.log('[n8n] upload response:', res.status, res.statusText);
  } catch (err) {
    console.error('[n8n] falha ao notificar upload:', err);
  }
}

export interface ExpertKnowledgeUploadPayload extends N8NKnowledgeUploadPayload {
  agent: {
    id: string;
    name: string;
    slug: string;
    domain: string;
  };
}

export async function notifyExpertKnowledgeUpload(payload: ExpertKnowledgeUploadPayload): Promise<void> {
  const webhookUrl = process.env.EXPERT_KNOWLEDGE_WEBHOOK_URL ?? 'https://api.desbug.com.br/in/0c08aa25-91dd-452e-83ee-529c58bcfd0c';

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upload', ...payload }),
      signal: AbortSignal.timeout(30_000),
    });
    console.log('[expert-webhook] upload response:', res.status, res.statusText);
  } catch (err) {
    console.error('[expert-webhook] falha ao notificar upload:', err);
  }
}

export async function notifyN8NKnowledgeDelete(payload: N8NKnowledgeDeletePayload): Promise<void> {
  const webhookUrl = process.env.N8N_KNOWLEDGE_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.N8N_API_KEY}`,
      },
      body: JSON.stringify({ action: 'delete', ...payload }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // fire-and-forget
  }
}

export interface N8NStreamPayload {
  message: string;
  conversationId: string;
  userId: string;
  specialistSlug: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export class N8NCircuitOpenError extends Error {
  constructor() {
    super('Circuit breaker is open — N8N temporarily unavailable');
    this.name = 'N8NCircuitOpenError';
  }
}

export class N8NTimeoutError extends Error {
  constructor() {
    super('N8N request timed out');
    this.name = 'N8NTimeoutError';
  }
}

export class N8NError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'N8NError';
  }
}

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly threshold = 5,
    private readonly resetTimeout = 60_000
  ) {}

  isOpen(): boolean {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
        return false;
      }
      return true;
    }
    return false;
  }

  onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.threshold) this.state = 'open';
  }

  getState() {
    return { state: this.state, failures: this.failures };
  }
}

const circuitBreaker = new CircuitBreaker(5, 60_000);

export function getCircuitBreakerState() {
  return circuitBreaker.getState();
}

export async function callN8NStream(payload: N8NStreamPayload): Promise<ReadableStream<Uint8Array>> {
  if (circuitBreaker.isOpen()) {
    throw new N8NCircuitOpenError();
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new N8NError('N8N_WEBHOOK_URL environment variable is not configured');
  }

  const signal = AbortSignal.timeout(Number(process.env.N8N_TIMEOUT_MS ?? 30000));

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.N8N_API_KEY}`,
      },
      signal,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      circuitBreaker.onFailure();
      throw new N8NError(`N8N returned ${response.status}`, response.status);
    }

    circuitBreaker.onSuccess();
    return response.body!;
  } catch (error) {
    if (error instanceof N8NCircuitOpenError || error instanceof N8NError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'TimeoutError') {
      circuitBreaker.onFailure();
      throw new N8NTimeoutError();
    }
    circuitBreaker.onFailure();
    throw new N8NError(error instanceof Error ? error.message : 'Unknown N8N error');
  }
}
