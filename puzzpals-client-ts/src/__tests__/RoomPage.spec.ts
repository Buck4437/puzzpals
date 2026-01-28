import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import api from "@/__mocks__/api";
import { pushMock, useRouter } from "@/__mocks__/router";
import socket from "@/__mocks__/socket";

import { BULB, bulbText, NO_INPUT } from "@/models/Cell";
import type GridState from "@/models/GridState";
import RoomPage from "@/views/RoomPage.vue";

vi.mock('@/socket', () => ({ default: socket }));
vi.mock('@/services/api', () => ({ default: api }));
vi.mock('vue-router', () => ({ useRouter }));

describe('RoomPage', () => {
  const gridState: GridState = {
    rows: 1,
    cols: 2,
    cells: [{
      isBlack: true,
      number: 1,
      input: NO_INPUT
    }, {
      isBlack: false,
      number: null,
      input: BULB
    }]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    socket.reset();
  });

  // As a player, I want to synchronise my progress with other players
  // so that we can collaborate on the same puzzle.
  it('joins room', async () => {
    api.get.mockResolvedValueOnce({ data: { room: 'TestRm' } });

    // Load the room page with 'TestRm' as token
    mount(RoomPage, { props: { token: 'TestRm' } });
    await flushPromises();

    // Server receives request to join room
    expect(socket.emit).toHaveBeenCalledWith('room:join', { token: 'TestRm' });
  });

  it('redirects to 404 if room does not exist', async () => {
    api.get.mockRejectedValueOnce({ response: { status: 404 } });

    // Load the room page with non-existent room
    mount(RoomPage, { props: { token: 'TestRn' } });
    await flushPromises();

    // Redirect to 404
    expect(pushMock).toHaveBeenCalledWith('/404');
  });

  it('leaves room when button pressed', async () => {
    const wrapper = mount(RoomPage, { props: { token: 'TestRm' } });
    await flushPromises();

    socket.emitServerEvent('grid:state', gridState);
    await nextTick();

    // Click leave room button
    wrapper.find('button').trigger('click');
    await flushPromises();

    // Server receives request to leave room
    expect(socket.emit).toHaveBeenCalledWith('room:leave', { token: 'TestRm' });
  });

  it('leaves room when leaving page', async () => {
    const wrapper = mount(RoomPage, { props: { token: 'TestRm' } });
    await flushPromises();

    // Leave page by changing URL
    wrapper.unmount();

    // Server receives request to leave room
    expect(socket.emit).toHaveBeenCalledWith('room:leave', { token: 'TestRm' });
  });

  it('synchronises your grid upon entering room', async () => {
    const wrapper = mount(RoomPage, { props: { token: 'TestRm' } });

    socket.emitServerEvent('grid:state', gridState);
    await nextTick();

    const cells = wrapper.findAll('div.cell');
    expect(cells).toHaveLength(2);

    expect(cells[0]?.text()).toStrictEqual('1');
    expect(cells[0]?.classes()).toContain('black');

    expect(cells[1]?.text()).toStrictEqual(bulbText);
    expect(cells[1]?.classes()).toContain('white');
  });

  it('synchronises your grid when others edit a cell', async () => {
    const wrapper = mount(RoomPage, { props: { token: 'TestRm' } });

    // Set up the grid
    socket.emitServerEvent('grid:state', gridState);
    await nextTick();

    const data = {
      idx: 1,
      value: {
        isBlack: false,
        number: null,
        input: NO_INPUT
      }
    };

    // Update the second cell
    socket.emitServerEvent('grid:cellUpdated', data);
    await nextTick();

    const cell = wrapper.findAll('div.cell')[1];
    expect(cell?.text()).toStrictEqual('');
  });

  it('synchronises other grids when you edit a cell', async () => {
    const wrapper = mount(RoomPage, { props: { token: 'TestRm' } });

    // Set up the grid
    socket.emitServerEvent('grid:state', gridState);
    await nextTick();

    // Click the second cell
    const cell = wrapper.findAll('div.cell')[1];
    await cell?.trigger('click');

    const expectedPayload = {
      token: 'TestRm',
      idx: 1,
      value: {
        isBlack: false,
        number: null,
        input: NO_INPUT
      }
    };

    // Assert data emitted to socket
    expect(socket.emit).toHaveBeenCalledWith('grid:updateCell', expectedPayload);
  });
});