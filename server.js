/**
 * Custom Next.js server with an independent WebSocket relay.
 *
 * HTTP (Next.js)  →  port 3000  (or $PORT)
 * WebSocket relay →  port 3001  (or $WS_PORT)
 *
 * Keeping them on separate ports avoids any conflict with Next.js's
 * internal HMR WebSocket, which also runs on the HTTP port in dev mode.
 */

const { createServer } = require('http');
const { parse }        = require('url');
const next             = require('next');
const { WebSocketServer } = require('ws');

const dev     = process.env.NODE_ENV !== 'production';
const port    = parseInt(process.env.PORT    || '3000', 10);
const wsPort  = parseInt(process.env.WS_PORT || '3001', 10);
const app     = next({ dev });
const handle  = app.getRequestHandler();

// ── In-memory room state ──────────────────────────────────────────────────────
// roomCode → { state: object|null, clients: Set<WebSocket> }
const rooms = new Map();

function getRoom(code) {
  if (!rooms.has(code)) rooms.set(code, { state: null, clients: new Set() });
  return rooms.get(code);
}

// ── Start both servers ────────────────────────────────────────────────────────

app.prepare().then(() => {

  // ── HTTP / Next.js ──────────────────────────────────────────────────────────
  const httpServer = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  });

  httpServer.listen(port, () => {
    console.log(`\n> Next.js ready on http://localhost:${port}`);
  });

  // ── WebSocket relay (own port, zero conflict with HMR) ─────────────────────
  const wss = new WebSocketServer({ port: wsPort });

  wss.on('connection', (ws, req) => {
    const url      = new URL(req.url, `http://localhost:${wsPort}`);
    const roomCode = url.searchParams.get('room')?.toUpperCase();

    if (!roomCode) { ws.close(); return; }

    const room = getRoom(roomCode);
    room.clients.add(ws);

    // Send current state immediately to new joiner
    if (room.state) {
      ws.send(JSON.stringify({ type: 'state', state: room.state }));
    }

    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); }
      catch { return; }

      if (msg.type === 'state') {
        if (!room.state || msg.state.version >= room.state.version) {
          room.state = msg.state;
        }
        for (const client of room.clients) {
          if (client !== ws && client.readyState === 1 /* OPEN */) {
            client.send(JSON.stringify({ type: 'state', state: msg.state }));
          }
        }
      }

      if (msg.type === 'hello') {
        for (const client of room.clients) {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify(msg));
          }
        }
      }
    });

    ws.on('close', () => {
      room.clients.delete(ws);
      if (room.clients.size === 0) rooms.delete(roomCode);
    });

    ws.on('error', (err) => console.error(`[ws:${roomCode}]`, err.message));
  });

  wss.on('listening', () => {
    console.log(`> WebSocket relay on  ws://localhost:${wsPort}`);
    console.log('> No external services — share your local URL to play!\n');
  });

  wss.on('error', (err) => console.error('[WebSocketServer]', err));
});
