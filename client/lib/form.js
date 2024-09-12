
import { serialize } from '@shoelace-style/shoelace/dist/utilities/form.js';

export function handleForm (ev) {
  ev.preventDefault();
  console.warn(`target`, ev.target, new FormData(ev.target));
  return serialize(ev.target);
}
