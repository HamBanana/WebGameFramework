// GameFramework/games/SwarmHome/config.js
// SwarmHome — design-tool simulation of an ESP32 robot swarm doing daily
// routines in a small apartment. Three3DScene renders behind the engine
// canvas, so backgroundColor must be 'transparent'.
//
// Everything in `apartment`, `robots`, `devices` and `schedule` is DESIGN
// DATA — edit it here, or live in the in-game Design Panel (key G), which
// persists overrides to localStorage.

(function (GF) {
  'use strict';

  GF.GAME_CONFIG = {
  "engine": {
    "width": 960,
    "height": 540,
    "canvasId": "gameCanvas",
    "backgroundColor": "transparent"
  },
  "physics": {
    "gravity": 0,
    "floorY": 99999,
    "leftWall": 0,
    "rightWall": 99999
  },
  "apartment": {
    "cellSize": 0.5,
    "map": [
      "##############",
      "#KKC.......S.#",
      "#..F.........#",
      "#............#",
      "#.........TBB#",
      "#.........LBB#",
      "#............#",
      "#.1.2........#",
      "#.3.4...DD...#",
      "##############"
    ],
    "wallHeight": 2.4,
    "counterHeight": 0.9,
    "tableHeight": 0.55,
    "deskHeight": 0.74
  },
  "robots": [
    {
      "id": "R1",
      "name": "Mocha",
      "color": "#ff6b4a",
      "chassis": {
        "type": "box",
        "width": 0.11,
        "length": 0.13,
        "height": 0.045
      },
      "wheels": {
        "type": "diff2",
        "radius": 0.022
      },
      "mast": {
        "height": 0.08
      },
      "camera": {
        "fov": 70,
        "tilt": -12
      },
      "carrier": {
        "type": "tray",
        "size": 0.1
      },
      "speed": 0.45,
      "turnSpeed": 3.2,
      "battery": {
        "capacity": 100,
        "drainMove": 0.9,
        "drainIdle": 0.05,
        "chargeRate": 10
      }
    },
    {
      "id": "R2",
      "name": "Latte",
      "color": "#4ac6ff",
      "chassis": {
        "type": "cylinder",
        "width": 0.12,
        "length": 0.12,
        "height": 0.04
      },
      "wheels": {
        "type": "diff2",
        "radius": 0.02
      },
      "mast": {
        "height": 0.1
      },
      "camera": {
        "fov": 85,
        "tilt": -8
      },
      "carrier": {
        "type": "tray",
        "size": 0.095
      },
      "speed": 0.5,
      "turnSpeed": 3.6,
      "battery": {
        "capacity": 100,
        "drainMove": 1,
        "drainIdle": 0.05,
        "chargeRate": 10
      }
    },
    {
      "id": "R3",
      "name": "Bønne",
      "color": "#ffd24a",
      "chassis": {
        "type": "box",
        "width": 0.13,
        "length": 0.15,
        "height": 0.05
      },
      "wheels": {
        "type": "quad4",
        "radius": 0.024
      },
      "mast": {
        "height": 0.07
      },
      "camera": {
        "fov": 65,
        "tilt": -15
      },
      "carrier": {
        "type": "gripper",
        "size": 0.11
      },
      "speed": 0.35,
      "turnSpeed": 2.6,
      "battery": {
        "capacity": 120,
        "drainMove": 1.1,
        "drainIdle": 0.06,
        "chargeRate": 9
      }
    },
    {
      "id": "R4",
      "name": "Crema",
      "color": "#b08aff",
      "chassis": {
        "type": "box",
        "width": 0.13,
        "length": 0.15,
        "height": 0.05
      },
      "wheels": {
        "type": "quad4",
        "radius": 0.024
      },
      "mast": {
        "height": 0.07
      },
      "camera": {
        "fov": 65,
        "tilt": -15
      },
      "carrier": {
        "type": "gripper",
        "size": 0.11
      },
      "speed": 0.35,
      "turnSpeed": 2.6,
      "battery": {
        "capacity": 120,
        "drainMove": 1.1,
        "drainIdle": 0.06,
        "chargeRate": 9
      }
    }
  ],
  "devices": {
    "kitchenLift": {
      "label": "Kitchen lift",
      "speed": 0.35,
      "platform": 0.46,
      "color": "#8899aa"
    },
    "bedsideLift": {
      "label": "Bedside lift",
      "speed": 0.3,
      "platform": 0.46,
      "color": "#8899aa"
    },
    "coffeeMachine": {
      "label": "Coffee machine",
      "brewMinutes": 3,
      "color": "#cc3333"
    },
    "crate": {
      "size": 0.45,
      "color": "#a87840"
    }
  },
  "schedule": [
    {
      "time": "07:00",
      "task": "coffeeRun",
      "robot": "R1"
    },
    {
      "time": "07:45",
      "task": "patrol",
      "robot": "R2"
    },
    {
      "time": "08:30",
      "task": "crateMove",
      "robots": [
        "R3",
        "R4"
      ]
    },
    {
      "time": "09:30",
      "task": "coffeeRun",
      "robot": "R2"
    },
    {
      "time": "12:00",
      "task": "patrol",
      "robot": "R3"
    },
    {
      "time": "15:00",
      "task": "coffeeRun",
      "robot": "R1"
    },
    {
      "time": "18:30",
      "task": "crateMove",
      "robots": [
        "R4",
        "R3"
      ]
    },
    {
      "time": "21:00",
      "task": "patrol",
      "robot": "R4"
    }
  ],
  "sim": {
    "speed": 1,
    "startTime": "06:55",
    "robotCount": 4,
    "cupLifetimeMin": 90
  },
  "camera": {
    "pip": true
  },
  "controls": {
    "camOrbit": [
      "Digit0",
      "Numpad0"
    ],
    "camR1": [
      "Digit1",
      "Numpad1"
    ],
    "camR2": [
      "Digit2",
      "Numpad2"
    ],
    "camR3": [
      "Digit3",
      "Numpad3"
    ],
    "camR4": [
      "Digit4",
      "Numpad4"
    ],
    "camKitchen": [
      "Digit5",
      "Numpad5"
    ],
    "camBed": [
      "Digit6",
      "Numpad6"
    ],
    "camCorner": [
      "Digit7",
      "Numpad7"
    ],
    "camCycle": [
      "KeyC"
    ],
    "pipToggle": [
      "KeyP"
    ],
    "pause": [
      "Space"
    ],
    "speedUp": [
      "Equal",
      "NumpadAdd"
    ],
    "speedDown": [
      "Minus",
      "NumpadSubtract"
    ],
    "designPanel": [
      "KeyG"
    ]
  },
  "debug": {
    "enabled": false
  }
};

  window.addEventListener('GF:ready', function () {
    GF.applyLauncherConfig('SwarmHome');
  }, { once: true });

})(window.GF = window.GF || {});
