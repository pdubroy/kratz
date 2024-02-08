import * as kratz from "../src/index.ts";

const { Stage } = kratz;

const stage = new Stage();
const cat = await stage.addSprite("cat.png");

cat.whenKeyPressed("Space", function* () {
  yield* this.repeat(5, function* () {
    this.changeYBy(20);
  });
  yield* this.wait(1);
  yield* this.repeat(5, function* () {
    this.changeYBy(-20);
  });
});

cat.whenKeyPressed("ArrowRight", function* () {
  cat.setRotationStyle("left-right");
  this.pointInDirection(90);
  this.changeXBy(10);
});

cat.whenKeyPressed("ArrowLeft", function* () {
  cat.setRotationStyle("left-right");
  this.pointInDirection(-90);
  this.changeXBy(-10);
});

document.body.appendChild(stage.view);
stage.startRendering();
