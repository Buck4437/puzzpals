import {
  type LayerData,
  type SolutionData,
  type ShapeObjectDict,
  type TypeToCheck,
  type LineObjectDict,
} from "./Grid.js";
import { SPECIAL_CHARACTERS } from "./SpecialCharacters.js";

export interface AnswerCheckObject {
  type: TypeToCheck;
  name: string;
  description: string;
}

export const ANSWER_CHECK_INFO: Record<TypeToCheck, AnswerCheckObject> = {
  lineObjectsExact: {
    type: "lineObjectsExact",
    name: "Lines (Exact)",
    description: "Line must match exactly",
  },
  lineObjectsGreenOnly: {
    type: "lineObjectsGreenOnly",
    name: "Lines (Green only)",
    description: "Only checks green lines",
  },
  surfaceObjectsExact: {
    type: "surfaceObjectsExact",
    name: "Surfaces (Exact)",
    description: "Surface must match exactly",
  },
  surfaceObjectsDarkOnly: {
    type: "surfaceObjectsDarkOnly",
    name: "Surfaces (Dark only)",
    description:
      "Only checks dark surfaces (black, dark gray, light gray all count as the same color)",
  },
  textObjectsExact: {
    type: "textObjectsExact",
    name: "Text (Exact)",
    description: "Text must match exactly",
  },
  textObjectsContentOnly: {
    type: "textObjectsContentOnly",
    name: "Text (Content only)",
    description: "Checks text positions and content, ignoring text color.",
  },
  shapeObjectsExcludeCrossMarks: {
    type: "shapeObjectsExcludeCrossMarks",
    name: "Shapes (Exclude cross marks)",
    description: "Checks shapes except cross marks",
  },
};

export function getAnswerCheckList(): AnswerCheckObject[] {
  return Object.values(ANSWER_CHECK_INFO);
}

export function getAnswerCheckListFromTypes(
  types: TypeToCheck[],
): AnswerCheckObject[] {
  return types.map((type) => ANSWER_CHECK_INFO[type]);
}

export function hasWon(
  playerSolution: LayerData,
  solution: SolutionData,
): boolean {
  for (const type of solution.typeToCheck) {
    switch (type) {
      case "lineObjectsExact":
        if (
          !recordsMatch(
            playerSolution.lineObjects,
            solution.lineObjects,
            (playerObject, solutionObject) =>
              playerObject.start[0] === solutionObject.start[0] &&
              playerObject.start[1] === solutionObject.start[1] &&
              playerObject.end[0] === solutionObject.end[0] &&
              playerObject.end[1] === solutionObject.end[1] &&
              playerObject.color === solutionObject.color,
          )
        ) {
          return false;
        }
        break;
      case "lineObjectsGreenOnly":
        if (
          !recordsMatch(
            filterOutNonGreen(playerSolution.lineObjects),
            filterOutNonGreen(solution.lineObjects),
            (playerObject, solutionObject) =>
              playerObject.start[0] === solutionObject.start[0] &&
              playerObject.start[1] === solutionObject.start[1] &&
              playerObject.end[0] === solutionObject.end[0] &&
              playerObject.end[1] === solutionObject.end[1],
          )
        ) {
          return false;
        }
        break;
      case "surfaceObjectsExact":
        if (
          !recordsMatch(
            playerSolution.surfaceObjects,
            solution.surfaceObjects,
            (playerObject, solutionObject) =>
              playerObject.location[0] === solutionObject.location[0] &&
              playerObject.location[1] === solutionObject.location[1] &&
              playerObject.color === solutionObject.color,
          )
        ) {
          return false;
        }
        break;
      case "surfaceObjectsDarkOnly":
        if (
          !recordsMatch(
            playerSolution.surfaceObjects,
            solution.surfaceObjects,
            (playerObject, solutionObject) =>
              playerObject.location[0] === solutionObject.location[0] &&
              playerObject.location[1] === solutionObject.location[1] &&
              normalizeSurfaceColor(playerObject.color) ===
                normalizeSurfaceColor(solutionObject.color),
          )
        ) {
          return false;
        }
        break;
      case "textObjectsExact":
        if (
          !recordsMatch(
            playerSolution.textObjects,
            solution.textObjects,
            (playerObject, solutionObject) =>
              playerObject.location[0] === solutionObject.location[0] &&
              playerObject.location[1] === solutionObject.location[1] &&
              playerObject.content === solutionObject.content &&
              playerObject.color === solutionObject.color,
          )
        ) {
          return false;
        }
        break;
      case "textObjectsContentOnly":
        if (
          !recordsMatch(
            playerSolution.textObjects,
            solution.textObjects,
            (playerObject, solutionObject) =>
              playerObject.location[0] === solutionObject.location[0] &&
              playerObject.location[1] === solutionObject.location[1] &&
              playerObject.content === solutionObject.content,
          )
        ) {
          return false;
        }
        break;
      case "shapeObjectsExcludeCrossMarks":
        if (
          !recordsMatch(
            filterOutCrossMarks(playerSolution.shapeObjects),
            filterOutCrossMarks(solution.shapeObjects),
            (playerObject, solutionObject) =>
              playerObject.location[0] === solutionObject.location[0] &&
              playerObject.location[1] === solutionObject.location[1] &&
              playerObject.content === solutionObject.content,
          )
        ) {
          return false;
        }
        break;
    }
  }
  return true;
}

function recordsMatch<T>(
  playerObjects: Record<string, T>,
  solutionObjects: Record<string, T>,
  compare: (playerObject: T, solutionObject: T) => boolean,
): boolean {
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
    if (playerObject === undefined || solutionObject === undefined) {
      return false;
    }

    if (!compare(playerObject, solutionObject)) {
      return false;
    }
  }

  return true;
}

function normalizeSurfaceColor(color: string): string {
  if (color === "black" || color === "lightgray" || color === "darkgray") {
    return "dark";
  }

  return color;
}

function filterOutNonGreen(lineObjects: LineObjectDict): LineObjectDict {
  return Object.fromEntries(
    Object.entries(lineObjects).filter(([, line]) => line.color === "green"),
  );
}

function filterOutCrossMarks(shapeObjects: ShapeObjectDict): ShapeObjectDict {
  return Object.fromEntries(
    Object.entries(shapeObjects).filter(
      ([, shape]) => shape.content !== SPECIAL_CHARACTERS.CROSS_MARK.id,
    ),
  );
}
