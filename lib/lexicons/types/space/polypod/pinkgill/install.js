
import { lexicons } from '../../../../lexicons.js';
import { isObj, hasProp } from '../../../../util.js';

export function isRecord (v) {
  return (
    isObj(v) &&
    hasProp(v, '$type') &&
    (v.$type === 'space.polypod.pinkgill.install#main' ||
      v.$type === 'space.polypod.pinkgill.install')
  );
}

export function validateRecord (v) {
  return lexicons.validate('space.polypod.pinkgill.install#main', v);
}
