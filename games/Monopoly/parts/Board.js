// parts/Board.js — component, wired by owui-games-tool.
(function (G, GF) {
  'use strict';

  class Board {
    constructor() {
      this.spaces = this.buildSpaces();
      this.positions = this.computePositions();
    }

    buildSpaces() {
      const names = [
        "GO", "Mediterranean", "Community Chest", "Baltic Ave", "Income Tax",
        "Reading RR", "Oriental Ave", "Chance", "Vermont Ave", "Connecticut Ave",
        "Jail", "St. Charles", "Electric Co", "States Ave", "Texas Ave",
        "B&O RR", "Pacific Ave", "North Carolina", "Community Chest", "Penn Ave",
        "Parking", "Kentucky Ave", "Chance", "Indiana Ave", "Illinois Ave",
        "B&O RR", "Atlantic Ave", "Ventnor Ave", "Water Works", "Marvin Gardens",
        "Go To Jail", "Pacific Ave", "North Carolina", "Community Chest", "Penn Ave",
        "Parking", "Kentucky Ave", "Chance", "Indiana Ave", "Illinois Ave"
      ];
      const types = [
        "go", "property", "chest", "property", "tax",
        "railroad", "property", "chance", "property", "property",
        "jail", "property", "utility", "property", "property",
        "railroad", "property", "property", "chest", "property",
        "parking", "property", "chance", "property", "property",
        "railroad", "property", "property", "utility", "property",
        "gotojail", "property", "property", "chest", "property",
        "parking", "property", "chance", "property", "property"
      ];
      const prices = [
        0, 60, 0, 60, 200,
        200, 100, 0, 140, 140,
        0, 180, 150, 180, 220,
        200, 220, 260, 0, 260,
        0, 300, 0, 300, 320,
        200, 350, 400, 150, 400,
        0, 500, 500, 0, 550,
        0, 600, 0, 600, 600
      ];
      const colors = [
        "", "#c4a35a", "", "#c4a35a", "",
        "", "#e67e22", "", "#e67e22", "#e67e22",
        "", "#3498db", "", "#3498db", "#3498db",
        "", "#9b59b6", "#9b59b6", "", "#9b59b6",
        "", "#e74c3c", "", "#e74c3c", "#e74c3c",
        "", "#2ecc71", "#2ecc71", "", "#2ecc71",
        "", "#1abc9c", "#1abc9c", "", "#1abc9c",
        "", "#f39c12", "", "#f39c12", "#f39c12"
      ];
      return names.map((n, i) => ({
        index: i, name: n, type: types[i], price: prices[i], color: colors[i], owner: -1
      }));
    }

    computePositions() {
      const positions = [];
      const margin = 50;
      const ringSize = 600 - margin * 2;       // 500 — fits in 600px height
      const cellSize = ringSize / 10;           // 50px per cell
      const offsetX = (800 - ringSize) / 2;     // center horizontally: 150
      const offsetY = margin;                   // top-left of ring at (150, 50)

      // Bottom row: index 10 to 0 (right to left) — 11 tiles
      for (let i = 0; i <= 10; i++) {
        positions.push({
          x: offsetX + (10 - i) * cellSize + cellSize / 2,
          y: offsetY + ringSize + cellSize / 2
        });
      }
      // Left column: index 11 to 20 (bottom to top) — 10 tiles
      for (let i = 1; i <= 10; i++) {
        positions.push({
          x: offsetX + cellSize / 2,
          y: offsetY + ringSize - i * cellSize + cellSize / 2
        });
      }
      // Top row: index 21 to 30 (left to right) — 11 tiles
      for (let i = 0; i <= 10; i++) {
        positions.push({
          x: offsetX + i * cellSize + cellSize / 2,
          y: offsetY + cellSize / 2
        });
      }
      // Right column: index 31 to 39 (top to bottom) — 9 tiles
      for (let i = 1; i <= 9; i++) {
        positions.push({
          x: offsetX + ringSize + cellSize / 2,
          y: offsetY + i * cellSize + cellSize / 2
        });
      }
      return positions;
    }

    draw(ctx) {
      const margin = 50;
      const ringSize = 600 - margin * 2;       // 500
      const cellSize = ringSize / 10;           // 50px
      const offsetX = (800 - ringSize) / 2;     // 150
      const offsetY = margin;                   // 50

      // Draw each space
      for (let i = 0; i < 40; i++) {
        const pos = this.positions[i];
        const space = this.spaces[i];

        // Space background
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(pos.x - cellSize / 2, pos.y - cellSize / 2, cellSize, cellSize);
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        ctx.strokeRect(pos.x - cellSize / 2, pos.y - cellSize / 2, cellSize, cellSize);

        // Color bar for properties
        if (space.color) {
          ctx.fillStyle = space.color;
          if (i < 11) {
            ctx.fillRect(pos.x - cellSize / 2, pos.y - cellSize / 2, cellSize, 6);
          } else if (i < 21) {
            ctx.fillRect(pos.x - cellSize / 2, pos.y - cellSize / 2, 6, cellSize);
          } else if (i < 31) {
            ctx.fillRect(pos.x - cellSize / 2, pos.y - cellSize / 2, cellSize, 6);
          } else {
            ctx.fillRect(pos.x + cellSize / 2 - 6, pos.y - cellSize / 2, 6, cellSize);
          }
        }

        // Space name (abbreviated)
        ctx.fillStyle = "#333";
        ctx.font = "7px monospace";
        ctx.textAlign = "center";
        const shortName = space.name.length > 10 ? space.name.substring(0, 9) + "." : space.name;
        ctx.fillText(shortName, pos.x, pos.y + 4);
      }

      // Center area
      ctx.fillStyle = "#1a1a2e";
       ctx.fillRect(offsetX + cellSize, offsetY + cellSize, ringSize - 2 * cellSize, ringSize - 2 * cellSize);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      ctx.fillText("MONOPOLY", 400, 280);
      ctx.font = "12px monospace";
      ctx.fillText("Click or press Space to roll", 400, 305);
    }
  }

  G.components.Board = Board;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
