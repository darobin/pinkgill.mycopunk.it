
import { atom } from "nanostores";

// XXX set back to false
export const $uiTileOverlayOpen = atom(true);
export function openTileOverlay () { $uiTileOverlayOpen.set(true); }
export function closeTileOverlay () { $uiTileOverlayOpen.set(false); }
