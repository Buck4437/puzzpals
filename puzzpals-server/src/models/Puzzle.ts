import type { Grid } from "@puzzpals/puzzle-models";

export interface Puzzle {
  id: number;
  title: string;
  author: string;
  author_id: number;
  description: string;
  puzzle_json: Grid;
  publish_date: Date;
  published: boolean;
}
