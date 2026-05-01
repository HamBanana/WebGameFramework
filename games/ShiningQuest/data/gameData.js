// GameFramework/games/ShiningQuest/data/gameData.js
// Game-specific content for the Shining Force-style RPG: party members,
// enemy templates, battle definitions (one per chapter), and dialogue
// scripts. Mechanics live in the framework; story lives here.

(function (GF) {
  'use strict';

  GF.QuestData = {

    // ── Party members ──────────────────────────────────────────────────────
    // Each entry is the *template*; battle scenes deep-clone these so HP/MP
    // changes during a fight don't bleed into later chapters automatically.
    party: [
      {
        id      : 'kestra',
        name    : 'Kestra',
        sprite  : 'claudia',          // existing framework character sprite
        portrait: 'kestra',
        clazz   : 'Knight',
        team    : 'player',
        maxHp   : 32,  hp : 32,
        atk     : 9,   def: 5,
        agility : 7,
        move    : 4,
        attackRange: { min: 1, max: 1 },
        critChance : 0.10,
      },
      {
        id      : 'nori',
        name    : 'Nori',
        sprite  : 'claude',           // existing framework character sprite
        portrait: 'nori',
        clazz   : 'Mage',
        team    : 'player',
        maxHp   : 22,  hp : 22,
        atk     : 6,   def: 3,
        agility : 9,
        move    : 3,
        attackRange: { min: 1, max: 2 },
        critChance : 0.05,
        spell   : { name: 'Bolt', mp: 0, range: 3, dmg: [10, 14], aoe: 0 },
      },
      {
        id      : 'barrat',
        name    : 'Barrat',
        sprite  : 'claude',           // re-uses claude sprite (no separate one)
        portrait: 'barrat',
        clazz   : 'Warrior',
        team    : 'player',
        maxHp   : 38,  hp : 38,
        atk     : 11,  def: 4,
        agility : 5,
        move    : 4,
        attackRange: { min: 1, max: 1 },
        critChance : 0.12,
      },
    ],

    // ── Enemy templates ────────────────────────────────────────────────────
    enemies: {
      goblin: {
        name: 'Goblin', sprite: 'goblin', team: 'enemy',
        maxHp: 18, hp: 18, atk: 6, def: 2, agility: 6, move: 3,
        attackRange: { min: 1, max: 1 }, critChance: 0.05, expReward: 12,
      },
      skeleton: {
        name: 'Skeleton', sprite: 'skeleton', team: 'enemy',
        maxHp: 24, hp: 24, atk: 8, def: 3, agility: 5, move: 3,
        attackRange: { min: 1, max: 1 }, critChance: 0.07, expReward: 18,
      },
      bat: {
        name: 'Vampire Bat', sprite: 'bat', team: 'enemy',
        maxHp: 14, hp: 14, atk: 5, def: 1, agility: 11, move: 5,
        attackRange: { min: 1, max: 1 }, critChance: 0.04, expReward: 10,
      },
      darkMage: {
        name: 'Dark Mage', sprite: 'darkMage', team: 'enemy',
        maxHp: 28, hp: 28, atk: 10, def: 3, agility: 8, move: 3,
        attackRange: { min: 1, max: 3 }, critChance: 0.08, expReward: 25,
      },
      dragon: {
        name: 'Crimson Dragon', sprite: 'dragon', team: 'enemy',
        maxHp: 80, hp: 80, atk: 15, def: 6, agility: 7, move: 3,
        attackRange: { min: 1, max: 2 }, critChance: 0.15, expReward: 200,
      },
    },

    // ── Battle map definitions ─────────────────────────────────────────────
    // Each map:
    //   cols/rows   : grid size
    //   terrain[r][c]: 0 grass, 1 stone path, 2 forest (cost 2), 3 water (blocked), 4 wall (blocked), 5 mountain (cost 3)
    //   playerSpawns: [{col,row}, ...]  (one per party member, in order)
    //   enemies     : [{type:'goblin', col, row}, ...]
    //   intro       : dialogue script run before the battle starts
    //   victory     : dialogue script run after victory
    //   nextChapter : index into `chapters` for the next battle (or null when done)
    chapters: [

      // ── Chapter 1: Goblins on the King's Road ──────────────────────────
      {
        id: 'kings_road',
        title: 'Chapter 1 — The King\'s Road',
        cols: 11, rows: 8,
        terrain: [
          [0,0,0,0,0,0,2,2,2,2,2],
          [2,0,0,1,1,1,1,0,0,0,2],
          [2,0,0,1,2,2,1,0,0,0,2],
          [0,0,0,1,2,2,1,0,2,0,0],
          [0,0,0,1,1,1,1,0,2,0,0],
          [0,2,0,0,0,0,0,0,0,0,0],
          [2,2,0,0,3,3,3,0,0,0,2],
          [2,2,0,0,3,3,3,0,0,2,2],
        ],
        playerSpawns: [
          { col: 0, row: 0 },
          { col: 0, row: 1 },
          { col: 1, row: 0 },
        ],
        enemies: [
          { type: 'goblin', col: 9, row: 1 },
          { type: 'goblin', col: 10, row: 3 },
          { type: 'bat',    col: 8, row: 5 },
          { type: 'goblin', col: 6, row: 7 },
        ],
        intro: [
          { type:'text', speaker:'King Aric', portrait:'king',
            text:'Kestra. Goblins have ambushed my couriers on the King\'s Road. Drive them off before they reach the village.' },
          { type:'text', speaker:'Kestra', portrait:'kestra',
            text:'Consider it done, your majesty. Nori, Barrat — with me.' },
          { type:'text', speaker:'Nori', portrait:'nori',
            text:'I\'ll have a Bolt spell ready. Stay at range and pick the stragglers.' },
        ],
        victory: [
          { type:'text', speaker:'Barrat', portrait:'barrat',
            text:'Cowards. Goblins never raid alone — someone is paying them.' },
          { type:'text', speaker:'Kestra', portrait:'kestra',
            text:'Back to the castle. The King will want a report.' },
        ],
        nextChapter: 1,
      },

      // ── Chapter 2: Crypt of the Forgotten Prince ───────────────────────
      {
        id: 'crypt',
        title: 'Chapter 2 — The Crypt',
        cols: 12, rows: 9,
        terrain: [
          [4,4,4,4,4,4,4,4,4,4,4,4],
          [4,1,1,1,1,1,1,1,1,1,1,4],
          [4,1,4,4,1,4,4,1,4,4,1,4],
          [4,1,4,1,1,1,1,1,1,4,1,4],
          [4,1,1,1,4,4,4,4,1,1,1,4],
          [4,1,4,1,1,1,1,1,1,4,1,4],
          [4,1,4,4,1,4,4,1,4,4,1,4],
          [4,1,1,1,1,1,1,1,1,1,1,4],
          [4,4,4,4,4,4,4,4,4,4,4,4],
        ],
        playerSpawns: [
          { col: 1, row: 4 },
          { col: 1, row: 3 },
          { col: 1, row: 5 },
        ],
        enemies: [
          { type: 'skeleton', col: 5,  row: 3 },
          { type: 'skeleton', col: 5,  row: 5 },
          { type: 'bat',      col: 7,  row: 4 },
          { type: 'skeleton', col: 9,  row: 3 },
          { type: 'darkMage', col: 10, row: 4 },
          { type: 'skeleton', col: 9,  row: 5 },
        ],
        intro: [
          { type:'text', speaker:'Nori', portrait:'nori',
            text:'The bones of the forgotten prince rest here. Someone has woken them.' },
          { type:'text', speaker:'Kestra', portrait:'kestra',
            text:'Then we put them back to sleep. Watch the mage at the back — those staves throw lightning.' },
        ],
        victory: [
          { type:'text', speaker:'Barrat', portrait:'barrat',
            text:'A dark mage in our crypt. The pieces fit.' },
          { type:'text', speaker:'Nori', portrait:'nori',
            text:'These weren\'t random raiders. He has been planning this for years.' },
        ],
        nextChapter: 2,
      },

      // ── Chapter 3: The Dragon's Maw ────────────────────────────────────
      {
        id: 'dragon',
        title: 'Chapter 3 — The Dragon\'s Maw',
        cols: 11, rows: 9,
        terrain: [
          [5,5,5,5,5,5,5,5,5,5,5],
          [5,0,0,0,0,0,0,0,0,0,5],
          [5,0,5,5,0,0,0,5,5,0,5],
          [5,0,5,0,0,0,0,0,5,0,5],
          [5,0,0,0,0,0,0,0,0,0,5],
          [5,0,0,0,0,0,0,0,0,0,5],
          [5,0,5,0,0,0,0,0,5,0,5],
          [5,0,5,5,0,0,0,5,5,0,5],
          [5,5,5,5,5,5,5,5,5,5,5],
        ],
        playerSpawns: [
          { col: 1, row: 4 },
          { col: 1, row: 3 },
          { col: 1, row: 5 },
        ],
        enemies: [
          { type: 'dragon',   col: 9, row: 4 },
          { type: 'darkMage', col: 8, row: 2 },
          { type: 'darkMage', col: 8, row: 6 },
          { type: 'bat',      col: 6, row: 2 },
          { type: 'bat',      col: 6, row: 6 },
        ],
        intro: [
          { type:'text', speaker:'Dark Lord', portrait:'darkLord',
            text:'So you found me. Pity. My pet is hungry — feed him your bones, knight.' },
          { type:'text', speaker:'Kestra', portrait:'kestra',
            text:'A dragon. Of course it had to be a dragon.' },
          { type:'text', speaker:'Barrat', portrait:'barrat',
            text:'Aye. And yet still smaller than my axe.' },
        ],
        victory: [
          { type:'text', speaker:'Dark Lord', portrait:'darkLord',
            text:'Impossible... a hundred years of plans... undone by farmgirls...' },
          { type:'text', speaker:'Kestra', portrait:'kestra',
            text:'The realm is safe. Let\'s go home.' },
        ],
        nextChapter: null,
      },
    ],

    // ── Town introduction (NPC scripts) ────────────────────────────────────
    townIntro: [
      { type:'text', speaker:'King Aric', portrait:'king',
        text:'Welcome to Castle Aric, brave one. The realm needs you.' },
      { type:'text', speaker:'King Aric', portrait:'king',
        text:'Approach me when your party is ready and the next chapter will begin.' },
      { type:'text', text:'(WASD or arrows to move. Walk to a glowing icon and press SPACE to interact.)' },
    ],

    // ── Town NPC dialogue (random villager flavour) ───────────────────────
    villagerLines: [
      [{ type:'text', speaker:'Villager', portrait:'villager',
         text:'My uncle says he saw glowing eyes in the crypt last night. Spooky business.' }],
      [{ type:'text', speaker:'Villager', portrait:'villager',
         text:'Buy something? I sell nothing. I am simply standing here.' }],
      [{ type:'text', speaker:'Villager', portrait:'villager',
         text:'They say a dragon lairs in the eastern peaks. I say keep your distance.' }],
      [{ type:'text', speaker:'Villager', portrait:'villager',
         text:'Hold ENTER on a dialogue to fast-forward. (...probably.)' }],
    ],

    // ── End-game cinematic ─────────────────────────────────────────────────
    finale: [
      { type:'text', text:'The Dark Lord\'s shadow lifts from the kingdom.' },
      { type:'text', speaker:'King Aric', portrait:'king',
        text:'You have done what no army could. The realm owes you a debt that cannot be paid.' },
      { type:'text', speaker:'Kestra', portrait:'kestra',
        text:'The road brought us together. I think it isn\'t finished yet.' },
      { type:'text', text:'~ THE END ~' },
    ],
  };

})(window.GF = window.GF || {});
