import express from "express";

const app = express();
app.use(express.json());

const port = Number(process.env.PORT ?? 3001);

const profiles = new Map([
  ["101", { id: 101, name: "Ankit", bio: "Backend Engineer" }],
  ["102", { id: 102, name: "Rahul", bio: "Software Engineer" }]
]);

let failureMode: "none" | "error" | "timeout" = "none";
let delayMs = 0;

app.get("/profiles/:userId", async (req, res) => {
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  if (failureMode === "timeout") {
    await new Promise((resolve) => setTimeout(resolve, 30_000));
    return;
  }

  if (failureMode === "error") {
    console.log("Hello");
    return res.status(503).json({
      error: "Profile service is intentionally failing"
    });
  }

  const profile = profiles.get(req.params.userId);

  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  return res.json(profile);
});

app.get("/admin/failure", (_req, res) => {
  res.json({ failureMode, delayMs });
});

app.post("/admin/failure", (req, res) => {
  const mode = req.body.mode;
  const allowed = ["none", "error", "timeout"];

  if (!allowed.includes(mode)) {
    return res.status(400).json({
      error: "mode must be one of: none, error, timeout"
    });
  }

  failureMode = mode;
  delayMs = Number(req.body.delayMs ?? 0);

  return res.json({ failureMode, delayMs });
});

app.get("/health", (_req, res) => {
  res.json({ service: "profile-service", status: "UP" });
});

app.listen(port, () => {
  console.log(`Profile service running on port ${port}`);
});
