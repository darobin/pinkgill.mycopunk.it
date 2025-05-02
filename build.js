#!/usr/bin/env node
import { argv } from 'node:process';
import * as esbuild from 'esbuild';

const isWatch = argv[2] === '--watch';
const appOptions = {
  entryPoints: ['public/pinkgill.js'],
  bundle: true,
  outfile: 'public/pinkgill.min.js',
  format: 'esm',
  sourcemap: isWatch,
  // plugins: [wasmLoader()],
};
const loaderOptions = {
  entryPoints: ['tile-loader/tile-loader.js'],
  bundle: true,
  outfile: 'tile-loader/tile-loader.min.js',
  format: 'esm',
  sourcemap: isWatch,
  // plugins: [wasmLoader()],
};

if (isWatch) {
  const appCtx = await esbuild.context(appOptions);
  const loaderCtx = await esbuild.context(loaderOptions);
  await Promise.all([appCtx.watch(), loaderCtx.watch()]);
}
else {
  esbuild.build(appOptions);
  esbuild.build(loaderOptions);
}
