import api from "@/services/api";
import type { PuzzleData } from "@puzzpals/puzzle-models";

export interface Puzzle {
  id: number;
  author: string;
  description: string;
  puzzle_json: PuzzleData;
  publish_date: Date;
}

export interface SearchParams {
  title?: string;
  description?: string;
  author?: string;
  date_start?: string;
  date_end?: string;
  limit?: number;
  offset?: number;
  sort_field?: string;
  sort_dir?: string;
}

// For user puzzle search only
export interface UserPuzzleSearchParams extends SearchParams {
  published?: boolean;
}

export const PUZZLE_PAGE_SIZE = 15;
export const MY_PUZZLES_PAGE_SIZE = 30;

export function getSearchParams(
  search: Partial<SearchParams>,
  sort: { field: string; dir: string },
  offset: number,
): SearchParams {
  const params: Record<string, string | number> = {
    limit: PUZZLE_PAGE_SIZE,
    offset,
    sort_field: sort.field,
    sort_dir: sort.dir,
  };
  if (search.title) params.title = search.title;
  if (search.description) params.description = search.description;
  if (search.author) params.author = search.author;
  if (search.date_start) params.date_start = search.date_start;
  if (search.date_end) params.date_end = search.date_end;
  return params;
}

export async function fetchPuzzles(params: SearchParams): Promise<Puzzle[]> {
  const { data } = await api.get("/puzzles", { params });
  return Array.isArray(data) ? data : [];
}

export async function fetchUserPuzzles(
  params?: UserPuzzleSearchParams,
): Promise<Puzzle[]> {
  const res = await api.get("/puzzles/user", { params });
  if (Array.isArray(res.data)) {
    return res.data;
  }
  if (Array.isArray(res.data?.puzzles)) {
    return res.data.puzzles;
  }
  return [];
}

export function validateSearchParams(
  search: Partial<SearchParams>,
  maxDate: string,
): string | null {
  const start = new Date(search.date_start ?? "");
  const end = new Date(search.date_end ?? "");
  const allFieldsEmpty = !search.title && !search.description && !search.author;

  if ((search.date_start ?? "") > (search.date_end ?? "")) {
    return "Start date cannot be after end date.";
  }
  if (
    (search.date_end ?? "") > maxDate ||
    (search.date_start ?? "") > maxDate
  ) {
    return "Dates cannot be in the future.";
  }
  if (allFieldsEmpty) {
    const msInMonth = 30 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > 12 * msInMonth) {
      return "Date range cannot exceed 1 year when all fields are empty.";
    }
  }
  return null;
}

export function validateMySearchParams(
  search: Partial<SearchParams>,
  maxDate: string,
): string | null {
  // const start = new Date(search.date_start ?? "");
  // const end = new Date(search.date_end ?? "");

  if ((search.date_start ?? "") > (search.date_end ?? "")) {
    return "Start date cannot be after end date.";
  }
  if (
    (search.date_end ?? "") > maxDate ||
    (search.date_start ?? "") > maxDate
  ) {
    return "Dates cannot be in the future.";
  }
  return null;
}
