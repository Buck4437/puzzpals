import {
  type Grid,
  type LayerData,
  type RulesType,
  type SolutionData,
  type TypeToCheck,
} from "@puzzpals/puzzle-models";

type PlainObject = Record<string, unknown>;

const validTypeToCheckValues = new Set([
  "lineObjectsExact",
  "lineObjectsGreenOnly",
  "surfaceObjectsExact",
  "surfaceObjectsDarkOnly",
  "textObjectsExact",
  "textObjectsContentOnly",
  "shapeObjectsExcludeCrossMarks",
]);

const oldTypeToCheckMap: Record<string, TypeToCheck> = {};

const validRulesTypeValues = new Set<RulesType>(["akari"]);

function createEmptyLayerData(): LayerData {
  return {
    lineObjects: {},
    surfaceObjects: {},
    textObjects: {},
    shapeObjects: {},
  };
}

function createEmptySolutionData(): SolutionData {
  return {
    ...createEmptyLayerData(),
    typeToCheck: [],
  };
}

function createEmptyGrid(): Grid {
  return {
    size: [0, 0],
    problem: createEmptyLayerData(),
    options: {
      rules: [],
    },
  };
}

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidSize(value: unknown): value is Grid["size"] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every(
      (entry) =>
        typeof entry === "number" && Number.isFinite(entry) && entry > 0,
    )
  );
}

function isValidTypeToCheckArray(
  value: unknown,
): value is SolutionData["typeToCheck"] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) => typeof entry === "string" && validTypeToCheckValues.has(entry),
    )
  );
}

function updateTypeToCheck(value: unknown): SolutionData["typeToCheck"] {
  if (!Array.isArray(value)) {
    return [];
  }

  const updated = value
    .map((entry) => {
      if (typeof entry !== "string") {
        return null;
      }

      // Migrate old type names to new names
      if (entry in oldTypeToCheckMap) {
        return oldTypeToCheckMap[entry];
      }

      return validTypeToCheckValues.has(entry) ? (entry as TypeToCheck) : null;
    })
    .filter((entry): entry is TypeToCheck => entry !== null);

  return Array.from(new Set(updated));
}

function sanitizeRulesTypeArray(value: unknown): Grid["options"]["rules"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (entry): entry is RulesType =>
      typeof entry === "string" && validRulesTypeValues.has(entry as RulesType),
  );
}

function cloneDefault<T>(defaultValue: T): T {
  if (Array.isArray(defaultValue)) {
    return [...defaultValue] as T;
  }

  if (isPlainObject(defaultValue)) {
    const clone: PlainObject = {};
    for (const [key, value] of Object.entries(defaultValue)) {
      clone[key] = cloneDefault(value);
    }
    return clone as T;
  }

  return defaultValue;
}

function buildValidObject<T>(obj: unknown, defaultObj: T): T {
  if (Array.isArray(defaultObj)) {
    return Array.isArray(obj) && obj.length === defaultObj.length
      ? (obj as T)
      : cloneDefault(defaultObj);
  }

  if (!isPlainObject(defaultObj)) {
    return typeof obj === typeof defaultObj ? (obj as T) : defaultObj;
  }

  if (!isPlainObject(obj)) {
    return cloneDefault(defaultObj);
  }

  const defaultEntries = Object.entries(defaultObj);
  if (defaultEntries.length === 0) {
    return { ...obj } as T;
  }

  const result: PlainObject = {};
  for (const [key, value] of defaultEntries) {
    result[key] = buildValidObject(obj[key], value);
  }

  return result as T;
}

function parsePuzzle(input: unknown): Grid {
  if (!isPlainObject(input)) {
    throw new Error("Puzzle data must be an object");
  }

  const defaultPuzzle = createEmptyGrid();
  for (const key of Object.keys(defaultPuzzle)) {
    if (!(key in input)) {
      throw new Error(`Missing key: ${key}`);
    }
  }

  const puzzle = buildValidObject(input, defaultPuzzle);
  if (!isValidSize(input.size)) {
    throw new Error("Puzzle size must be a tuple of two positive numbers");
  }
  puzzle.size = input.size;
  puzzle.options.rules = isPlainObject(input.options)
    ? sanitizeRulesTypeArray(input.options.rules)
    : [];

  if ("solution" in input) {
    if (!isPlainObject(input.solution)) {
      throw new Error("Puzzle solution must be an object");
    }
    const updatedTypeToCheck = updateTypeToCheck(input.solution.typeToCheck);

    if (
      !isValidTypeToCheckArray(updatedTypeToCheck) ||
      !Array.isArray(input.solution.typeToCheck)
    ) {
      throw new Error(
        "Puzzle solution typeToCheck must be an array containing valid check types",
      );
    }
    puzzle.solution = buildValidObject(
      input.solution,
      createEmptySolutionData(),
    );
    puzzle.solution.typeToCheck = updatedTypeToCheck;
  }

  return puzzle;
}

export { parsePuzzle, createEmptyLayerData };
