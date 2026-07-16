// GameFramework/games/TTTG426B/TTTG426BBGame.js
(function (GF) {
  'use strict';

  class TicTacToeScene extends GF.Scene {
    init(engine) {
      this.engine = engine;
      this.board = [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ];
      this.currentPlayer = 'X';
      this.winner = null;
      this.statusText = "Player X's Turn";

      // Initialize Grid via System
      this.grid = engine.grids.create({
        cols: 3,
        rows: 3,
        cellSize: engine.canvas.width / 3,
        showGrid: true
      });

      // Setup input listener on canvas
      const rect = engine.canvas.getBoundingClientRect();
      engine.canvas.addEventListener('click', (e) => {
        if (this.winner) {
          this.reset();
          return;
        }

        // Calculate mouse position relative to canvas content scale
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const scaleX = engine.canvas.width / rect.width;
        const scaleY = engine.canvas.height / rect.height;
        const worldX = x * scaleX;
        const worldY = y * scaleY;

        const cell = this.grid.toGrid(worldX, worldY);
        
        if (this.grid.inBounds(cell.col, cell.row)) {
          this.handleCellClick(cell.col, cell.row);
        }
      });
    }

    handleCellClick(col, row) {
      if (this.board[row][col] === null && !this.winner) {
        this.board[row][col] = this.currentPlayer;
        
        if (this.checkWinner()) {
          this.winner = this.currentPlayer;
          this.statusText = `Player ${this.winner} Wins!`;
        } else if (this.isDraw()) {
          this.winner = 'Draw';
          this.statusText = "It's a Draw!";
        } else {
          this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
          this.statusText = `Player ${this.currentPlayer}'s Turn`;
        }
      }
    }

    checkWinner() {
      // Check rows
      for (let r = 0; r < 3; r++) {
        if (this.board[r][0] && this.board[r][0] === this.board[r][1] && this.board[r][1] === this.board[r][2]) return true;
      }
      // Check columns
      for (let c = 0; c < 3; c++) {
        if (this.board[0][c] && this.board[0][c] === this.board[1][c] && this.board[1][c] === this.board[2][c]) return true;
      }
      // Check diagonals
      if (this.board[0][0] && this.board[0][0] === this.board[1][1] && this.board[1][1] === this.board[2][2]) return true;
      if (this.board[0][2] && this.board[0][2] === this.board[1][1] && this.board[1][1] === this.board[2][0]) return true;
      
      return false;
    }

    isDraw() {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (this.board[r][c] === null) return false;
        }
      }
      return true;
    }

    reset() {
      this.board = [
        [null, null, null],
        [null, null, null],
        [null, null, null]
      ];
      this.currentPlayer = 'X';
      this.winner = null;
      this.statusText = "Player X's Turn";
    }

    update(dt, engine) {
      // No logic needed for this scene
    }

    render(ctx, engine) {
      const { width, height } = engine.canvas;
      const cellSize = width / 3;

      // Clear background
      ctx.fillStyle = "#222";
      ctx.fillRect(0, 0, width, height);

      // Draw Grid
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, height);
        ctx.stroke();
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(width, i * cellSize);
        ctx.stroke();
      }

      // Draw Board Content
      ctx.font = `${cellSize * 0.6}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const x = c * cellSize + cellSize / 2;
          const y = r * cellSize + cellSize / 2;
          const symbol = this.board[r][c];
          if (symbol) {
            ctx.fillStyle = symbol === 'X' ? "#ff4444" : "#4444ff";
            ctx.fillText(symbol, x, y);
          }
        }
      }

      // Draw Status
      ctx.fillStyle = "#fff";
      ctx.font = `20px Arial`;
      ctx.fillText(this.statusText, width / 2, height - 30);
    }
  }

  window.addEventListener('GF:ready', () => {
    const cfg = GF.GAME_CONFIG;
    const game = GF.createGame(cfg.engine, cfg.physics, {
      gameName: cfg.game.name,
      scenes: [new TicTacToeScene()],
    });
    game.engine.start();
  });

})(window.GF = window.GF || {});
