// GameFramework/games/ModelDemo/config.js
// Configuration for the GLB Model Showcase demo.

window.GAME_CONFIG = {
  engine: {
    width:           1280,
    height:          720,
    canvasId:        'gameCanvas',
    backgroundColor: 'transparent',   // 2D canvas is an overlay; Three.js renders behind it
  },
  // No physics needed for a model viewer
  physics: {
    gravity: 0,
  },
  game: {
    name: 'ModelDemo',
  },
};
