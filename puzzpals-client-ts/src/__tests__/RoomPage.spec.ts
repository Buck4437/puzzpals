import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import api from "@/__mocks__/api";
import { pushMock, useRouter } from "@/__mocks__/router";
import socket from "@/__mocks__/socket";

import { BULB, bulbText, NO_INPUT } from "@/models/Cell";
import type GridState from "@/models/GridState";
import RoomPage from "@/views/RoomPage.vue";

vi.mock("@/socket", () => ({ default: socket }));
vi.mock("@/services/api", () => ({ default: api }));
vi.mock("vue-router", () => ({ useRouter }));

describe("RoomPage", () => {
  const gridState: GridState = {
    rows: 1,
    cols: 2,
    cells: [
      {
        isBlack: true,
        number: 1,
        input: NO_INPUT,
      },
      {
        isBlack: false,
        number: null,
        input: BULB,
      },
    ],
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
    api.get.mockResolvedValueOnce({ data: { room: token } });

    // Load the room page
    mount(RoomPage, { props: { token: token } });
    await flushPromises();

    // Server receives request to join room
    expect(socket.emit).toHaveBeenCalledWith("room:join", token);
  });

  it("redirects to 404 if room does not exist", async () => {
    api.get.mockRejectedValueOnce({ response: { status: 404 } });

    // Load the room page with non-existent room
    mount(RoomPage, { props: { token: token } });
    await flushPromises();

    // Redirect to 404
    expect(pushMock).toHaveBeenCalledWith("/404");
  });

  it("leaves room when button pressed", async () => {
    const wrapper = mount(RoomPage, { props: { token: token } });
    await flushPromises();

    socket.call("room:initialize", gridState, user);
    await nextTick();

    // Click leave room button
    wrapper.get("button").trigger("click");
    await flushPromises();

    // Server receives request to leave room
    expect(socket.disconnect).toHaveBeenCalledOnce();
  });

  it("leaves room when leaving page", async () => {
    const wrapper = mount(RoomPage, { props: { token: token } });
    await flushPromises();

    // Leave page by changing URL
    wrapper.unmount();

    // Server receives request to leave room
    expect(socket.disconnect).toHaveBeenCalledOnce();
  });

  it("synchronises your grid upon entering room", async () => {
    const wrapper = mount(RoomPage, { props: { token: token } });

    socket.call("room:initialize", gridState, user);
    await nextTick();

    const cells = wrapper.findAll("div.cell");
    expect(cells).toHaveLength(2);

    expect(cells[0]?.text()).toStrictEqual("1");
    expect(cells[0]?.classes()).toContain("black");

    expect(cells[1]?.text()).toStrictEqual(bulbText);
    expect(cells[1]?.classes()).toContain("white");
  });

  it("synchronises your grid when others edit a cell", async () => {
    const wrapper = mount(RoomPage, { props: { token: token } });

    // Set up the grid
    socket.call("room:initialize", gridState, user);
    await nextTick();

    // Update the second cell
    socket.call("grid:cellUpdated", 1, NO_INPUT);
    await nextTick();

    const cell = wrapper.findAll("div.cell")[1];
    expect(cell?.text()).toStrictEqual("");
  });

  it("synchronises other grids when you edit a cell", async () => {
    const wrapper = mount(RoomPage, { props: { token: token } });

    // Set up the grid
    socket.call("room:initialize", gridState, user);
    await nextTick();

    // Click the second cell
    const cell = wrapper.findAll("div.cell")[1];
    await cell?.trigger("click");

    // Assert data emitted to socket
    expect(socket.emit).toHaveBeenCalledWith("grid:updateCell", 1, NO_INPUT);
  });

  // As a player, I want to communicate with other players
  // so that we can share insights.
  it("can send messages to other players", async () => {
    const msgtext = "Hello, world!";
    const message = { msgtext };

    const wrapper = mount(RoomPage, { props: { token } });
    socket.call("room:initialize", gridState, user);
    await nextTick();

    const chatForm = wrapper.get("form.chat-input");
    const textInput = chatForm.get("input");

    // Type "Hello, world!" and send
    textInput.setValue(msgtext);
    chatForm.trigger("submit.prevent");

    // Assert message sent
    expect(socket.emit).toHaveBeenCalledWith("chat:newMessage", message);
  });

  it("can receive messages from other players", async () => {
    const otherUser = "user_abcdefghij_00000001";
    const msgtext = "Hello, world!";
    const message = { user: otherUser, msgtext, timestamp: 0 };

    const wrapper = mount(RoomPage, { props: { token } });
    socket.call("room:initialize", gridState, user);
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
