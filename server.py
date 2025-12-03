import http.server
import socketserver
import ssl
import os

# Define the server address
HOST = "127.0.0.1"
PORT = int(os.getenv("PORT", "5001"))

# Allow plain HTTP by default; set USE_TLS=1 to require HTTPS with cert/key
USE_TLS = os.getenv("USE_TLS", "").lower() in ("1", "true", "yes")
CERT_PATH = "cert.pem"
KEY_PATH = "key.pem"

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

# Create a simple handler that serves files from the current directory
Handler = http.server.SimpleHTTPRequestHandler

def create_server():
    requested_port = PORT
    allow_fallback = os.getenv("PORT") is None  # only auto-fallback when user didn't request a port

    def bind(port):
        return ReusableTCPServer((HOST, port), Handler)

    try:
        httpd = bind(requested_port)
        actual_port = requested_port
    except OSError as err:
        if not allow_fallback:
            raise
        # Try letting the OS choose an open port
        httpd = bind(0)
        actual_port = httpd.server_address[1]
        print(f"Port {requested_port} unavailable ({err}). Falling back to {actual_port}.")

    protocol = "http"
    if USE_TLS:
        if not os.path.exists(CERT_PATH) or not os.path.exists(KEY_PATH):
            print("TLS requested but cert/key not found. Falling back to HTTP.")
        else:
            context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            context.load_cert_chain(certfile=CERT_PATH, keyfile=KEY_PATH)
            httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
            protocol = "https"

    return httpd, protocol, actual_port

try:
    server, proto, bound_port = create_server()
except OSError as err:
    print(f"Failed to bind to {HOST}:{PORT} — {err}")
    print("Try setting a different PORT env var (e.g., PORT=5002) or stop the process using the current port.")
    raise SystemExit(1)

with server:
    protocol = proto if proto in ("http", "https") else "http"

    print(f"Serving {protocol.upper()} on {protocol}://{HOST}:{bound_port}")
    if protocol == "http":
        print("Running without TLS. For HTTPS, set USE_TLS=1 and provide cert.pem/key.pem.")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        server.server_close()
