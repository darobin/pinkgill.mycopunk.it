
export function isObj (v) {
  return typeof v === 'object' && v !== null;
}

export function hasProp (data, prop) {
  return prop in data;
}
