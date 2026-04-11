import type { PuzzleData } from "@puzzpals/puzzle-models";

export interface UploadedPuzzle {
  id: number;
  author: string;
  author_id: number;
  description: string;
  puzzle_json: PuzzleData;
  publish_date: Date;
  published: boolean;
}
