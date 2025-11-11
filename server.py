import http.server
import socketserver
import ssl
import os

# Define the server address
HOST = "127.0.0.1"
PORT = 5001

# Check if certificate files exist
if not os.path.exists('cert.pem') or not os.path.exists('key.pem'):
    print("Error: Certificate files (cert.pem, key.pem) not found.")
    print("Please generate them first, for example, using openssl:")
    print('openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=US/ST=CA/L=MountainView/O=Gemini/OU=Dev/CN=127.0.0.1"')
    exit(1)

# Create a simple handler that serves files from the current directory
Handler = http.server.SimpleHTTPRequestHandler

# Create an SSL context
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain(certfile="cert.pem", keyfile="key.pem")

# Create a TCP server
with socketserver.TCPServer((HOST, PORT), Handler) as httpd:
    # Wrap the server socket with the SSL context
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    
    print(f"Serving HTTPS on https://{HOST}:{PORT}")
    print("Open this URL in your browser.")
    print("You will see a security warning, which you can safely bypass for local development.")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        httpd.server_close()
