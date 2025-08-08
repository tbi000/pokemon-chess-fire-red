// App.jsx
import React, { useState, useEffect } from "react";
import { Chess } from "chess.js";

// Pokémon mapping (Kanto / Fire-themed choices). Using PokeAPI sprite IDs.
const POKEMON_MAP = {
  p: 58, // Growlithe
  r: 59, // Arcanine
  n: 136, // Flareon
  b: 78, // Rapidash
  q: 38, // Ninetales
  k: 6, // Charizard
};

// Helper to get sprite URL for a given pokemon id and color (white/black)
const spriteUrl = (id, side = "w") => {
  // Using PokeAPI raw sprite repository.
  // Front sprites for white pieces, back sprites for black pieces to face the player.
  if (side === "w") return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${id}.png`;
};

const pieceToPokemon = (piece) => {
  if (!piece) return null;
  const type = piece.type; // p,r,n,b,q,k
  const id = POKEMON_MAP[type];
  return id;
};

export default function App() {
  const [game] = useState(() => new Chess());
  const [board, setBoard] = useState(game.board());
  const [selected, setSelected] = useState(null);
  const [turn, setTurn] = useState(game.turn()); // 'w' or 'b'
  const [status, setStatus] = useState("");
  const [highlight, setHighlight] = useState([]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refresh() {
    setBoard(game.board());
    setTurn(game.turn());
    setStatus(makeStatus());
  }

  function makeStatus() {
    if (game.in_checkmate()) return `Checkmate — ${game.turn() === 'w' ? 'Black' : 'White'} wins`;
    if (game.in_draw()) return 'Draw';
    if (game.in_check()) return `${game.turn() === 'w' ? 'White' : 'Black'} to move — Check`; 
    return `${game.turn() === 'w' ? 'White' : 'Black'} to move`;
  }

  function onSquareClick(rankIdx, fileIdx) {
    // board is 2D array: board[row][col] where row 0 is rank 8
    const file = "abcdefgh"[fileIdx];
    const rank = 8 - rankIdx;
    const square = `${file}${rank}`;

    const piece = game.get(square);
    if (selected) {
      // Try move
      const move = game.move({ from: selected, to: square, promotion: 'q' });
      if (move) {
        setSelected(null);
        setHighlight([]);
        refresh();
      } else {
        // if clicked another friendly piece, reselect
        if (piece && piece.color === game.turn()) {
          selectSquare(square);
        } else {
          // invalid move — flash selection
          setSelected(null);
          setHighlight([]);
        }
      }
      return;
    }

    if (piece && piece.color === game.turn()) {
      selectSquare(square);
    }
  }

  function selectSquare(square) {
    setSelected(square);
    // compute legal moves from chess.js
    const moves = game.moves({ square, verbose: true });
    const targets = moves.map(m => m.to);
    setHighlight(targets);
  }

  function resetGame() {
    game.reset();
    setSelected(null);
    setHighlight([]);
    refresh();
  }

  function undo() {
    game.undo();
    setSelected(null);
    setHighlight([]);
    refresh();
  }

  // Render helpers
  const renderSquare = (r, c) => {
    const squareColor = (r + c) % 2 === 0 ? 'light' : 'dark';
    const file = "abcdefgh"[c];
    const rank = 8 - r;
    const coord = `${file}${rank}`;
    const piece = game.get(coord);
    const isHighlighted = highlight.includes(coord);

    const style = {
      width: '64px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: squareColor === 'light' ? 'rgba(255, 244, 230, 0.95)' : 'rgba(120,30,20,0.95)',
      border: isHighlighted ? '3px solid rgba(255,215,0,0.9)' : '1px solid rgba(0,0,0,0.2)',
      boxSizing: 'border-box',
      position: 'relative',
    };

    return (
      <div key={coord} style={style} onClick={() => onSquareClick(r, c)}>
        {piece && (
          <img
            src={spriteUrl(pieceToPokemon(piece), piece.color === 'w' ? 'w' : 'b')}
            alt={`${piece.color}${piece.type}`}
            style={{ width: '56px', height: '56px', imageRendering: 'pixelated' }}
            draggable={false}
          />
        )}
        {selected === coord && (
          <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(255,255,0,0.9)', boxSizing: 'border-box' }} />
        )}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: 20, background: 'linear-gradient(180deg, #8B0000 0%, #2d0700 100%)', minHeight: '100vh', color: '#fff' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', gap: 20 }}>
        <div style={{ background: 'rgba(0,0,0,0.35)', padding: 16, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }}>
          <h1 style={{ margin: 0, fontSize: 26 }}>Pokémon Chess — FireRed Theme</h1>
          <p style={{ marginTop: 6, marginBottom: 12, color: '#ffe4c4' }}>Two-player local (share the link after deployment). Pieces are Pokémon fire-type sprites. Click a piece, then click destination.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 64px)', gridTemplateRows: 'repeat(8, 64px)', gap: 0, borderRadius: 8, overflow: 'hidden', border: '6px solid rgba(255,160,60,0.12)' }}>
            {Array.from({ length: 8 }).map((_, r) => (
              Array.from({ length: 8 }).map((__, c) => renderSquare(r, c))
            ))}
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={resetGame} style={buttonStyle}>Reset</button>
            <button onClick={undo} style={buttonStyle}>Undo</button>
            <div style={{ marginLeft: 'auto', alignSelf: 'center', color: '#fffde7' }}>{status}</div>
          </div>

          <div style={{ marginTop: 10, color: '#fff8f0', fontSize: 13 }}>
            <strong>Piece mapping (default):</strong>
            <ul style={{ margin: '6px 0 0 18px' }}>
              <li>King — Charizard</li>
              <li>Queen — Ninetales</li>
              <li>Rook — Arcanine</li>
              <li>Bishop — Rapidash</li>
              <li>Knight — Flareon</li>
              <li>Pawn — Growlithe</li>
            </ul>
          </div>
        </div>

        <div style={{ width: 320, background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12 }}>
          <h3 style={{ marginTop: 0 }}>Controls & Deployment</h3>
          <ol style={{ color: '#fff8f0' }}>
            <li>Click a piece (must match side to move), then click the destination square.</li>
            <li>Promotion is automatic to Queen (Ninetales). You can manually edit the code to change behavior.</li>
            <li>To share this online, deploy the project to GitHub Pages / Netlify / Vercel. See README below included in this package.</li>
          </ol>

          <h4 style={{ marginBottom: 6 }}>Move history</h4>
          <pre style={{ background: 'rgba(0,0,0,0.4)', padding: 8, borderRadius: 6, color: '#fff8e1', height: 220, overflow: 'auto' }}>{game.history().join(', ')}</pre>
        </div>
      </div>

      <style>{`
        button { background: linear-gradient(180deg,#ffb347,#ff6f3c); border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-weight: 600; }
        button:active { transform: translateY(1px); }
      `}</style>
    </div>
  );
}

/*
README / Deployment Instructions (include this file in your repo root as README.md)

1) How to run locally

- Create a new React project (recommended: Vite + React)
  npm create vite@latest pokemon-chess -- --template react
  cd pokemon-chess

- Replace src/App.jsx with this App.jsx content.
- Install chess.js:
  npm install chess.js

- Start dev server:
  npm install
  npm run dev

2) How to deploy (free URL)

Option A — GitHub Pages
- Create a GitHub repo and push the project.
- Install gh-pages and set homepage in package.json (or use GitHub Actions — many guides exist).
- Enable GitHub Pages in the repo settings and your site will be published at https://<username>.github.io/<repo-name>/

Option B — Netlify (super simple)
- Push repo to GitHub.
- Sign in to Netlify (free plan) and choose "New site from Git" -> connect to GitHub -> pick repo -> Deploy.
- Netlify will build and publish a free url like https://your-site.netlify.app

Option C — Vercel
- Push to GitHub and import the repo into Vercel — instant deployment on a free domain.

3) Sprite credits
- Sprites used in this demo are from the PokeAPI sprite repository (public), served from GitHub: https://github.com/PokeAPI/sprites
- If you prefer higher-resolution or prettier art, replace spriteUrl(...) paths with your chosen image URLs.

4) Notes / Next improvements
- Add networked multiplayer (WebRTC / WebSockets) — requires a small server or serverless functions.
- Add piece animations, sound fx, move validation visuals, legal move hints.
- Replace promotion UI to let player choose the promotion Pokémon.

Enjoy! — I included everything you need in this single-file App.jsx. */
