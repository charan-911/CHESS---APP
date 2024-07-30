const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

let onlineCount = 0;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let waitingPlayer = null;

wss.on('connection', (ws) => {
  onlineCount++;
  broadcastOnlineCount();

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === 'findMatch') {
      if (waitingPlayer) {
        const opponent = waitingPlayer;
        waitingPlayer = null;

        const gameRoom = { players: [ws, opponent] };
        gameRoom.players.forEach((player, index) => {
          player.send(JSON.stringify({
            type: 'match',
            message: 'Match found! Start playing.',
            role: index + 1, // Assign role: 1 for white, 2 for black
          }));
          player.on('message', (msg) => {
            gameRoom.players.forEach(p => {
              if (p !== player) p.send(msg);
            });
          });
        });
      } else {
        waitingPlayer = ws;
        ws.send(JSON.stringify({ type: 'waiting', message: 'Waiting for an opponent...' }));
      }
    } else if (data.type === 'signal') {
      if (waitingPlayer) {
        waitingPlayer.send(JSON.stringify(data));
      }
    }
  });

  ws.on('close', () => {
    onlineCount--;
    if (waitingPlayer === ws) waitingPlayer = null;
    broadcastOnlineCount();
  });
});

const broadcastOnlineCount = () => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'onlineCount', count: onlineCount }));
    }
  });
};

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});