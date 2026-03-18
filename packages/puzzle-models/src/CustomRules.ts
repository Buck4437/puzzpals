import {
  CoordinateToKey,
  type Grid,
  type LayerData,
  type RulesType,
} from "./Grid.js";
import { SPECIAL_CHARACTERS } from "./SpecialCharacters.js";

const ADJACENT_DIRECTIONS: [number, number][] = [
  [0, 1], // Right
  [0, -1], // Left
  [1, 0], // Down
  [-1, 0], // Up
];

function calculateAkariRulesLayer(grid: Grid, playerSolution: LayerData) {
  const rulesLayer: LayerData = {
    lineObjects: {},
    surfaceObjects: {},
    textObjects: {},
    shapeObjects: {},
  };

  // Fetch all walls from the problem layer
  const walls = Object.values(grid.problem.surfaceObjects).filter(
    (surfaceObject) => surfaceObject.color === "black",
  );

  // Fetch all light bulbs, represented by the symbol "O"
  const lightBulbs = Object.values(playerSolution.shapeObjects).filter(
    (shape) => shape.content === SPECIAL_CHARACTERS.AKARI_BULB.id,
  );

  // Light up surfaces that are adjacent to light bulbs, until a wall is hit
  for (const lightBulb of lightBulbs) {
    const originKey = CoordinateToKey(lightBulb.location);
    rulesLayer.surfaceObjects[originKey] = {
      location: lightBulb.location,
      color: "yellow",
    };

    for (const direction of ADJACENT_DIRECTIONS) {
      let currentLocation: [number, number] = [
        lightBulb.location[0] + direction[0],
        lightBulb.location[1] + direction[1],
      ];

      while (
        currentLocation[0] >= 0 &&
        currentLocation[0] < grid.size[0] &&
        currentLocation[1] >= 0 &&
        currentLocation[1] < grid.size[1]
      ) {
        const wallAtCurrentLocation = walls.find(
          (wall) =>
            wall.location[0] === currentLocation[0] &&
            wall.location[1] === currentLocation[1],
        );

        if (wallAtCurrentLocation) {
          break;
        }

        const key = CoordinateToKey(currentLocation);
        rulesLayer.surfaceObjects[key] = {
          location: currentLocation,
          color: "yellow",
        };

        currentLocation = [
          currentLocation[0] + direction[0],
          currentLocation[1] + direction[1],
        ];
      }
    }
  }
  return rulesLayer;
}

export interface RuleObject {
  id: RulesType;
  name: string;
  description: string;
  calculateRulesLayer: (grid: Grid, playerSolution: LayerData) => LayerData;
}

export const CUSTOM_RULES_LIST: Record<RulesType, RuleObject> = {
  akari: {
    id: "akari",
    name: "Akari",
    description: `Highlights all cells that are lit by ${SPECIAL_CHARACTERS.AKARI_BULB.textGlyph}`,
    calculateRulesLayer: calculateAkariRulesLayer,
  },
};

export function getRulesList(): RuleObject[] {
  return Object.values(CUSTOM_RULES_LIST);
}

export function getEnabledRulesList(grid: Grid): RuleObject[] {
  return grid.options.rules.map((ruleId) => CUSTOM_RULES_LIST[ruleId]);
}

export function getEnabledCustomRulesLayers(
  grid: Grid,
  playerSolution: LayerData,
): LayerData[] {
  const rulesLayers = getEnabledRulesList(grid).map((rule) =>
    rule.calculateRulesLayer(grid, playerSolution),
  );

  return rulesLayers;
}

export { calculateAkariRulesLayer };
