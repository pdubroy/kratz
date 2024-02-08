import { test, expect } from "bun:test";

import { Stage } from "../src/kratz.ts";
import { domTestHelpers, dispatchKeyboardEvent } from "./dom.ts";

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

  dispatchKeyboardEvent(document, "keypress", "Space");
  for (let i = 0; i < 10; i++) {
    stage.tick();
  }
  expect(elapsedTicks).toBe(10);
  expect(cat.x).toBe(19);
  expect(cat.y).toBe(0);
});
