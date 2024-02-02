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

type ScriptBody = (this: Sprite) => void | KGenerator;

class Script {
  ready = false;
  gen?: KGenerator;

  constructor(public body: ScriptBody) {}

  run(sprite: Sprite) {
    if (this.gen) {
      this.continue();
    }
    const r = this.body.apply(sprite);
    if (r && "next" in r) {
      this.gen = r;
      this.continue();
    }
    this.ready = false;
  }

  continue() {
    const { value, done } = checkNotNull(this.gen).next();
    if (done) {
      this.gen = undefined;
    }
    // TODO: Handle value, which says what it's waiting on.
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

  _nextSpriteId = 1;
  _canvasCtx: CanvasRenderingContext2D;

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
    (function doTick() {
      self.tick();
      if (self.ticking) requestAnimationFrame(doTick);
    })();
  }

  tick() {
    // ctx.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);
    for (const sprite of this.sprites.values()) {
      sprite.scripts.forEach((s) => {
        if (s.ready) {
          s.run(sprite);
        }
      });
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
  x = 0;
  y = 0;
  direction = 90;

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
    this.x += steps;
  }

  turnClockwise(degrees: number) {}

  turnCounterClockwise(degrees: number) {}

  goTo(location: Position) {}

  glideTo(secs: number, position: Position) {}

  glideToXY(secs: number, x: number, y: number) {}

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
}

export const stage = new Stage();
