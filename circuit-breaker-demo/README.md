# Circuit Breaker + Redis Pub/Sub Demo

A small Node.js + TypeScript microservices project demonstrating:

- Post Service -> Profile Service HTTP communication
- Failure/timeout simulation
- Circuit Breaker: CLOSED -> OPEN -> HALF_OPEN -> CLOSED
- Local circuit state
- Redis Pub/Sub for broadcasting circuit state changes
- Two Post Service instances
- Docker Compose

## Run with Docker

```bash
docker compose up --build
```

Services:

- Profile Service: http://localhost:3001
- Post Service #1: http://localhost:3002
- Post Service #2: http://localhost:3003
- Redis: localhost:6379

## Normal request

```bash
curl http://localhost:3002/posts/1
```

## Check circuit state

```bash
curl http://localhost:3002/circuit-breaker
curl http://localhost:3003/circuit-breaker
```

## Make Profile Service fail

```bash
curl -X POST http://localhost:3001/admin/failure \
  -H "Content-Type: application/json" \
  -d '{"mode":"error"}'
```

Now call the Post Service 3 times:

```bash
curl http://localhost:3002/posts/1
curl http://localhost:3002/posts/1
curl http://localhost:3002/posts/1
```

The third failure opens the circuit. A circuit-open response should then happen without an HTTP request to Profile Service.

Because the state change is published through Redis Pub/Sub, Post Service #2 also receives the OPEN event.

Check:

```bash
curl http://localhost:3003/circuit-breaker
```

## Recover Profile Service

```bash
curl -X POST http://localhost:3001/admin/failure \
  -H "Content-Type: application/json" \
  -d '{"mode":"none"}'
```

Wait 10 seconds. The next request becomes the HALF_OPEN probe.

If successful:

```text
HALF_OPEN -> CLOSED
```

## Important design decision

Redis Pub/Sub is used to broadcast circuit state changes. The actual circuit state is kept locally inside each Post Service instance.

This keeps the circuit breaker functional even if Redis becomes temporarily unavailable.

## Suggested experiments

1. Run only one Post Service and understand the state machine.
2. Run both Post Service instances.
3. Break Profile Service and watch Redis synchronize OPEN.
4. Try timeout mode.
5. Change failure threshold from 3 to 5.
6. Change reset timeout.
7. Add request metrics.
8. Add automated tests for CLOSED/OPEN/HALF_OPEN.
9. Add a fallback response or cached profile.
