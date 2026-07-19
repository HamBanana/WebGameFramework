(function (GF) { 'use strict';
class MainScene extends GF.Scene {
    constructor() { super(); this.player = { x: 0, y: 0 }; this.bullets = []; this.aliens = []; this.score = 0; this.gameOver = false; this.currentDirection = 1; }
    init(engine) {
        engine.input.bind('left','ArrowLeft');
        engine.input.bind('right','ArrowRight');
        engine.input.bind('fire','Space');
        const rows = 5, cols = 10;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let a = { x: 40 + c * 52, y: 20 + r * 48, alive: true };
                this.aliens.push(a);
            }
        }
        this.player.x = engine.canvas.width / 2 - 16;
        this.player.y = engine.canvas.height - 40;
    }
    update(dt, engine) {
        if (this.gameOver) return;
        if (engine.input.isDown('left')) this.player.x -= dt * 300;
        if (engine.input.isDown('right')) this.player.x += dt * 300;
        this.player.x = Math.max(0, Math.min(engine.canvas.width - 32, this.player.x));
        if (engine.input.wasPressed('fire')) {
            this.bullets.push({ x: this.player.x + 16, y: this.player.y, alive: true });
        }
        this.bullets.forEach(b => b.y -= dt * 700);
        this.bullets = this.bullets.filter(b => b.y > -10);
        const moveSpeed = 1.7;

        // Move every living alien sideways
        this.aliens.forEach(a => {
            if (a.alive) a.x += moveSpeed * this.currentDirection;
        });

        // Calculate bounds of living aliens
        let minX = Infinity, maxX = -Infinity;
        this.aliens.forEach(a => {
            if (a.alive && a.y < this.player.y - 75) {
                if (a.x < minX) minX = a.x;
                if (a.x > maxX) maxX = a.x;
            }
        });
        if (minX === Infinity || maxX === -Infinity) return;

        // Check edge limits — reverse and drop when hitting canvas edges
        if (minX <= 10 || maxX >= engine.canvas.width - 10) {
            this.currentDirection *= -1;
            this.aliens.forEach(a => {
                if (a.alive) a.y += 16;
            });
        }
        this.bullets.forEach(b => {
            this.aliens.forEach(a => {
                if (b.alive === undefined && a.alive) return;
                if (Math.abs(b.x - a.x) < 16 && Math.abs(b.y - a.y) < 24) {
                    b.alive = false;
                    a.alive = false;
                    this.score += 10;
                }
            });
        });
        let allDead = true;
        this.aliens.forEach(a => {
            if (a.alive) allDead = false;
            if (a.y >= this.player.y - 30) this.gameOver = true;
        });
        if (allDead) {
            for (let r = 0; r<5;r++) for(let c=0;c<10;c++){
                let a={x:40+c*52,y:20+r*48,alive:true};
                this.aliens.push(a);
            }
        }
    }
    render(ctx, engine) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, engine.canvas.width, engine.canvas.height);
        ctx.fillStyle = '#0f0';
        ctx.font = '16px monospace';
        ctx.fillText('SCORE: ' + this.score, 10, 25);
        if (this.gameOver) {
            ctx.fillStyle = '#f00';
            ctx.font = '30px monospace';
            ctx.fillText('GAME OVER', engine.canvas.width/2-75, engine.canvas.height/2);
        }
        this.bullets.forEach(b => {
            if (!b.alive) return;
            ctx.fillStyle = '#ff0';
            ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
        });
        this.aliens.forEach(a => {
            if (!a.alive) return;
            ctx.fillStyle = '#0ff';
            ctx.fillRect(a.x - 8, a.y - 8, 16, 16);
        });
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.player.x, this.player.y, 32, 20);
    }
}
window.addEventListener('GF:ready', () => {
        const cfg = GF.GAME_CONFIG || { game: { name: 'OrnithBlitz' }, engine: {}, physics: {} };
    const game = GF.createGame(cfg.engine || {}, cfg.physics || {}, { gameName: cfg.game.name, scenes: [new MainScene()] });
    game.engine.start();
});
})(window.GF = (window.GF || {}));
