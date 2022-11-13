import * as resvg from '@resvg/resvg-wasm';
import type { ReactElement } from 'react';

// @ts-ignore
import satori, { init as initSatori } from 'satori/wasm';
import initYoga from 'yoga-wasm-web';

// @ts-ignore
import resvg_wasm from '../vendor/resvg.simd.wasm?module';
// @ts-ignore
import yoga_wasm from '../vendor/yoga.wasm?module';
import render from './og';
import type { ImageResponseOptions } from './types';


const initializedResvg = resvg.initWasm(resvg_wasm)
const initializedYoga = initYoga(yoga_wasm).then((yoga) => initSatori(yoga))
const fallbackFont = fetch(
  new URL('../vendor/noto-sans-v27-latin-regular.ttf', import.meta.url)
).then((res) => res.arrayBuffer())

const isDev = globalThis?.process?.env?.NODE_ENV === 'development'

export class ImageResponse {
  constructor(element: ReactElement, options: ImageResponseOptions = {}) {
    const result = new ReadableStream({
      async start(controller) {
        await initializedYoga
        await initializedResvg
        const fontData = await fallbackFont
        const fonts = [
          {
            name: 'sans serif',
            data: fontData,
            weight: 700,
            style: 'normal',
          },
        ]

        const result = await render(satori, resvg, options, fonts, element)

        controller.enqueue(result)
        controller.close()
      },
    })

    return new Response(result, {
      headers: {
        'content-type': 'image/png',
        'cache-control': isDev
          ? 'no-cache, no-store'
          : 'public, immutable, no-transform, max-age=31536000',
        ...options.headers,
      },
      status: options.status,
      statusText: options.statusText,
    })
  }
}
