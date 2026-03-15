export interface ShapeInfo {
  id: string;
  label: string;
  textGlyph: string;
  imageAsset?: string;
}

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

export const SPECIAL_CHARACTERS = {
  CROSS_MARK,
  AKARI_BULB,
};

export const SPECIAL_CHARACTERS_LIST: ShapeInfo[] = [CROSS_MARK, AKARI_BULB];

export function getSpecialCharacterById(id: string): ShapeInfo | null {
  return SPECIAL_CHARACTERS_LIST.find((shape) => shape.id === id) ?? null;
}

export function getSpecialCharacterIds(): string[] {
  return SPECIAL_CHARACTERS_LIST.map((shape) => shape.id);
}
