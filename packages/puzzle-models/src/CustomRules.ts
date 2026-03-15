import { CoordinateToKey, type Grid, type LayerData } from "./Grid.js";

const ADJACENT_DIRECTIONS: [number, number][] = [
  [0, 1], // Up
  [0, -1], // Down
  [1, 0], // Right
  [-1, 0], // Left
];

function calculateAkariRulesLayer(grid: Grid, playerSolution: LayerData) {
  const rulesLayer: LayerData = {
    lineObjects: {},
    surfaceObjects: {},
    symbolObjects: {},
  };

  // Fetch all walls from the problem layer
  const walls = Object.values(grid.problem.surfaceObjects).filter(
    (surfaceObject) => surfaceObject.color === "black",
  );

  // // Fetch all walls with numbers
  // const numberedWalls = walls.filter((wall) => {
  //     const symbolObject = Object.values(grid.problem.symbolObjects).find(
  //         (symbol) =>
  //             symbol.location[0] === wall.location[0] &&
  //             symbol.location[1] === wall.location[1],
  //     );
  //     return symbolObject !== undefined;
  // })

  // Fetch all light bulbs, represented by the symbol "O"
  const lightBulbs = Object.values(playerSolution.symbolObjects).filter(
    (symbol) => symbol.content === "O",
  );

  // Light up surfaces that are adjacent to light bulbs, until a wall is hit
  for (const lightBulb of lightBulbs) {
    const originKey = CoordinateToKey(lightBulb.location);
    rulesLayer.surfaceObjects[originKey] = {
      location: lightBulb.location,
      color: "yellow", // You can choose any color to represent lit surfaces
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
          break; // Stop lighting up in this direction if a wall is hit
        }

        const key = CoordinateToKey(currentLocation);
        rulesLayer.surfaceObjects[key] = {
          location: currentLocation,
          color: "yellow", // You can choose any color to represent lit surfaces
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

export { calculateAkariRulesLayer };
