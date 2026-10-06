import { createClient, type RedisClientType } from "redis";
import type { CircuitState } from "./circuit-breaker.js";

export const CIRCUIT_CHANNEL = "circuit-breaker-events";

export type CircuitEvent = {
  source: string;
  service: string;
  state: CircuitState;
  timestamp: number;
};

export class RedisCircuitEvents {
  private publisher: RedisClientType | null = null;
  private subscriber: RedisClientType | null = null;

  constructor(
    private readonly redisUrl: string,
    private readonly instanceId: string,
    private readonly onEvent: (event: CircuitEvent) => void
  ) {}

  async connect() {
    this.publisher = createClient({ url: this.redisUrl });
    this.subscriber = this.publisher.duplicate();

    this.publisher.on("error", (err) => {
      console.error("[REDIS PUBLISHER]", err.message);
    });

    this.subscriber.on("error", (err) => {
      console.error("[REDIS SUBSCRIBER]", err.message);
    });

    await this.publisher.connect();
    await this.subscriber.connect();

    await this.subscriber.subscribe(CIRCUIT_CHANNEL, (message) => {
      try {
        const event = JSON.parse(message) as CircuitEvent;

        if (event.source === this.instanceId) return;

        console.log(
          `[REDIS] received ${event.service} => ${event.state} from ${event.source}`
        );

        this.onEvent(event);
      } catch {
        console.error("[REDIS] Invalid circuit event");
      }
    });

    console.log(`[REDIS] ${this.instanceId} subscribed to ${CIRCUIT_CHANNEL}`);
  }

  async publish(service: string, state: CircuitState) {
    if (!this.publisher) {
      throw new Error("Redis publisher is not connected");
    }

    const event: CircuitEvent = {
      source: this.instanceId,
      service,
      state,
      timestamp: Date.now()
    };

    await this.publisher.publish(
      CIRCUIT_CHANNEL,
      JSON.stringify(event)
    );

    console.log(`[REDIS] published ${service} => ${state}`);
  }
}
