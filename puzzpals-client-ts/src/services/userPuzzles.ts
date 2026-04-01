import api from "./api";

export async function fetchUserPuzzles() {
  const res = await api.get("/puzzles/user");
  return res.data;
}
