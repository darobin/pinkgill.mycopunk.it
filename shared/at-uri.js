
export default function parseATURI (uri) {
  const [did, collection, tid] = uri.replace(/^at:\/\//, '').split('/');
  return { did, collection, tid };
}
