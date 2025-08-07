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

// Utility function: finds all empty indices
function getAvailableMoves(squares) {
  return squares
    .map((val, idx) => (val === null ? idx : null))
    .filter((idx) => idx !== null);
}

// Bare minimum AI: Try to win, then block, else random.
// For Tic-Tac-Toe, minimax is overkill, rule-based + fallback to random is enough.
function computeAIMove(squares, aiMark, humanMark) {
  const avail = getAvailableMoves(squares);

  // Helper: place mark on new board, check for win
  const tryMoveFor = (board, mark) =>
    avail.find(idx => {
      const copy = board.slice();
      copy[idx] = mark;
      const result = calculateWinner(copy);
      return result && result.winner === mark;
    });

  // 1. Win if possible
  const winningMove = tryMoveFor(squares, aiMark);
  if (winningMove !== undefined) return winningMove;
  // 2. Block if human can win
  const blockMove = tryMoveFor(squares, humanMark);
  if (blockMove !== undefined) return blockMove;
  // 3. Take center if available
  if (squares[4] === null) return 4;
  // 4. Take random
  return avail[Math.floor(Math.random() * avail.length)];
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

/**
 * App Root - Enhanced for Human vs Human or Human vs AI
 */
function App() {
  const [theme, setTheme] = useState('light');
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [isX, setIsX] = useState(true); // true: X, false: O
  const [playerSide, setPlayerSide] = useState('X'); // User's symbol
  const [status, setStatus] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [winLine, setWinLine] = useState(null);
  const [gameMode, setGameMode] = useState('human'); // 'human' | 'ai'
  // If vs AI: track whether it's AI's turn; User always plays as 'playerSide'; AI is the other
  const [aiThinking, setAiThinking] = useState(false);

  // Apply the theme to the document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Evaluate game state after every move (status, winner, draw)
  useEffect(() => {
    const result = calculateWinner(squares);
    if (result) {
      if (result.winner) {
        setStatus(`Winner: ${result.winner}${gameMode === 'ai' ? (result.winner === playerSide ? ' (You)' : ' (AI)') : ''}`);
        setGameOver(true);
        setWinLine(result.line);
      } else if (result.draw) {
        setStatus("It's a draw!");
        setGameOver(true);
        setWinLine(null);
      }
      setAiThinking(false); // Defensive: clear thinking after end
    } else {
      if (gameMode === 'ai') {
        const whoseTurnIs = isX ? 'X' : 'O';
        if (whoseTurnIs === playerSide) {
          setStatus(`Your turn (${playerSide})`);
          setAiThinking(false);
        } else {
          setStatus("AI's turn...");
        }
      } else {
        setStatus(`Turn: ${isX ? 'X' : 'O'}`);
      }
    }
  }, [squares, isX, gameMode, playerSide]);

  // AI move effect: When in AI mode and it's AI's turn, trigger AI move after short delay
  useEffect(() => {
    if (gameOver || gameMode !== 'ai') {
      setAiThinking(false); // Defensive
      return;
    }
    const aiMark = playerSide === 'X' ? 'O' : 'X';
    const isAITurn = (isX && aiMark === 'X') || (!isX && aiMark === 'O');
    if (isAITurn) {
      setAiThinking(true);
      // Short delay to look "human"
      const moveTimeout = setTimeout(() => {
        const idx = computeAIMove(squares, aiMark, playerSide);
        if (typeof idx === 'number') {
          const next = squares.slice();
          next[idx] = aiMark;
          setSquares(next);
          setIsX(x => !x);
        }
        setAiThinking(false);
      }, 500);
      return () => clearTimeout(moveTimeout);
    }
    setAiThinking(false);
  }, [squares, isX, gameMode, gameOver, playerSide]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  // PUBLIC_INTERFACE
  const handleSquareClick = (idx) => {
    if (squares[idx] || gameOver) return;
    // Human-vs-human: allow both turns; vs-AI: only allow human's turn
    if (gameMode === 'ai') {
      const playerTurn = (isX && playerSide === 'X') || (!isX && playerSide === 'O');
      if (!playerTurn || aiThinking) return;
    }
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
    if (gameMode === 'ai') setAiThinking(false);
    setStatus(gameMode === 'ai'
      ? (playerSide === 'X' ? 'Your turn (X)' : "AI's turn...")
      : `Turn: ${playerSide}`
    );
    setWinLine(null);
  };

  // PUBLIC_INTERFACE
  const handleChooseSide = (side) => {
    setPlayerSide(side);
    setIsX(side === 'X');
    setSquares(Array(9).fill(null));
    setGameOver(false);
    if (gameMode === 'ai') setAiThinking(side !== 'X'); // if O: AI first
    setStatus(gameMode === 'ai'
      ? (side === 'X' ? 'Your turn (X)' : "AI's turn...")
      : `Turn: ${side}`
    );
    setWinLine(null);
  };

  // PUBLIC_INTERFACE
  const handleModeChange = (mode) => {
    setGameMode(mode);
    setSquares(Array(9).fill(null));
    setIsX(playerSide === 'X');
    setGameOver(false);
    setAiThinking(mode === 'ai' && playerSide !== 'X'); // if AI goes first
    setStatus(mode === 'ai'
      ? (playerSide === 'X' ? 'Your turn (X)' : "AI's turn…")
      : `Turn: ${playerSide}`
    );
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
          {/* Mode selector */}
          <div className="player-choice" style={{marginRight: 14}}>
            <span className="label">Play vs:</span>
            <button
              className={`choice-btn${gameMode === 'human' ? ' active' : ''}`}
              onClick={() => handleModeChange('human')}
              disabled={squares.some(Boolean) && !gameOver}
              aria-pressed={gameMode === 'human'}
            >
              Human
            </button>
            <button
              className={`choice-btn${gameMode === 'ai' ? ' active' : ''}`}
              onClick={() => handleModeChange('ai')}
              disabled={squares.some(Boolean) && !gameOver}
              aria-pressed={gameMode === 'ai'}
            >
              AI
            </button>
          </div>
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
            disabled={gameOver || (gameMode === 'ai' && ((isX && playerSide !== 'X') || (!isX && playerSide !== 'O')) && !gameOver)}
            winLine={winLine}
          />
          <div className="status-message" data-testid="status-message" aria-live="polite">
            {status}
            {gameMode === 'ai' && !gameOver &&
              <span style={{fontSize: '0.96em', display: 'block', color: '#656d78', marginTop: 2}}>
                (You: {playerSide}, AI: {playerSide === 'X' ? 'O' : 'X'})
              </span>
            }
          </div>
        </main>
      </header>
    </div>
  );
}

export default App;
