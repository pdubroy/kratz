const WIDTH = 480;
const HEIGHT = 360;

function checkNotNull<T>(x: T): NonNullable<T> {
  if (x == null) {
    throw new Error(`expected non-null: ${x}`);
  }
  return x as NonNullable<T>;
}

interface Position {
  x: number;
  y: number;
}

type WaitCond = void;

type KGenerator = Generator<WaitCond, void, void>;

// type ScriptBody = (this: Sprite) => void | KGenerator;
type ScriptBody = (this: Sprite) => KGenerator;

class Script {
  ready = false;

  private _gen?: KGenerator;

  constructor(public body: ScriptBody) {}

  run(sprite: Sprite) {
    if (!this._gen) {
      this._gen = this.body.apply(sprite);
    }
    this.continue();
  }

  // Pump the generator, i.e. run until it yields or completes.
  private continue() {
    const { done } = checkNotNull(this._gen).next();
    if (done) {
      this._gen = undefined;
      this.ready = false;
    } else {
      // A yield means that the end of a loop was reached.
      // The script is still ready, but may or may not be scheduled to run
      // again immediately.
      this.ready = true;
    }
    return;
  }
}

async function loadImage(url: string): Promise<ImageBitmap> {
  const res = await fetch(url);
  const blob = await res.blob();
  return createImageBitmap(blob);
}

class Costume {
  constructor(
    public name: string,
    public bitmap: ImageBitmap,
  ) {}
}

export class Stage {
  view: HTMLCanvasElement;
  sprites = new Map<string, Sprite>();
  ticking = false;
  needsRedraw = false;

  _nextSpriteId = 1;
  _canvasCtx: CanvasRenderingContext2D;

  _tickCount = 0;

  constructor(canvas?: HTMLCanvasElement) {
    this.view = canvas || document.createElement("canvas");
    this.view.width = WIDTH;
    this.view.height = HEIGHT;
    this.view.style.border = "1px solid #aaa";
    this._canvasCtx = checkNotNull(this.view.getContext("2d"));
  }

  async addSprite(url: string, name?: string): Promise<Sprite> {
    const sprite = new Sprite(this);
    const k = name || `sprite${this._nextSpriteId++}`;
    this.sprites.set(k, sprite);
    await sprite.addCostume(url);
    return sprite;
  }

  sprite(name: string) {
    return this.sprites.get(name);
  }

  startRendering() {
    this.ticking = true;
    const self = this;
    function doTick() {
      self.tick();
      if (self.ticking) requestAnimationFrame(doTick);
    }
    requestAnimationFrame(doTick);
  }

  tick() {
    this._tickCount += 1;
    this.needsRedraw = false;

    // Does the sprite have any scripts that are ready?
    const anyScriptReady = (sprite: Sprite) =>
      [...sprite.scripts.values()].some((s: Script) => s.ready);

    while (!this.needsRedraw) {
      for (const sprite of this.sprites.values()) {
        sprite.runScripts();
      }
      // If no scripts are ready, we're done.
      if (![...this.sprites.values()].some(anyScriptReady)) break;
    }

    this._draw(this._canvasCtx);
  }

  _draw(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.save();
    ctx.translate(WIDTH / 2, HEIGHT / 2);
    for (const sprite of this.sprites.values()) {
      ctx.save();
      ctx.translate(-WIDTH / 2, -HEIGHT / 2);
      sprite.draw(ctx);
      ctx.restore();
    }
    ctx.restore();
  }
}

export class Sprite {
  costumes: Costume[] = [];
  scripts = new Set<Script>();

  private _pos = { x: 0, y: 0 };
  private _direction = 90;

  get x() {
    return this._pos.x;
  }

  get y() {
    return this._pos.y;
  }

  get direction() {
    return this._direction;
  }

  private nextCostumeId = 1;
  private canvas: HTMLCanvasElement;
  private canvasCtx: CanvasRenderingContext2D;

  constructor(public stage: Stage) {
    // An offscreen canvas used when loading sprites, et
    this.canvas = document.createElement("canvas");
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
    this.canvasCtx = checkNotNull(this.canvas.getContext("2d"));
  }

  runScripts() {
    for (const script of this.scripts) {
      if (script.ready) script.run(this);
    }
  }

  async _resizeBitmap(
    bitmap: ImageBitmap,
    width: number,
    height: number,
  ): Promise<ImageBitmap> {
    const x = (width - bitmap.width) / 2;
    const y = (height - bitmap.height) / 2;
    this.canvasCtx.drawImage(bitmap, x, y, width, height);
    return createImageBitmap(this.canvas);
  }

  async addCostume(url: string): Promise<Costume> {
    const name = `costume${this.nextCostumeId++}`;
    const origBitmap = await loadImage(url);
    const costume = new Costume(
      name,
      await this._resizeBitmap(origBitmap, WIDTH, HEIGHT),
    );
    this.costumes.push(costume);
    return costume;
  }

  costume(name: string) {
    return this.costumes.find((c) => c.name === name);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.drawImage(this.costumes[0].bitmap, this.x, this.y);
  }

  // Movement

  move(steps: number) {
    this.changeXBy(steps);
  }

  turnClockwise(degrees: number) {}

  turnCounterClockwise(degrees: number) {}

  goTo(location: Position) {}

  glideTo(secs: number, position: Position) {}

  glideToXY(secs: number, x: number, y: number) {}

  pointInDirection(degrees: number) {
    this._direction = degrees;
    this.stage.needsRedraw = true;
  }

  setX(val: number) {
    this._pos.x = val;
    this.stage.needsRedraw = true;
  }

  setY(val: number) {
    this._pos.y = val;
    this.stage.needsRedraw = true;
  }

  changeXBy(val: number) {
    this.setX(this.x + val);
  }

  changeYBy(val: number) {
    this.setY(this.y + val);
  }

  // Events

  whenKeyPressed(key: string, callback: ScriptBody) {
    const script = new Script(callback);
    this.scripts.add(script);

    window.addEventListener("keypress", (e: KeyboardEvent) => {
      if (e.code.toLowerCase() === key) {
        script.ready = true;
      }
    });
  }

  // Control

  *repeat(times: number, callback: ScriptBody) {
    for (let i = 0; i < times; i++) {
      console.log("i", i);
      yield* callback.apply(this);
      yield; // Yield again upon callback completion.
    }
  }
}

export const stage = new Stage();
