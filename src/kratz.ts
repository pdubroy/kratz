import { checkNotNull } from "./assert";

const WIDTH = 480;
const HEIGHT = 360;

interface DOMHelpers {
  createImageBitmap(source: HTMLCanvasElement): Promise<ImageBitmap>;
  getCanvasContext(canvas: HTMLCanvasElement): RenderingContext;
  loadImage(url: string): Promise<ImageBitmap>;
}

// Captures the subset of the CanvasRenderingContext2D interface that we use.
// This allows us to fake easily fake a subset of the methods in test.
type RenderingContext = Pick<
  CanvasRenderingContext2D,
  "drawImage" | "clearRect" | "save" | "translate" | "restore"
>;

export type {
  DOMHelpers as DOMHelpersForTesting,
  RenderingContext as RenderingContextForTesting,
};

interface Position {
  x: number;
  y: number;
}

type YieldReason = "wait" | "endofloop";
type KGenerator = Generator<YieldReason, void, void>;

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
    return this.continue();
  }

  // Pump the generator, i.e. run until it yields or completes.
  private continue() {
    this.ready = false;
    const { done, value: yieldReason } = checkNotNull(this._gen).next();
    if (done) {
      this._gen = undefined;
    }
    return yieldReason;
  }
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
  _canvasCtx: RenderingContext;

  _tickCount = 0;
  _dom: DOMHelpers;

  constructor(canvas?: HTMLCanvasElement, _domHelpersForTesting?: DOMHelpers) {
    this.view = canvas ?? document.createElement("canvas");
    this.view.width = WIDTH;
    this.view.height = HEIGHT;
    this.view.style.border = "1px solid #aaa";
    this._dom = _domHelpersForTesting ?? {
      createImageBitmap(source: ImageBitmapSource) {
        return createImageBitmap(source);
      },
      getCanvasContext(canvas: HTMLCanvasElement) {
        return checkNotNull(canvas.getContext("2d"));
      },
      async loadImage(url: string) {
        const res = await fetch(url);
        const blob = await res.blob();
        return createImageBitmap(blob);
      },
    };
    this._canvasCtx = this._dom.getCanvasContext(this.view);
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

    const waiting: Script[] = [];

    while (!this.needsRedraw) {
      for (const sprite of this.sprites.values()) {
        sprite.runScripts().forEach((yieldReason, script) => {
          if (yieldReason === "endofloop") {
            script.ready = true;
          } else if (yieldReason === "wait") {
            waiting.push(script);
          }
        });
      }
      // If no scripts are ready, we're done.
      if (![...this.sprites.values()].some(anyScriptReady)) break;
    }
    // Scripts that yield "wait" are always ready the next frame.
    waiting.forEach((script) => {
      script.ready = true;
    });

    this._draw(this._canvasCtx);
  }

  _draw(ctx: RenderingContext) {
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
  private canvasCtx: RenderingContext;

  constructor(public stage: Stage) {
    // An offscreen canvas used when loading sprites, et
    this.canvas = document.createElement("canvas");
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
    this.canvasCtx = stage._dom.getCanvasContext(this.canvas);
  }

  runScripts() {
    const yieldReasons = new Map<Script, YieldReason | void>();
    for (const script of this.scripts) {
      if (script.ready) {
        const reason = script.run(this);
        yieldReasons.set(script, reason);
      }
    }
    return yieldReasons;
  }

  async _resizeBitmap(
    bitmap: ImageBitmap,
    width: number,
    height: number,
  ): Promise<ImageBitmap> {
    const x = (width - bitmap.width) / 2;
    const y = (height - bitmap.height) / 2;
    this.canvasCtx.drawImage(bitmap, x, y, width, height);
    return this.stage._dom.createImageBitmap(this.canvas);
  }

  async addCostume(url: string): Promise<Costume> {
    const name = `costume${this.nextCostumeId++}`;
    const origBitmap = await this.stage._dom.loadImage(url);
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

  draw(ctx: RenderingContext) {
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
        e.preventDefault();
      }
    });
  }

  // Control

  *wait(secs: number): KGenerator {
    // Note: the wait duration is always rounded up to the next tick.
    const start = performance.now();
    while (performance.now() - start < secs * 1000) {
      yield "wait";
    }
  }

  *repeat(times: number, callback: ScriptBody): KGenerator {
    for (let i = 0; i < times; i++) {
      yield* callback.apply(this);
      yield "endofloop";
    }
  }
}
