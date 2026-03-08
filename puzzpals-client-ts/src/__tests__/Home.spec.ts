import api from "@/__mocks__/api";
import { pushMock, useRouter } from "@/__mocks__/router";

import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Home from "@/views/Home.vue";

vi.mock("@/services/api", () => ({ default: api }));
vi.mock("vue-router", () => ({ useRouter }));

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.alert = vi.fn(console.log);
  });

  // As a player, I want to upload puzzles
  // so that I can play puzzles that I found.
  it("can upload puzzle and create room", async () => {
    const wrapper = mount(Home);

    const puzzle = {
      type: "akari",
      grid: [[".", "1", "#"]],
    };

    const fileContent = JSON.stringify(puzzle);
    const puzzleFile = new File([fileContent], "puzzle.json");

    // It is difficult to simulate the player picking a file
    // via the <input> element, so we expose `onFilePicked`
    wrapper.vm.onFilePicked(puzzleFile);

    api.post.mockResolvedValueOnce({ data: { token: "abcdefghij" } });

    wrapper.get("button").trigger("click");
    await flushPromises(); // Read file
    await flushPromises(); // Call API

    // Create room (check the first two arguments only)
    expect(api.post).toHaveBeenCalledOnce();
    const [url, body] = api.post.mock.calls[0] ?? [];
    expect(url).toBe("/rooms/create");
    expect(body).toStrictEqual(puzzle);

    // Join room
    expect(pushMock).toHaveBeenCalledWith("/room/abcdefghij");
  });

  it("shows alert when no file is picked", () => {
    const wrapper = mount(Home);
    wrapper.vm.onFilePicked(null);
    wrapper.get("button").trigger("click");

    expect(alert).toHaveBeenCalledOnce();
  });

  it("shows alert when file is not valid JSON", async () => {
    const wrapper = mount(Home);
    const invalidFile = new File(["Hello, world!"], "puzzle.json");
    wrapper.vm.onFilePicked(invalidFile);

    wrapper.get("button").trigger("click");
    await flushPromises(); // Attempt to read file
    await flushPromises(); // TODO: Investigate why this line is needed for tests to pass

    // Alert: Not valid JSON
    expect(alert).toHaveBeenCalledOnce();
  });

  it("shows alert when API errors", async () => {
    const wrapper = mount(Home);

    const puzzle = {
      type: "akari",
      grid: [[".", "1", "#"]],
    };

    const fileContent = JSON.stringify(puzzle);
    const puzzleFile = new File([fileContent], "puzzle.json");
    wrapper.vm.onFilePicked(puzzleFile);

    api.post.mockRejectedValueOnce(new Error("API error"));

    wrapper.get("button").trigger("click");
    await flushPromises(); // Read file
    await flushPromises(); // Call API

    // Alert: API error
    expect(alert).toHaveBeenCalledOnce();
  });
});
