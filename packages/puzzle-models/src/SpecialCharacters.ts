interface TextGlyphShapeInfo {
  id: string;
  label: string;
  textGlyph: string;
}

interface ImageAssetShapeInfo {
  id: string;
  label: string;
  imageAsset: string;
}

export type ShapeInfo = TextGlyphShapeInfo | ImageAssetShapeInfo;

const CROSS_MARK: ShapeInfo = {
  id: "cross_mark",
  label: "Cross mark",
  textGlyph: "×",
};

const AKARI_BULB: ShapeInfo = {
  id: "akari_bulb",
  label: "Akari bulb",
  textGlyph: "💡",
};

const WHITE_CIRCLE_BIG: ShapeInfo = {
  id: "white_circle_big",
  label: "White Circle (Big)",
  imageAsset: "white_circle_big",
};

const BLACK_CIRCLE_BIG: ShapeInfo = {
  id: "black_circle_big",
  label: "Black Circle (Big)",
  imageAsset: "black_circle_big",
};

export const SPECIAL_CHARACTERS = {
  CROSS_MARK,
  AKARI_BULB,
  WHITE_CIRCLE_BIG,
  BLACK_CIRCLE_BIG,
};

export const SPECIAL_CHARACTERS_LIST: ShapeInfo[] = [
  WHITE_CIRCLE_BIG,
  BLACK_CIRCLE_BIG,
  AKARI_BULB,
  CROSS_MARK,
];

export function getSpecialCharacterById(id: string): ShapeInfo | null {
  return SPECIAL_CHARACTERS_LIST.find((shape) => shape.id === id) ?? null;
}

export function getSpecialCharacterIds(): string[] {
  return SPECIAL_CHARACTERS_LIST.map((shape) => shape.id);
}
