
// XXX this needs a better definition
export const csp = [
  `default-src 'self'`,
  `style-src 'self' 'unsafe-inline'`,
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'`,
  `img-src 'self' blob: data:`,
  `media-src 'self' blob: data:`,
].join('; ');
