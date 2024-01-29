const sprites = new Map<string, Sprite>();

interface Position {
  x: number;
  y: number;
}

interface Drawable {
  data: ArrayBuffer;
}

interface Script {}

class Sprite {
  private costumes = new Map<string, Drawable>();
  private scripts = new Set<Script>();

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
}

export function addSprite(name: string, filename: string) {}

export function sprite(name: string) {
  return sprites.get(name);
}
