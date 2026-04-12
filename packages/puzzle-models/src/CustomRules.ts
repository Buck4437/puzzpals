import {
  type Coordinate,
  CoordinateToKey,
  type PuzzleData,
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

function calculateAkariRulesLayer(
  puzzle: PuzzleData,
  playerSolution: LayerData,
) {
  const rulesLayer: LayerData = {
    lineObjects: {},
    surfaceObjects: {},
    textObjects: {},
    shapeObjects: {},
  };

  // Fetch all walls from the problem layer
  const walls = Object.values(puzzle.problem.surfaceObjects).filter(
    (surfaceObject) => surfaceObject.color === "black",
  );

  // Fetch all light bulbs
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
        currentLocation[0] < puzzle.size[0] &&
        currentLocation[1] >= 0 &&
        currentLocation[1] < puzzle.size[1]
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

function calculateMasyuRulesLayer(
  puzzle: PuzzleData,
  playerSolution: LayerData,
) {
  // Locate all big circles in the problem layer
  const bigCircles = Object.values(puzzle.problem.shapeObjects).filter(
    (shapeObject) =>
      shapeObject.content === SPECIAL_CHARACTERS.WHITE_CIRCLE_BIG.id ||
      shapeObject.content === SPECIAL_CHARACTERS.BLACK_CIRCLE_BIG.id,
  );

  // Locate green, non-diagonal lines in the player's solution
  const filteredLines = Object.values(playerSolution.lineObjects).filter(
    (lineObject) =>
      lineObject.color === "green" &&
      Math.abs(lineObject.endpoints[0][0] - lineObject.endpoints[1][0]) +
        Math.abs(lineObject.endpoints[0][1] - lineObject.endpoints[1][1]) ===
        1,
  );

  const greenLinesByPoint = new Map<string, Coordinate[]>();

  // Organize green lines by their endpoints for easy lookup
  for (const line of filteredLines) {
    const [start, end] = line.endpoints;
    const startArray = greenLinesByPoint.get(CoordinateToKey(start)) ?? [];
    const endArray = greenLinesByPoint.get(CoordinateToKey(end)) ?? [];

    greenLinesByPoint.set(CoordinateToKey(start), [...startArray, end]);
    greenLinesByPoint.set(CoordinateToKey(end), [...endArray, start]);
  }

  const rulesLayer: LayerData = {
    lineObjects: {},
    surfaceObjects: {},
    textObjects: {},
    shapeObjects: {},
  };

  const labelAsInvalid = (location: Coordinate) => {
    const key = CoordinateToKey(location);
    rulesLayer.surfaceObjects[key] = {
      location,
      color: "red",
    };
  };

  const satisfyTurningConstraint = (
    location: Coordinate,
    type: "white" | "black",
  ): boolean => {
    const linesAtCircle =
      greenLinesByPoint.get(CoordinateToKey(location)) ?? [];

    // Too many lines / Not enough lines, pass
    if (linesAtCircle.length != 2) {
      return true;
    }

    // Check that two lines have different direction
    const point1 = linesAtCircle[0] as Coordinate;
    const point2 = linesAtCircle[1] as Coordinate;

    // Check that location, point 1 and point 2 are not in a straight line
    const turnedAtPearl = !(
      (point1[0] === location[0] && point2[0] === location[0]) ||
      (point1[1] === location[1] && point2[1] === location[1])
    );

    return type === "black" ? turnedAtPearl : !turnedAtPearl;
  };

  for (const bigCircle of bigCircles) {
    const isBlack =
      bigCircle.content === SPECIAL_CHARACTERS.BLACK_CIRCLE_BIG.id;
    const addInvalid = () => labelAsInvalid(bigCircle.location);

    const linesAtCircle =
      greenLinesByPoint.get(CoordinateToKey(bigCircle.location)) ?? [];

    // Not enough lines, pass
    if (linesAtCircle.length <= 1) {
      continue;
    }

    // Too many lines
    if (linesAtCircle.length > 2) {
      addInvalid();
      continue;
    }

    if (isBlack) {
      // Black big circle rule: The line must turn at the circle,
      // and must go straight in the cells immediately before or after the circle
      if (!satisfyTurningConstraint(bigCircle.location, "black")) {
        addInvalid();
        continue;
      }

      // Neighbour endpoint: Both must satisfy white turning constraint
      const neighbourEndpoints =
        greenLinesByPoint.get(CoordinateToKey(bigCircle.location)) ?? [];
      const allStraight = neighbourEndpoints.every((endpoint) =>
        satisfyTurningConstraint(endpoint, "white"),
      );

      if (!allStraight) {
        addInvalid();
        continue;
      }
    } else {
      // White big circle rule: The line must go straight through the circle,
      // and must turn in the cells immediately before or after the circle
      if (!satisfyTurningConstraint(bigCircle.location, "white")) {
        addInvalid();
        continue;
      }

      // Neighbour endpoint: at least one must satisfy black turning constraint
      const neighbourEndpoints =
        greenLinesByPoint.get(CoordinateToKey(bigCircle.location)) ?? [];
      const atLeastOneTurn = neighbourEndpoints.some((endpoint) =>
        satisfyTurningConstraint(endpoint, "black"),
      );

      if (!atLeastOneTurn) {
        addInvalid();
        continue;
      }
    }
  }

  return rulesLayer;
}

export interface RuleObject {
  id: RulesType;
  name: string;
  description: string;
  calculateRulesLayer: (
    puzzle: PuzzleData,
    playerSolution: LayerData,
  ) => LayerData;
}

export const CUSTOM_RULES_LIST: Record<RulesType, RuleObject> = {
  akari: {
    id: "akari",
    name: "Akari",
    description: `Highlights all cells that are lit by ${SPECIAL_CHARACTERS.AKARI_BULB.textGlyph}`,
    calculateRulesLayer: calculateAkariRulesLayer,
  },
  masyu: {
    id: "masyu",
    name: "Masyu",
    description: "Check if green lines satisfy white / black big circle rules",
    calculateRulesLayer: calculateMasyuRulesLayer,
  },
};

export function getRulesList(): RuleObject[] {
  return Object.values(CUSTOM_RULES_LIST);
}

export function getEnabledRulesList(puzzle: PuzzleData): RuleObject[] {
  return puzzle.options.rules.map((ruleId) => CUSTOM_RULES_LIST[ruleId]);
}

export function getEnabledCustomRulesLayers(
  puzzle: PuzzleData,
  playerSolution: LayerData,
): LayerData[] {
  const rulesLayers = getEnabledRulesList(puzzle).map((rule) =>
    rule.calculateRulesLayer(puzzle, playerSolution),
  );

  return rulesLayers;
}

export { calculateAkariRulesLayer };
