"""Local project server with automatic fallback if Windows blocks the default port."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
import argparse,functools,webbrowser
ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    extensions_map={**SimpleHTTPRequestHandler.extensions_map,'.wasm':'application/wasm','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.py':'text/plain;charset=utf-8'}
    def end_headers(self):
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Cache-Control','no-cache')
        super().end_headers()
def create_server(port=8765,lan=False):
    host='0.0.0.0' if lan else '127.0.0.1'
    handler=functools.partial(Handler,directory=str(ROOT))
    last_error=None
    for candidate in dict.fromkeys([port,8765,8088,0]):
        try:return ThreadingHTTPServer((host,candidate),handler)
        except OSError as error:
            last_error=error
            print(f'Port {candidate} is unavailable. Trying another port...',flush=True)
    raise OSError('Windows could not open a local server. Check your network/security settings or use the HTTPS game link.') from last_error
if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=8765)
    parser.add_argument('--lan',action='store_true',help='Share this folder with devices on your Wi-Fi.')
    parser.add_argument('--no-browser',action='store_true')
    args=parser.parse_args()
    try:server=create_server(args.port,args.lan)
    except OSError as error:raise SystemExit(str(error))
    url=f'http://localhost:{server.server_port}/index.html'
    print('BITBOUND Python Practice:',url,flush=True)
    if args.lan:print(f'On your Wi-Fi, students can use http://YOUR-PC-LAN-IP:{server.server_port}/index.html. Offline saving on phones needs HTTPS.',flush=True)
    print('Leave this window open. Press Ctrl+C to stop.',flush=True)
    if not args.no_browser:webbrowser.open(url)
    try:server.serve_forever()
    except KeyboardInterrupt:server.server_close()
