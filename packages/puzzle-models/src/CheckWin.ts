import { type LayerData, type SolutionData } from "./Grid.js";

export function hasWon(
  playerSolution: LayerData,
  solution: SolutionData,
): boolean {
  for (const type of solution.typeToCheck) {
    const playerObjects = playerSolution[type];
    const solutionObjects = solution[type];

    // Check if the number of objects of this type matches
    if (
      Object.keys(playerObjects).length !== Object.keys(solutionObjects).length
    ) {
      return false;
    }
    // Check if each object matches
    for (const key in solutionObjects) {
      if (!(key in playerObjects)) {
        return false;
      }
      const playerObject = playerObjects[key];
      const solutionObject = solutionObjects[key];
      if (JSON.stringify(playerObject) !== JSON.stringify(solutionObject)) {
        return false;
      }
    }
  }
  return true;
}
