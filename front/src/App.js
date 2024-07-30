import React, { useState } from 'react';
import useWebSocket from 'react-use-websocket';
import './App.css';
import ChessGame from './ChessGame';

function App() {
  const [onlineCount, setOnlineCount] = useState(0);
  const [status, setStatus] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerRole, setPlayerRole] = useState(null);

  const { sendMessage, lastMessage } = useWebSocket('ws://localhost:5000', {
    onOpen: () => {
      console.log('WebSocket connection established.');
      setStatus('Connected');
    },
    onMessage: async (event) => {
      let data;
      if (event.data instanceof Blob) {
        data = JSON.parse(await event.data.text());
      } else {
        data = JSON.parse(event.data);
      }
      handleMessage(data);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      setStatus('Connection error');
    },
    shouldReconnect: (closeEvent) => true,
  });

  const handleMessage = (data) => {
    console.log('data', data.type);
    switch (data.type) {
      case 'onlineCount':
        setOnlineCount(data.count);
        break;
      case 'match':
        setStatus(data.message);
        setIsPlaying(true);
        setPlayerRole(data.role);
        break;
      case 'waiting':
        setStatus(data.message);
        break;
      default:
        break;
    }
  };

  const handlePlayChess = () => {
    sendMessage(JSON.stringify({ type: 'findMatch' }));
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome</h1>
        <p>Total people online: {onlineCount}</p>
        {!isPlaying && <button onClick={handlePlayChess}>Play Chess</button>}
        <p>{status}</p>
        {isPlaying && (
          <>
            <ChessGame sendMessage={sendMessage} lastMessage={lastMessage} playerRole={playerRole} />
          </>
        )}
      </header>
    </div>
  );
}

export default App;
