
import { HOST } from "./config.js";

const rasl = `https://${HOST}/.well-known/rasl/`;

// XXX this needs a better definition
export const csp = [
  `default-src 'self' ${rasl}`,
  `style-src 'self' 'unsafe-inline' ${rasl}`,
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${rasl}`,
  `img-src 'self' blob: data: ${rasl}`,
  `media-src 'self' blob: data: ${rasl}`,
].join('; ');
