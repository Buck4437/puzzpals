import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";

import GridSVG from "@/components/editor/GridSVG.vue";

function createWrapper() {
  const wrapper = mount(GridSVG, {
    props: {
      layers: [],
      gridSize: [2, 2],
      displaySize: 100,
    },
  });

  const svg = wrapper.get("svg.svg-grid");
  const spy = vi.spyOn(svg.element, "getBoundingClientRect");
  const rect = new DOMRect(0, 0, 100, 100);
  spy.mockImplementation(() => rect);

  return {
    wrapper: wrapper,
    svg: svg,
  };
}

describe("handlePointerMove", () => {
  it("emits coordinate of cell centre", async () => {
    const { wrapper, svg } = createWrapper();

    await svg.trigger("mousemove", {
      clientX: 25,
      clientY: 25,
    });

    const event = wrapper.emitted("centerCellHover") as unknown[][];
    expect(event).toHaveLength(1);
    expect(event[0]).toEqual([[0.5, 0.5]]);
  });

  it("emits null if pointer outside grid", async () => {
    const { wrapper, svg } = createWrapper();

    await svg.trigger("mousemove", {
      clientX: 0,
      clientY: 0,
    });

    const event = wrapper.emitted("centerCellHover") as unknown[][];
    expect(event).toHaveLength(1);
    expect(event[0]).toEqual([null]);
  });

  it("emits centre coordinate when dragging to centre", async () => {
    const { wrapper, svg } = createWrapper();

    // Click a cell
    await svg.trigger("mousedown", {
      clientX: 25,
      clientY: 25,
    });

    // Drag to the right
    await svg.trigger("mousemove", {
      clientX: 75,
      clientY: 25,
    });

    const event = wrapper.emitted("centerCellEnter") as unknown[][];
    expect(event).toHaveLength(2);
    expect(event[0]).toEqual([[0.5, 0.5]]);
    expect(event[1]).toEqual([[0.5, 1.5]]);
  });

  it("respects cell centre hitboxes", async () => {
    const { wrapper, svg } = createWrapper();

    await svg.trigger("mousedown", {
      clientX: 25,
      clientY: 25,
    });

    await svg.trigger("mousemove", {
      clientX: 50,
      clientY: 50,
    });

    // (50, 50) is not near a cell centre, so only one emit
    expect(wrapper.emitted("centerCellEnter")).toHaveLength(1);
  });

  it("emits corner coordinate when dragging to corner", async () => {
    const { wrapper, svg } = createWrapper();

    await svg.trigger("mousedown", {
      clientX: 50,
      clientY: 50,
    });

    await svg.trigger("mousemove", {
      clientX: 95,
      clientY: 95,
    });

    const event = wrapper.emitted("cornerCellEnter") as unknown[][];
    expect(event).toHaveLength(2);
    expect(event[0]).toEqual([[1, 1]]);
    expect(event[1]).toEqual([[2, 2]]);
  });

  it("respects cell corner hitboxes", async () => {
    const { wrapper, svg } = createWrapper();

    await svg.trigger("mousedown", {
      clientX: 50,
      clientY: 50,
    });

    await svg.trigger("mousemove", {
      clientX: 75,
      clientY: 75,
    });

    // (75, 75) is not near a cell corner, so only one emit
    expect(wrapper.emitted("cornerCellEnter")).toHaveLength(1);
  });
});
