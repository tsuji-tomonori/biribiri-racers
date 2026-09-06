"""Serve the static build at its Pages base for deterministic browser tests."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        self.directory = 'dist'
        clean = urlsplit(path).path
        prefix = '/biribiri-racers'
        if clean == prefix or clean.startswith(prefix + '/'):
            clean = clean[len(prefix):] or '/'
        return super().translate_path(clean)


ThreadingHTTPServer(('127.0.0.1', 4321), Handler).serve_forever()
