import * as kratz from "../index.ts";

const { stage } = kratz;

const cat = await stage.addSprite("cat.png");
cat.whenKeyPressed("space", (self: kratz.Sprite) => {
  self.move(10);
});

document.body.appendChild(stage.view);
stage.startRendering();
