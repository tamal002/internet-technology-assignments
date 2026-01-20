const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory map of clientId -> Map of key/value pairs.
const userStores = new Map();

// Middleware to parse JSON bodies
app.use(express.json());

// Simple cookie parser
function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const [name, ...rest] = part.split("=");
      acc[decodeURIComponent(name)] = decodeURIComponent(rest.join("="));
      return acc;
    }, {});
}

// Attach / create a clientId cookie so each browser session has its own store.
app.use((req, res, next) => {
  const cookies = parseCookies(req.headers.cookie || "");
  let clientId = cookies.clientId;
  if (!clientId) {
    clientId = crypto.randomUUID();
    res.cookie("clientId", clientId, {
      httpOnly: true,
      sameSite: "lax",
    });
  }
  if (!userStores.has(clientId)) {
    userStores.set(clientId, new Map());
  }
  req.clientId = clientId;
  next();
});


app.post("/api/put", (req, res) => {
  const { key, value } = req.body || {};
  if (typeof key !== "string" || typeof value !== "string") {
    return res.status(400).json({ error: "key and value must be strings" });
  }
  const store = userStores.get(req.clientId);
  store.set(key, value);
  return res.json({ status: "ok", stored: { key, value } });
});

app.use(express.json());

app.get("/api/get", (req, res) => {
  const { key } = req.query;
  if (typeof key !== "string") {
    return res.status(400).json({ error: "key is required" });
  }
  const store = userStores.get(req.clientId);
  const value = store.get(key);
  return res.json({ key, value: value ?? null });
});

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Key-value store web server running on http://localhost:${PORT}`);
});
