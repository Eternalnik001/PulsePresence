import os
import json
import urllib.request
import urllib.error
import ssl
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn
import sys

# Bypass SSL verification for local dev if needed
ssl_context = ssl._create_unverified_context()

# Read from .env if present (local dev)
env_file = ".env"
if os.path.exists(env_file):
    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL   = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_URL     = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
PORT           = int(os.environ.get("PORT", 8080))


def messages_to_gemini(messages):
    """
    Convert OpenAI-style messages to Gemini's contents format.
    Gemini uses:
      - system_instruction (top-level, not in contents)
      - contents: [{role: 'user'|'model', parts: [{text: '...'}]}]
    """
    system_instruction = None
    contents = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "system":
            # Concatenate multiple system messages
            system_instruction = (system_instruction + "\n\n" + content) if system_instruction else content
        elif role == "assistant":
            contents.append({"role": "model", "parts": [{"text": content}]})
        else:  # user (or anything else)
            contents.append({"role": "user", "parts": [{"text": content}]})
    return system_instruction, contents


class PulsePresenceHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        sys.stdout.write(f"[{self.address_string()}] {format % args}\n")
        sys.stdout.flush()

    def _send_json(self, code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            return self._send_json(200, {"status": "ok", "service": "pulsepresence", "model": GEMINI_MODEL})
        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/chat":
            return self._handle_chat()
        return self._send_json(404, {"error": "not found"})

    def _handle_chat(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(length).decode("utf-8")
            body = json.loads(raw_body)
        except Exception as e:
            return self._send_json(400, {"error": f"invalid request body: {e}"})

        if not GEMINI_API_KEY:
            return self._send_json(500, {"error": "GEMINI_API_KEY not configured"})

        messages = body.get("messages")
        if not isinstance(messages, list) or len(messages) == 0:
            return self._send_json(400, {"error": "messages field required"})

        max_tokens  = int(body.get("max_tokens", 200))
        temperature = float(body.get("temperature", 0.85))

        system_instruction, contents = messages_to_gemini(messages)

        gemini_payload = {
            "contents": contents,
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "temperature": temperature,
            },
        }
        if system_instruction:
            gemini_payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        req = urllib.request.Request(
            GEMINI_URL,
            data=json.dumps(gemini_payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY,
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=15, context=ssl_context) as response:
                data = json.loads(response.read().decode("utf-8"))
                # Extract text from Gemini's response shape
                candidates = data.get("candidates", [])
                if not candidates:
                    return self._send_json(502, {"error": "Gemini returned no candidates", "raw": data})
                parts = candidates[0].get("content", {}).get("parts", [])
                text = "".join(p.get("text", "") for p in parts).strip()
                if not text:
                    return self._send_json(502, {"error": "Gemini returned empty text"})
                return self._send_json(200, {"content": text})
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            sys.stdout.write(f"Gemini HTTPError {e.code}: {err_body}\n")
            return self._send_json(502, {"error": f"Gemini returned {e.code}", "detail": err_body[:300]})
        except urllib.error.URLError as e:
            sys.stdout.write(f"Gemini URLError: {e}\n")
            return self._send_json(504, {"error": "Gemini timeout"})
        except Exception as e:
            sys.stdout.write(f"Gemini Exception: {e}\n")
            return self._send_json(500, {"error": "internal error"})


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True


if __name__ == "__main__":
    print(f"PulsePresence BFF starting on 0.0.0.0:{PORT}")
    print(f"Gemini key configured: {bool(GEMINI_API_KEY)}")
    print(f"Gemini model: {GEMINI_MODEL}")
    httpd = ThreadedHTTPServer(("0.0.0.0", PORT), PulsePresenceHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        httpd.shutdown()
