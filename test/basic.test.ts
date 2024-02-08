import { test, expect } from "bun:test";

import { Stage } from "../src/kratz.ts";
import { domTestHelpers, dispatchKeyboardEvent } from "./dom.ts";

async function getStageAndSprite() {
  const stage = new Stage(document.createElement("canvas"), domTestHelpers);
  const sprite = await stage.addSprite("cat.png");
  return { stage, sprite };
}

test("repeat", async () => {
  const { stage, sprite } = await getStageAndSprite();
  const firstTick = stage._tickCount;
  let elapsedTicks = 0;
  sprite.whenKeyPressed("space", function* () {
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
  expect(sprite.x).toBe(19);
  expect(sprite.y).toBe(0);
});

test("wait", async () => {
  const { stage, sprite } = await getStageAndSprite();
  let elapsedTicks = 0;
  sprite.whenKeyPressed("space", function* () {
    const initialTick = stage._tickCount;
    yield* this.wait(0.001);
    elapsedTicks = stage._tickCount - initialTick;
  });
  dispatchKeyboardEvent(document, "keypress", "Space");
  for (let i = 0; i < 10; i++) {
    stage.tick();
    await Bun.sleep(1);
  }
  expect(elapsedTicks).toBe(1);
});
