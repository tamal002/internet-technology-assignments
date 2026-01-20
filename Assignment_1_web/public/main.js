const logEl = document.getElementById("log");
const putForm = document.getElementById("put-form");
const getForm = document.getElementById("get-form");
const putKeyInput = document.getElementById("put-key");
const putValueInput = document.getElementById("put-value");
const getKeyInput = document.getElementById("get-key");


function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  logEl.textContent = `${timestamp}  ${message}\n${logEl.textContent}`;
}

async function putKeyValue(key, value) {
  const res = await fetch("/api/put", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Put failed");
  }
  return res.json();
}

async function getKeyValue(key) {
  const res = await fetch(`/api/get?key=${encodeURIComponent(key)}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Get failed");
  }
  return res.json();
}

putForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const key = putKeyInput.value.trim();
  const value = putValueInput.value.trim();
  if (!key || !value) {
    log("Key and value are required.");
    return;
  }
  try {
    const result = await putKeyValue(key, value);
    log(`PUT stored { ${result.stored.key}: ${result.stored.value} }`);
    putValueInput.value = "";
  } catch (err) {
    log(err.message);
  }
});

getForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const key = getKeyInput.value.trim();
  if (!key) {
    log("Key is required.");
    return;
  }
  try {
    const result = await getKeyValue(key);
    if (result.value === null || result.value === undefined) {
      log(`GET ${key}: <blank>`);
    } else {
      log(`GET ${key}: ${result.value}`);
    }
  } catch (err) {
    log(err.message);
  }
});
