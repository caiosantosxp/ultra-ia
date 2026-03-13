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
