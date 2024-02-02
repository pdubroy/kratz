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

interface Script {}

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
  nextSpriteId = 1;

  constructor(canvas?: HTMLCanvasElement) {
    this.view = canvas || document.createElement("canvas");
    this.view.width = WIDTH;
    this.view.height = HEIGHT;
    this.view.style.border = "1px solid #aaa";
  }

  async addSprite(url: string, name?: string): Promise<Sprite> {
    const sprite = new Sprite(this);
    const k = name || `sprite${this.nextSpriteId++}`;
    this.sprites.set(k, sprite);
    await sprite.addCostume(url);
    return sprite;
  }

  sprite(name: string) {
    return this.sprites.get(name);
  }

  startRendering() {
    const ctx = checkNotNull(this.view.getContext("2d"));
    // ctx.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);
    requestAnimationFrame(() => this.render(ctx));
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.save();
    ctx.translate(WIDTH / 2, HEIGHT / 2);
    for (const sprite of this.sprites.values()) {
      ctx.save();
      ctx.translate(-WIDTH / 2, -HEIGHT / 2);
      sprite.render(ctx);
      ctx.restore();
    }
    ctx.restore();
    requestAnimationFrame(() => this.render(ctx));
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

  render(ctx: CanvasRenderingContext2D) {
    const hw = this.costumes[0].bitmap.width / 2;
    const hh = this.costumes[0].bitmap.height / 2;
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

  whenKeyPressed(key: string, callback: (sprite: Sprite) => void) {
    // TODO: Should this actually be throttled by frame?
    window.addEventListener("keypress", (e: KeyboardEvent) => {
      if (e.code.toLowerCase() === key) {
        callback(this);
      }
    });
  }
}

export const stage = new Stage();
