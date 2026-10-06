import express from "express";
import { CircuitBreaker, CircuitOpenError } from "./circuit-breaker.js";
import { ProfileClient } from "./profile-client.js";
import { RedisCircuitEvents } from "./redis-events.js";

const app = express();
app.use(express.json());

const port = Number(process.env.PORT ?? 3002);
const profileServiceUrl =
  process.env.PROFILE_SERVICE_URL ?? "http://localhost:3001";
const redisUrl =
  process.env.REDIS_URL ?? "redis://localhost:6379";
const instanceId =
  process.env.INSTANCE_ID ?? `post-${process.pid}`;

const posts = new Map([
  ["1", {
    id: 1,
    content: "Learning distributed systems",
    authorId: "101"
  }],
  ["2", {
    id: 2,
    content: "Building a circuit breaker",
    authorId: "102"
  }]
]);

let redisEvents: RedisCircuitEvents;

const breaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 10_000,
  onStateChange: (state) => {
    void redisEvents?.publish("profile-service", state);
  }
});

const profileClient = new ProfileClient(profileServiceUrl, 2_000);

app.get("/posts/:postId", async (req, res) => {
  const post = posts.get(req.params.postId);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    const profile = await breaker.execute(() =>
      profileClient.getProfile(post.authorId)
    );

    return res.json({
      ...post,
      author: profile
    });
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      return res.status(503).json({
        error: "Profile service temporarily unavailable",
        reason: "circuit-open"
      });
    }

    console.error(`[${instanceId}] Profile request failed`);

    return res.status(503).json({
      error: "Unable to fetch profile",
      reason: "profile-service-failure"
    });
  }
});

app.get("/circuit-breaker", (_req, res) => {
  return res.json({
    instanceId,
    service: "profile-service",
    ...breaker.snapshot()
  });
});

app.get("/health", (_req, res) => {
  return res.json({
    service: "post-service",
    instanceId,
    status: "UP"
  });
});

async function start() {
  redisEvents = new RedisCircuitEvents(
    redisUrl,
    instanceId,
    (event) => {
      if (event.service === "profile-service") {
        breaker.applyRemoteState(event.state);
      }
    }
  );

  await redisEvents.connect();

  app.listen(port, () => {
    console.log(
      `Post service ${instanceId} running on port ${port}`
    );
  });
}

start().catch((error) => {
  console.error("Failed to start post service", error);
  process.exit(1);
});
