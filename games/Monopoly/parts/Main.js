// parts/Main.js — scene, wired by owui-games-tool.
(function (G, GF) {
  'use strict';

  class Main extends GF.Scene {
    init(engine) {
      this.engine = engine;
      this.board = new G.components.Board();
      this.dice = new G.components.Dice();
      this.players = [
        new G.components.Player("Player 1", "#e74c3c", "P1"),
        new G.components.Player("Player 2", "#3498db", "P2")
      ];
      this.currentPlayerIndex = 0;
      this.message = "Player 1's turn - Click or press Space to roll!";
      this.messageTimer = 0;

      // Keyboard input
      engine.input.bind('roll', 'Space', 'Enter');

      // Mouse click input
      this._onClick = () => {
        this.rollAndMove();
      };
      engine.canvas.addEventListener('click', this._onClick);
    }

    destroy(engine) {
      engine.canvas.removeEventListener('click', this._onClick);
    }

    update(dt, engine) {
      if (engine.input.wasPressed('roll')) {
        this.rollAndMove();
      }
      if (this.messageTimer > 0) {
        this.messageTimer -= dt;
      }
    }

    rollAndMove() {
      const total = this.dice.roll();
      const player = this.players[this.currentPlayerIndex];
      const oldPos = player.position;

      // Move player
      player.position = (player.position + total) % 40;

      // Check if passed GO
      if (player.position < oldPos) {
        player.money += 200;
        this.message = player.name + " passed GO! +$200";
      }

      // Handle space
      const space = this.board.spaces[player.position];
      if (space.type === "property" || space.type === "railroad" || space.type === "utility") {
        if (space.owner === -1) {
          // Buy property
          if (player.money >= space.price) {
            player.money -= space.price;
            space.owner = this.currentPlayerIndex;
            player.properties.push(space.index);
            this.message = player.name + " bought " + space.name + " for $" + space.price;
          } else {
            this.message = player.name + " landed on " + space.name + " (can't afford $" + space.price + ")";
          }
        } else if (space.owner !== this.currentPlayerIndex) {
          // Pay rent
          const rent = Math.floor(space.price * 0.1);
          const owner = this.players[space.owner];
          player.money -= rent;
          owner.money += rent;
          this.message = player.name + " paid $" + rent + " rent to " + owner.name;
        } else {
          this.message = player.name + " landed on their own " + space.name;
        }
      } else if (space.type === "tax") {
        player.money -= space.price;
        this.message = player.name + " paid $" + space.price + " tax";
      } else if (space.type === "gotojail") {
        player.position = 10;
        this.message = player.name + " went to Jail!";
      } else {
        this.message = player.name + " rolled " + total + " and landed on " + space.name;
      }

      // Switch turn
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 2;
      this.messageTimer = 3;
    }

    render(ctx, engine) {
      // Draw board
      this.board.draw(ctx);

      // Draw players on board
      for (let i = 0; i < this.players.length; i++) {
        this.players[i].draw(ctx, this.board.positions, i);
      }

      // Draw dice in center
      this.dice.draw(ctx);

      // Draw player info panels on left side of center area
      this.drawPlayerInfo(ctx);

      // Draw message at bottom of center area
      if (this.messageTimer > 0) {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(215, 495, 420, 36);
        ctx.fillStyle = "#fff";
        ctx.font = "13px monospace";
        ctx.textAlign = "center";
        ctx.fillText(this.message, 425, 519);
      }
    }

    drawPlayerInfo(ctx) {
      const panelX = 215;
      const panelY = 115;
      const panelW = 140;
      const panelH = 105;

      for (let i = 0; i < this.players.length; i++) {
        const p = this.players[i];
        const y = panelY + i * (panelH + 8);

        // Panel background
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(panelX, y, panelW, panelH);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, y, panelW, panelH);

        // Active player highlight
        if (i === this.currentPlayerIndex) {
          ctx.fillStyle = "rgba(255,215,0,0.15)";
          ctx.fillRect(panelX + 2, y + 2, panelW - 4, panelH - 4);
        }

        ctx.fillStyle = p.color;
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "left";
        ctx.fillText(p.name, panelX + 8, y + 18);

        ctx.fillStyle = "#fff";
        ctx.font = "11px monospace";
        ctx.fillText("Money: $" + p.money, panelX + 8, y + 36);
        ctx.fillText("Pos: " + p.position, panelX + 8, y + 52);
        ctx.fillText("Props: " + p.properties.length, panelX + 8, y + 68);

        // Property list (abbreviated)
        ctx.font = "9px monospace";
        let py = y + 86;
        const propNames = p.properties.slice(0, 2).map(idx => this.board.spaces[idx].name);
        if (propNames.length) {
          ctx.fillStyle = "#ccc";
          ctx.fillText(propNames.join(", ") + (p.properties.length > 2 ? "..." : ""), panelX + 8, py);
        }
      }

      // Turn indicator below panels
      const turnY = panelY + 2 * (panelH + 8) + 5;
      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(">> " + this.players[this.currentPlayerIndex].name + "'s Turn <<", panelX + panelW / 2, turnY + 14);
    }
  }

  G.scenes.Main = Main;
})(window.GAME = window.GAME || { components: {}, scenes: {}, systems: {}, state: {} }, window.GF);
