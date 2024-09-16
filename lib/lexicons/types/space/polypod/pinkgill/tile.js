
import { lexicons } from '../../../../lexicons.js';
import { isObj, hasProp } from '../../../../util.js';

export function isRecord (v) {
  return (
    isObj(v) &&
    hasProp(v, '$type') &&
    (v.$type === 'space.polypod.pinkgill.tile#main' ||
      v.$type === 'space.polypod.pinkgill.tile')
  );
}

export function validateRecord (v) {
  return lexicons.validate('space.polypod.pinkgill.tile#main', v)
}

export function isResource (v) {
  return (
    isObj(v) &&
    hasProp(v, '$type') &&
    v.$type === 'space.polypod.pinkgill.tile#resource'
  );
}

export function validateResource (v) {
  return lexicons.validate('space.polypod.pinkgill.tile#resource', v);
}
