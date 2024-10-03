
import { lexicons } from '../../../../lexicons.js';
import { isObj, hasProp } from '../../../../util.js';

export function isRecord (v) {
  return (
    isObj(v) &&
    hasProp(v, '$type') &&
    (v.$type === 'space.polypod.pinkgill.instance#main' ||
      v.$type === 'space.polypod.pinkgill.instance')
  );
}

export function validateRecord (v) {
  return lexicons.validate('space.polypod.pinkgill.instance#main', v);
}
