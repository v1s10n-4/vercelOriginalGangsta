import * as resvg from '@resvg/resvg-js';

import fs from 'fs';
import type { ServerResponse } from 'http';
import { join } from 'path';
import type { ReactElement } from 'react';

// @ts-ignore
import satori from 'satori';
import { fileURLToPath } from 'url';
import render from './og';
import type { ImageResponseNodeOptions } from './types';


const fallbackFont = fs.readFileSync(
  join(
    fileURLToPath(import.meta.url),
    '../..',
    'vendor/noto-sans-v27-latin-regular.ttf'
  )
)

const isDev = globalThis?.process?.env?.NODE_ENV === 'development'

export async function renderImageToResponse(
  res: ServerResponse,
  element: ReactElement,
  options: ImageResponseNodeOptions = {}
) {
  const fontData = await fallbackFont
  const fonts = [
    {
      name: 'sans serif',
      data: fontData,
      weight: 700,
      style: 'normal',
    },
  ]

  const result = (await render(satori, resvg, options, fonts, element)).asPng()

  res
    .writeHead(options.status || 200, options.statusText || 'OK', {
      'content-type': 'image/png',
      'cache-control': isDev
        ? 'no-cache, no-store'
        : 'public, immutable, no-transform, max-age=31536000',
      ...options.headers,
    })
    .end(result)
}
