
export function urlForTile (tile) {
  const [did, , tid] = tile.uri.replace(/^at:\/\//, '').split('/');
  return `https://${did.replace(/:/g, '.')}.${tid}.tile.${window.location.hostname}/`;
}
