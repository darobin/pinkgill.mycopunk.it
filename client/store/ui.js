
import { atom } from "nanostores";

export const $uiTileOverlayOpen = atom(false);
export function openTileOverlay () { $uiTileOverlayOpen.set(true); }
export function closeTileOverlay () { $uiTileOverlayOpen.set(false); }
