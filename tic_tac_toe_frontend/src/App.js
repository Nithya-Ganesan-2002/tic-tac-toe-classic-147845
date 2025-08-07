import React, { useState, useEffect } from 'react';
import './App.css';

/**
 * Color palette (used in CSS as well):
 *   --primary:    #1976d2 (blue)
 *   --secondary:  #424242 (dark gray)
 *   --accent:     #ff4081 (pink accent)
 */

// Utility function: checks for a winner
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6],            // diags
  ];
  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  if (squares.every(Boolean)) return { winner: null, draw: true };
  return null;
}

// PUBLIC_INTERFACE
function TicTacToeBoard({ squares, onSquareClick, disabled, winLine }) {
  return (
    <div className="ttt-board">
      {squares.map((v, idx) => {
        let classExtra = '';
        if (winLine && winLine.includes(idx)) classExtra = 'winner';
        return (
          <button
            key={idx}
            className={`ttt-square ${classExtra}`}
            onClick={() => !disabled && !v && onSquareClick(idx)}
            disabled={disabled || Boolean(v)}
            tabIndex={0}
            aria-label={`Square ${idx+1}: ${v ? v : 'empty'}`}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

// PUBLIC_INTERFACE
function PlayerChoice({ onChoose, current, disabled }) {
  return (
    <div className="player-choice">
      <span className="label">Play as:</span>
      <button
        className={`choice-btn${current === 'X' ? ' active' : ''}`}
        onClick={() => onChoose('X')}
        disabled={disabled}
        aria-pressed={current === 'X'}
      >X</button>
      <button
        className={`choice-btn${current === 'O' ? ' active' : ''}`}
        onClick={() => onChoose('O')}
        disabled={disabled}
        aria-pressed={current === 'O'}
      >O</button>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [isX, setIsX] = useState(true); // true: X, false: O
  const [playerSide, setPlayerSide] = useState('X');
  const [status, setStatus] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [winLine, setWinLine] = useState(null);

  // Apply the theme to the document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Evaluate game state after every move
  useEffect(() => {
    const result = calculateWinner(squares);
    if (result) {
      if (result.winner) {
        setStatus(`Winner: ${result.winner}`);
        setGameOver(true);
        setWinLine(result.line);
      } else if (result.draw) {
        setStatus("It's a draw!");
        setGameOver(true);
        setWinLine(null);
      }
    } else {
      setStatus(`Turn: ${isX ? 'X' : 'O'}`);
    }
  }, [squares, isX]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  // PUBLIC_INTERFACE
  const handleSquareClick = (idx) => {
    if (squares[idx] || gameOver) return;
    const next = squares.slice();
    next[idx] = isX ? 'X' : 'O';
    setSquares(next);
    setIsX((x) => !x);
  };

  // PUBLIC_INTERFACE
  const handleNewGame = () => {
    setSquares(Array(9).fill(null));
    setIsX(playerSide === 'X');
    setGameOver(false);
    setStatus(`Turn: ${playerSide}`);
    setWinLine(null);
  };

  // PUBLIC_INTERFACE
  const handleChooseSide = (side) => {
    setPlayerSide(side);
    setIsX(side === 'X');
    setSquares(Array(9).fill(null));
    setGameOver(false);
    setStatus(`Turn: ${side}`);
    setWinLine(null);
  };

  // Keyboard accessibility: R for reset, T for toggle theme
  useEffect(() => {
    const keyListener = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      if (e.key === 'r' || e.key === 'R') handleNewGame();
      if (e.key === 't' || e.key === 'T') toggleTheme();
    };
    window.addEventListener('keydown', keyListener);
    return () => window.removeEventListener('keydown', keyListener);
  });

  return (
    <div className="App">
      <header className="App-header-minimal">
        <div className="ttt-title-container">
          <h1 className="ttt-title" data-testid="ttt-title">Tic Tac Toe</h1>
        </div>
        <div className="controls-bar">
          <PlayerChoice
            onChoose={handleChooseSide}
            current={playerSide}
            disabled={squares.some(Boolean) && !gameOver}
          />
          <button
            className="icon-btn"
            onClick={handleNewGame}
            aria-label="Start new game"
            disabled={!squares.some(Boolean) && !gameOver}
            style={{ marginLeft: 8 }}
          >
            <span role="img" aria-label="reset">🔄</span> New Game
          </button>
          <button
            className="icon-btn theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            style={{ marginLeft: 'auto' }}
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>

        <main className="ttt-main">
          <TicTacToeBoard
            squares={squares}
            onSquareClick={handleSquareClick}
            disabled={gameOver}
            winLine={winLine}
          />
          <div className="status-message">
            {status}
          </div>
        </main>
      </header>
    </div>
  );
}

export default App;
