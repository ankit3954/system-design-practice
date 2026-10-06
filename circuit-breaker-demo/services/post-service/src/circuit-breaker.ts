export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

type CircuitBreakerOptions = {
  failureThreshold: number;
  resetTimeoutMs: number;
  onStateChange?: (state: CircuitState) => void;
};

export class CircuitOpenError extends Error {
  constructor() {
    super("Circuit breaker is OPEN");
    this.name = "CircuitOpenError";
  }
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private openedAt = 0;
  private halfOpenProbeInProgress = false;

  constructor(private readonly options: CircuitBreakerOptions) {}

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  private changeState(nextState: CircuitState) {
    if (this.state === nextState) return;

    this.state = nextState;
    console.log(`[CIRCUIT] ${nextState}`);
    this.options.onStateChange?.(nextState);
  }

  private canAttempt(): boolean {
    if (this.state === "CLOSED") return true;

    if (this.state === "OPEN") {
      const elapsed = Date.now() - this.openedAt;

      if (elapsed >= this.options.resetTimeoutMs) {
        this.changeState("HALF_OPEN");
        this.halfOpenProbeInProgress = false;
      } else {
        return false;
      }
    }

    if (this.state === "HALF_OPEN") {
      if (this.halfOpenProbeInProgress) return false;
      this.halfOpenProbeInProgress = true;
    }

    return true;
  }

  private recordSuccess() {
    this.failureCount = 0;
    this.halfOpenProbeInProgress = false;

    if (this.state !== "CLOSED") {
      this.changeState("CLOSED");
    }
  }

  private recordFailure() {
    this.halfOpenProbeInProgress = false;

    if (this.state === "HALF_OPEN") {
      this.openedAt = Date.now();
      this.changeState("OPEN");
      return;
    }

    this.failureCount += 1;

    console.log(`[CIRCUIT] failure count = ${this.failureCount}`);

    if (this.failureCount >= this.options.failureThreshold) {
      this.openedAt = Date.now();
      this.changeState("OPEN");
    }
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.canAttempt()) {
      throw new CircuitOpenError();
    }

    try {
      const result = await operation();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  applyRemoteState(state: CircuitState) {
    if (state === "OPEN") {
      this.openedAt = Date.now();
      this.failureCount = this.options.failureThreshold;
      this.halfOpenProbeInProgress = false;
      this.changeState("OPEN");
      return;
    }

    if (state === "CLOSED") {
      this.failureCount = 0;
      this.halfOpenProbeInProgress = false;
      this.changeState("CLOSED");
    }
  }

  snapshot() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      openedAt: this.openedAt
    };
  }
}
