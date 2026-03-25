import type { GameData } from "@puzzpals/puzzle-models";

interface Room {
  token: string;
  puzzle_data: GameData;
}

export { type Room };
