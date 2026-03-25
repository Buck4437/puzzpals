import axios from "axios";

export async function fetchUserPuzzles() {
  const res = await axios.get("/api/puzzles/user", { withCredentials: true });
  return res.data;
}
