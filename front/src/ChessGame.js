import React, { useState, useEffect } from 'react';
import Chessboard from 'chessboardjsx';
import { Chess } from 'chess.js';

const ChessGame = ({ sendMessage, lastMessage, playerRole }) => {
  const [game] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [turn, setTurn] = useState('w'); // 'w' for white's turn, 'b' for black's turn

  useEffect(() => {
    if (lastMessage !== null) {
      let data;
      if (lastMessage.data instanceof Blob) {
        lastMessage.data.text().then(text => {
          data = JSON.parse(text);
          if (data.move) {
            game.move(data.move);
            setFen(game.fen());
            setTurn(game.turn());
          }
        }).catch(error => console.error('Error parsing message:', error));
      } else {
        data = JSON.parse(lastMessage.data);
        if (data.move) {
          game.move(data.move);
          setFen(game.fen());
          setTurn(game.turn());
        }
      }
    }
  }, [lastMessage, game]);

  const onDrop = ({ sourceSquare, targetSquare }) => {
    // Check if it's the correct player's turn
    if ((playerRole === 1 && turn !== 'w') || (playerRole === 2 && turn !== 'b')) {
      console.log(`Not your turn: Player ${playerRole}`);
      return;
    }

    // Ensure the piece being moved belongs to the current player
    const piece = game.get(sourceSquare);
    if ((playerRole === 1 && piece?.color !== 'w') || (playerRole === 2 && piece?.color !== 'b')) {
      console.log(`You can't move the opponent's pieces: Player ${playerRole}`);
      return;
    }

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // promote to queen if applicable
      });

      if (move === null) {
        throw new Error(`Invalid move: {from: "${sourceSquare}", to: "${targetSquare}", promotion: "q"}`);
      }

      setFen(game.fen());
      setTurn(game.turn()); // Update turn state
      sendMessage(JSON.stringify({ move }));
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <Chessboard
        position={fen}
        onDrop={onDrop}
        orientation={playerRole === 1 ? 'white' : 'black'} // Set orientation based on playerRole
      />
    </div>
  );
};

export default ChessGame;
