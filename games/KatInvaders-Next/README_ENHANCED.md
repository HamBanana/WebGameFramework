# KatInvaders-Next - Enhanced Edition

A.k.a. "KatInvaders-Next: The Ultimate Space Defender"

## What's New?

This enhanced version includes:

### 🐢 **Slower, More Manageable Aliens**
- Reduced initial and maximum speeds
- Less aggressive acceleration as you progress
- Easier to track and shoot

### ⚡ **More Power-ups!**
10 different power-up types with varying rarities:
- **⚡ Rapid Fire** (Common) - Fire twice as fast
- **⬆⬆ Double Shot** (Common) - Two parallel beams
- **⬆⬆⬆ Triple Shot** (Uncommon) - Three parallel shots
- **🌈 Spread Shot** (Uncommon) - 5-bullet cone pattern
- **🛡 Shield** (Uncommon) - Temporary protection
- **★ Mega Laser** (Rare) - Wide, powerful beam
- **💣 Smart Bomb** (Rare) - Clear all enemies
- **🐢 Slow Mo** (Rare) - Slow down time for 6 seconds
- **✨ Invincible** (Very Rare) - Temporary invincibility
- **♥ Extra Life** (Very Rare) - +1 life

### 👹 **5 Different Bosses!**
Each boss has unique movement patterns and stats:
1. **Mothership** - Patrols left/right (Classic)
2. **Star Destroyer** - Hovers up/down while moving side-to-side
3. **Crimson Reaper** - Aggressive dashing movement
4. **Void Hydra** - Figure-8 pattern movement
5. **Galaxy Devourer** - Complex multi-phase movement

Bosses cycle through types every 5 levels for variety.

### 🐱 **Galaga-Style Diving Mechanics!**
- Aliens randomly decide to dive at the player
- They fly directly toward you at high speed
- After diving, they return to formation
- Adds dynamic, unpredictable movement!

### 🎨 **Visual Upgrades**
- Animated power-up sprites with glowing effects
- Unique boss designs for each type
- Smooth animations and particle effects
- Colorful, kawaii aesthetic preserved

## How to Play

1. **Move**: Arrow keys or A/D
2. **Fire**: Space, Z, or J
3. **Start Boss**: Press B (after every 5 levels)
4. **Pause**: Escape, P, or K

## Boss Strategy Guide

- **Mothership**: Classic, easy to predict
- **Star Destroyer**: Watch for vertical movement
- **Crimson Reaper**: Dodge the aggressive dashes
- **Void Hydra**: Keep moving, it circles
- **Galaxy Devourer**: Watch all four eyes - they can attack from any angle!

## Power-up Strategy Guide

- **Rapid Fire + Spread Shot** = Area clear
- **Shield + Invincible** = Boss damage farm
- **Smart Bomb** = Emergency reset when overwhelmed
- **Slow Mo** = Perfect for dodging密集弹幕
- **Triple Shot** = Balanced damage output

## Difficulty Progression

- Levels 1-4: Normal aliens, basic patterns
- Level 5: First boss (Mothership)
- Levels 6-9: Diving aliens start appearing
- Level 10: Second boss (Star Destroyer)
- ...and so on, with harder bosses and more diving aliens

## Tips

1. **Use the diving aliens** - They're slower when returning to formation
2. **Collect power-ups early** - Build up before boss fights
3. **Save smart bombs** - Use when overwhelmed
4. **Watch boss movement** - Each type has a pattern to learn
5. **Don't ignore dive attacks** - They drop power-ups too!

## File Structure

```
KatInvaders-Next/
├── KatInvadersGame.js      # Main game scenes
├── config.js              # Game configuration
├── CHANGES.md             # This changelog
├── README_ENHANCED.md     # This file
└──
    ├── behaviors/         # Alien and player behaviors
    │   ├── FormationMove.js  # Added diving mechanics
    │   ├── BossHover.js      # New boss movement
    │   ├── BossAggressive.js # New boss movement
    │   ├── BossCircle.js     # New boss movement
    │   └── BossComplex.js    # New boss movement
    │
    ├── modules/           # Game logic modules
    │   ├── Boss.js         # Boss type selection
    │   └── Powerups.js     # Power-up handling
    │
    ├── prefabs/           # Entity templates
    │   └── boss.js         # New boss prefabs
    │
    └── sprites/           # Visual assets
        ├── player.js       # Power-up sprites
        └── boss.js         # Boss sprites
```

## Credits

Original KatInvaders by Kat
Enhanced version by little-coder

## License

Same as original KatInvaders-Next

---

**Happy Defending!** 🌟
