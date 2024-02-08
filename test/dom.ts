import { GlobalRegistrator } from "@happy-dom/global-registrator";

import { checkNotNull } from "../src/assert";
import type { DOMHelpersForTesting } from "../src/kratz";

// Install DOM globals (window, document, etc.) from happy-dom.
// See https://bun.sh/docs/test/dom.
GlobalRegistrator.register();

const keysByCode = new Map<string, string>([["Space", " "]]);

export const domTestHelpers: DOMHelpersForTesting = {
  async loadImage(_url: string): Promise<ImageBitmap> {
    return { height: 0, width: 0, close() {} };
  },
  getCanvasContext() {
    return {
      drawImage(
        _image: CanvasImageSource,
        _dx: number,
        _dy: number,
        _dw?: number,
        _dh?: number,
      ) {},
      clearRect: () => {},
      save: () => {},
      translate: () => {},
      restore: () => {},
      scale(_x: number, _y: number) {},
    };
  },
  async createImageBitmap(_: HTMLCanvasElement): Promise<ImageBitmap> {
    return { height: 0, width: 0, close() {} };
  },
};

export function dispatchKeyboardEvent(
  target: EventTarget,
  type: string,
  code: string,
) {
  target.dispatchEvent(
    new KeyboardEvent(type, {
      key: checkNotNull(keysByCode.get(code)),
      code,
      charCode: 32,
      keyCode: 32,
      shiftKey: false,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      bubbles: true,
      cancelable: true,
    }),
  );
}
