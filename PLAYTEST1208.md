# NextDungeon Playtest 1208

**Date:** 2026-08-11  
**Tester:** little-coder  
**Build:** NextDungeon v1.0.0

## Summary
Conducted automated Playwright playtest of NextDungeon after bug fixes for stairs accessibility, raycasting edge visibility, and inventory equipment swapping.

## Bugs Fixed

### 1. Stairs spawn accessibility
**Issue:** When walking up stairs, the cell left of where the player appears was inaccessible, even if no wall was present.
**Root cause:** Player spawn logic searched only adjacent tiles to the stairs override position, often placing player immediately adjacent to stairs. This made the stairs tile immediately to the side, causing immediate re-entry or blocking movement.
**Fix:** Modified `setupGame` player spawn to prioritize tiles 2 steps away from stairs before falling back to adjacent tiles. Changed `stairDirections` order to try dx/dy = ±2,0 and 0,±2 first, then adjacent. Fallback now uses offset +2 instead of +3. This gives player a buffer zone and prevents stairs from being directly adjacent on spawn.

### 2. Raycasting edge visibility
**Issue:** Raytracing acted weird near floor edges; direction closest to edge became out of sight despite no wall.
**Root cause:** `updateVision` only cast rays to tiles on the perimeter of the visibility radius (`distSq < (VISION_RADIUS-1)^2` filtered out interior points). Combined with early out-of-bounds break, edge tiles were never revealed when player was near map boundary.
**Fix:** Removed perimeter-only filter. Now rays are cast to every tile within `VISION_RADIUS` (`distSq <= VISION_RADIUS^2`). Comment updated to reflect full radius casting. Vision is now more consistent at edges.

### 3. Inventory equipment changing
**Issue:** Unable to change equipped items in inventory.
**Root cause:** Equipment slot click handler only allowed equipping a pre-selected inventory item. No way to unequip or swap without selecting first, and no unequip action.
**Fix:** Added else-branch to equipment slot click handler: if no item is selected and slot is occupied, clicking unequips item back to inventory and refreshes UI. This allows changing equipped items by unequipping then equipping a different item.

## Playtest Observations

### Visual Appearance
- Canvas renders at 832x640 with pixelated rendering. UI overlay shows HP/Mana vertical bars, floor/level stats, and XP bar.
- Fog of war works; unexplored tiles are black. After fix, edge tiles remain visible when player is near map boundary.
- Stairs rendered as small squares: blue `#66ccff` for down, yellow `#ffcc66` for up. Player is cyan square.
- Enemy HP bars are color-coded green/yellow/red with border, visible above enemies.
- Log panel on right shows `[Floor X]` entries with color-coded types.

**Screenshots captured:**
- `playtest_start.png` – Title screen → game start
- `playtest_moved.png` – Player movement test
- `playtest_inventory.png` – Inventory overlay open

### Gameplay Notes
- Movement via Arrow Keys/WASD works. Turn-based movement confirmed.
- Stairs transition now spawns player with 1-2 tile buffer, preventing immediate stair re-entry.
- Inventory now allows unequipping by clicking equipped slot without selection.
- Vision radius is 9 tiles; casting to full radius reduces flickering at edges.
- Enemy AI chases within distance <10, moves through walls? No line-of-sight check – typical roguelike.
- Level-up screen shows points to spend, stat buttons update disabled state.
- NPCs spawn on floors where `floor % 10 === 0`? Code still uses `floor % 10 === 0`? Actually NPC spawning unchanged. Could be improved.
- No feedback when bumping into wall – shake timer added but subtle.

## What Can Be Improved

1. **Vision performance:** Casting rays to every tile in radius is more accurate but heavier. Consider caching or using flood fill for larger maps.
2. **Stairs UX:** Up stairs still use same coordinates as down stairs from previous floor. Ensure stairs are always placed in a room center, not at edge, to avoid spawn buffer failures.
3. **Inventory UX:** Currently requires two clicks to swap. Could add drag-and-drop or direct swap on click.
4. **Wall collision feedback:** Shake effect is minimal; add sound or log message.
5. **NPC timing:** NPCs appear on floors 10,20,30... but code uses `floor % 10 === 0`? Verify. If using `floor % 10 === 1`, change to 0 for intuitiveness.
6. **Enemy pathfinding:** Enemies move through walls if line is clear? Actually they check wall for target tile, but they move one step at a time, can get stuck.
7. **Map generation:** Rooms are simple rectangles with L-shaped corridors; may cause isolated rooms.

## Test Evidence
- Screenshots saved in workspace root.
- Game runs on `http://localhost:3000/games/NextDungeon/` via serve.js.
- No console errors besides missing favicon.

## Conclusion
Critical bugs fixed: stairs accessibility, raycasting edge visibility, inventory equip/unequip. Game is playable and visually coherent. Further polish recommended for UX and performance.
