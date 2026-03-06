import type { Coordinate } from "../models/Grid";

export function coordinateToString(coordinate: Coordinate): string {
  return `${coordinate[0]},${coordinate[1]}`;
}
