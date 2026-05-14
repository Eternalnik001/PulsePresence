import json
import urllib.request
import os
from http.server import SimpleHTTPRequestHandler, HTTPServer
from urllib.error import HTTPError

# Read from .env if present (local dev)
env_file = ".env"
if os.path.exists(env_file):
    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key] = val

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")


class ProxyHandler(SimpleHTTPRequestHandler):
    """
    PulsePresence BFF Proxy.
    - Serves static files (index.html, css/, js/, data/)
    - Proxies POST /api/chat to OpenAI, injecting the API key server-side.
    """

    def do_POST(self):
        if self.path == "/api/chat":
            content_length = int(self.headers["Content-Length"])
            post_data = self.rfile.read(content_length)

            try:
                req_json = json.loads(post_data)

                system_prompt = req_json.get("system_prompt", "")
                user_prompt = req_json.get("user_prompt", "")

                openai_body = json.dumps({
                    "model": req_json.get("model", "gpt-4o-mini"),
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "max_tokens": req_json.get("max_tokens", 100),
                    "temperature": req_json.get("temperature", 0.85),
                }).encode("utf-8")

                req = urllib.request.Request(
                    "https://api.openai.com/v1/chat/completions",
                    data=openai_body,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {OPENAI_API_KEY}",
                    },
                )

                with urllib.request.urlopen(req) as response:
                    res_data = response.read()
                    self.send_response(200)
                    self.send_header("Content-type", "application/json")
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(res_data)

            except HTTPError as e:
                self.send_response(e.code)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(e.read())
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    server_address = ("", port)
    httpd = HTTPServer(server_address, ProxyHandler)
    print(f"PulsePresence proxy serving on port {port}...")
    httpd.serve_forever()
