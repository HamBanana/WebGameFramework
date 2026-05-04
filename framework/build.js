// GameFramework/framework/build.js
// Concatenates all framework modules into GameFramework.bundle.js.
// Sprite loader files are bundled separately into GameFramework.sprites.bundle.js
// so games only pay the asset-load cost for sprites they actually need.
//
// Usage:  node framework/build.js

var fs   = require('fs');
var path = require('path');

var ROOT = __dirname;

// --- Core bundle: engine + systems + scene templates -----------------------
var CORE = [
  'utils/MathUtils.js',
  'utils/ProceduralAudio.js',
  'core/EventBus.js',
  'core/InputManager.js',
  'core/AssetLoader.js',
  'core/Engine.js',
  'core/SceneManager.js',
  'systems/SpriteSystem.js',
  'systems/PhysicsSystem.js',
  'systems/UISystem.js',
  'systems/AudioSystem.js',
  'systems/TweenSystem.js',
  'systems/ParticleSystem.js',
  'systems/Camera.js',
  'systems/TilemapSystem.js',
  'systems/SaveSystem.js',
  'systems/DebugOverlay.js',
  'systems/DialogueSystem.js',
  'systems/ModelSystem.js',
  'systems/GridSystem.js',
  'systems/TurnBasedBattleSystem.js',
  'systems/MenuSystem.js',
  // Promoted from games (v2.3.0)
  'systems/StateMachine.js',
  'systems/PlayerController.js',
  'systems/ScoreManager.js',
  'systems/WaveSpawner.js',
  'systems/ParallaxSystem.js',
  // Reusable scene templates
  'scenes/TitleScene.js',
  'scenes/GameOverScene.js',
  'GameFramework.js',
];

// --- Optional sprites bundle: loads every built-in sprite sheet eagerly. ---
// Games that want all sprites can include this AFTER the core bundle:
//   <script src="../../framework/GameFramework.bundle.js"></script>
//   <script src="../../framework/GameFramework.sprites.bundle.js"></script>
// Games that only need a subset can include individual files:
//   <script src="../../framework/sprites/monsters.js"></script>
var SPRITES = [
  'sprites/claude.js',
  'sprites/claudia.js',
  'sprites/aliens.js',
  'sprites/boss.js',
  'sprites/businesses.js',
  'sprites/cells.js',
  'sprites/characters.js',
  'sprites/landmarks.js',
  'sprites/monsters.js',
  'sprites/player.js',
  'sprites/portraits.js',
  'sprites/resources.js',
  'sprites/scenery.js',
  'sprites/tokens.js',
  'sprites/ui.js',
  'sprites/vehicles.js',
  'sprites/wildlife.js',
];

function buildBundle(files, outName, label) {
  files.forEach(function (rel) {
    if (!fs.existsSync(path.join(ROOT, rel))) {
      console.error('  MISSING: ' + rel);
      process.exit(1);
    }
  });
  var parts = files.map(function (rel) {
    var src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    var bar = '// -- ' + rel + ' ' + new Array(Math.max(0, 60 - rel.length) + 1).join('-');
    return bar + '\n\n' + src;
  });
  var header = '// ' + outName + ' - AUTO-GENERATED, DO NOT EDIT\n' +
               '// Built: ' + new Date().toISOString() + '\n' +
               '// Source: framework/build.js (' + label + ')\n\n';
  var out = path.join(ROOT, outName);
  fs.writeFileSync(out, header + parts.join('\n\n'), 'utf8');
  var sizeKb = (fs.statSync(out).size / 1024).toFixed(1);
  console.log('\n' + label + ' built (' + sizeKb + ' KB):');
  files.forEach(function (f) { console.log('  + ' + f); });
  console.log('  -> ' + out);
}

buildBundle(CORE,    'GameFramework.bundle.js',         'core');
buildBundle(SPRITES, 'GameFramework.sprites.bundle.js', 'sprites (optional)');
console.log('');
