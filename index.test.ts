import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { test, expect } from "bun:test";

import { Stage } from "./index.ts";

GlobalRegistrator.register();

const domTestHelpers = {
  async loadImage(url: string): Promise<ImageBitmap> {
    return { height: 0, width: 0, close() {} };
  },
  getCanvasContext() {
    return {
      drawImage(
        _image: CanvasImageSource,
        _dx: number,
        _dy: number,
        _dw: number,
        _dh: number,
      ) {},
      clearRect: () => {},
      save: () => {},
      translate: () => {},
      restore: () => {},
    };
  },
  async createImageBitmap(_: HTMLCanvasElement): Promise<ImageBitmap> {
    return { height: 0, width: 0, close() {} };
  },
};

test("repeat", async () => {
  const stage = new Stage(document.createElement("canvas"), domTestHelpers);
  const cat = await stage.addSprite("cat.png");

  const firstTick = stage._tickCount;
  let elapsedTicks = 0;
  cat.whenKeyPressed("space", function* () {
    this.move(10);
    yield* this.repeat(9, function* () {
      this.move(1);
    });
    elapsedTicks = stage._tickCount - firstTick;
  });

  const event = new KeyboardEvent("keypress", {
    key: " ",
    code: "Space",
    charCode: 32,
    keyCode: 32,
    shiftKey: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    bubbles: true,
    cancelable: true,
  });

  // Dispatch the event
  document.dispatchEvent(event);
  for (let i = 0; i < 10; i++) {
    stage.tick();
  }
  expect(elapsedTicks).toBe(10);
});
