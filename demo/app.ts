import * as kratz from "../index.ts";

const { stage } = kratz;

const cat = await stage.addSprite("cat.png");

const start = stage._tickCount;
cat.whenKeyPressed("space", function* () {
  this.move(10);
  yield* this.repeat(10, function* () {
    this.move(1);
  });
});

document.body.appendChild(stage.view);
stage.startRendering();
