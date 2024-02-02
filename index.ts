interface Position {
  x: number;
  y: number;
}

interface Script {}

class Costume {
  bitmap?: ImageBitmap;

  constructor(public url: string) {}

  async load() {
    const res = await fetch(this.url);
    const blob = await res.blob();
    this.bitmap = await createImageBitmap(blob);
    return this;
  }
}

export class Stage {
  sprites = new Map<string, Sprite>();
  nextSpriteId = 1;

  constructor() {}

  async addSprite(url: string, name?: string): Promise<Sprite> {
    const sprite = new Sprite();
    const k = name || `sprite${this.nextSpriteId++}`;
    this.sprites.set(k, sprite);
    await sprite.addCostume(url);
    return sprite;
  }

  sprite(name: string) {
    return this.sprites.get(name);
  }
}

export class Sprite {
  costumes = new Map<string, Costume>();
  scripts = new Set<Script>();

  nextCostumeId = 1;

  async addCostume(url: string, name?: string): Promise<Costume> {
    const costume = new Costume(url);
    const k = name || `costume${this.nextCostumeId++}`;
    this.costumes.set(k, costume);
    return costume.load();
  }

  costume(name: string) {
    return this.costumes.get(name);
  }

  // Movement

  move(steps: number) {}

  turnClockwise(degrees: number) {}

  turnCounterClockwise(degrees: number) {}

  goTo(location: Position) {}

  glideTo(secs: number, position: Position) {}

  glideToXY(secs: number, x: number, y: number) {}

  // Events

  whenKeyPressed(key: string, callback: (self: Sprite) => void) {}
}

export const stage = new Stage();
