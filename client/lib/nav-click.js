
import { goto } from "../store.js";

// This is used for links that don't play well with nanostore/router's default link
// click handling because of shadow trees.
// TODO: see about fixing that at the source, if possible.
export default function navigationalClickHandler (ev) {
  const route = ev.target?.getAttribute('data-route');
  if (!route) return;
  ev.preventDefault();
  goto(route);
}
