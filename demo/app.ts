import * as kratz from "../src/index.ts";

const { Stage } = kratz;

const stage = new Stage();
const cat = await stage.addSprite("cat.png");

cat.whenKeyPressed("space", function* () {
  this.move(10);
  yield* this.repeat(10, function* () {
    this.move(1);
  });
});

document.body.appendChild(stage.view);
stage.startRendering();
