// GameFramework/framework/build.js
// Concatenates all framework modules into GameFramework.bundle.js
// Usage:  node framework/build.js

var fs   = require('fs');
var path = require('path');

var ROOT = __dirname;

var FILES = [
  'utils/MathUtils.js',
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
  'GameFramework.js',
];

var OUT = path.join(ROOT, 'GameFramework.bundle.js');

FILES.forEach(function(rel) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    console.error('  MISSING: ' + rel);
    process.exit(1);
  }
});

var parts = FILES.map(function(rel) {
  var src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  var bar = '// -- ' + rel + ' ' + new Array(Math.max(0, 60 - rel.length) + 1).join('-');
  return bar + '\n\n' + src;
});

var header = '// GameFramework.bundle.js - AUTO-GENERATED, DO NOT EDIT\n' +
             '// Built: ' + new Date().toISOString() + '\n' +
             '// Source: framework/build.js\n' +
             '// Include as: <script src="../../framework/GameFramework.bundle.js"></script>\n\n';

fs.writeFileSync(OUT, header + parts.join('\n\n'), 'utf8');

var sizeKb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log('\nGameFramework bundle built successfully:');
FILES.forEach(function(f) { console.log('  + ' + f); });
console.log('\n-> ' + OUT + '  (' + sizeKb + ' KB)\n');
