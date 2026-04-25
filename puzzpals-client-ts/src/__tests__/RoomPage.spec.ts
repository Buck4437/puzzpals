import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import type { GameData } from "@puzzpals/puzzle-models";

import api from "@/__mocks__/api";
import { pushMock, useRouter } from "@/__mocks__/router";
import socket from "@/__mocks__/socket";

import RoomPage from "@/views/RoomPage.vue";

vi.mock("@/socket", () => ({ default: socket }));
vi.mock("@/services/api", () => ({ default: api }));
vi.mock("vue-router", () => ({ useRouter }));

describe("RoomPage", () => {
  const gameData: GameData = {
    puzzle: {
      title: "Untitled Puzzle",
      instructions: "",
      size: [1, 1],
      problem: {
        lineObjects: {},
        surfaceObjects: {},
        textObjects: {},
        shapeObjects: {},
      },
      options: {
        rules: [],
      },
    },
    playerSolution: {
      lineObjects: {},
      surfaceObjects: {},
      textObjects: {},
      shapeObjects: {},
    },
  };

  const token = "abcdefghij";
  const user = "user_abcdefghij_00000000";

  beforeEach(() => {
    vi.clearAllMocks();
    socket.reset();
  });

  // As a player, I want to synchronise my progress with other players
  // so that we can collaborate on the same puzzle.
  it("joins room", async () => {
    api.get.mockResolvedValueOnce({ data: { exists: true } });

    // Load the room page
    mount(RoomPage, { props: { token: token } });
    await flushPromises();

    // Server receives request to join room
    expect(socket.connect).toHaveBeenCalledOnce();
    expect(socket.emit).toHaveBeenCalledWith("room:join", token);
  });

  it("redirects to 404 if room does not exist", async () => {
    api.get.mockResolvedValueOnce({ data: { exists: false } });

    // Load the room page with non-existent room
    mount(RoomPage, { props: { token: token } });
    await flushPromises();

    // Redirect to 404
    expect(pushMock).toHaveBeenCalledWith("/404");
  });

  it("leaves room when leaving page", async () => {
    const wrapper = mount(RoomPage, { props: { token: token } });
    await flushPromises();

    // Leave page by changing URL
    wrapper.unmount();

    // Server receives request to leave room
    expect(socket.disconnect).toHaveBeenCalledOnce();
  });

  // As a player, I want to communicate with other players
  // so that we can share insights.
  it("can send messages to other players", async () => {
    const msgtext = "Hello, world!";
    const message = { msgtext };

    const wrapper = mount(RoomPage, { props: { token } });
    socket.call("room:initialize", gameData, user);
    await nextTick();

    const chatForm = wrapper.get("form.chat-input");
    const textInput = chatForm.get("input");

    // Type "Hello, world!" and send
    await textInput.setValue(msgtext);
    await chatForm.trigger("submit.prevent");

    // Assert message sent
    expect(socket.emit).toHaveBeenCalledWith("chat:sendMessage", message);
  });

  it("can receive messages from other players", async () => {
    const otherUser = "user_abcdefghij_00000001";
    const msgtext = "Hello, world!";
    const message = { user: otherUser, msgtext, timestamp: 0 };

    const wrapper = mount(RoomPage, { props: { token } });
    socket.call("room:initialize", gameData, user);
    await nextTick();

    // Receive "Hello, world!" from another user
    socket.call("chat:messageNew", message);
    await nextTick();

    // Assert message shown
    const chatBubble = wrapper.find("div.chat-message");
    expect(chatBubble.exists()).toBe(true);

    // Assert message has correct text
    const timeString = new Date(0).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    expect(chatBubble.get("div.chat-header").text()).toBe(otherUser);
    expect(chatBubble.get("div.chat-text").text()).toBe(msgtext);
    expect(chatBubble.get("div.chat-footer").text()).toBe(timeString);
  });
});
