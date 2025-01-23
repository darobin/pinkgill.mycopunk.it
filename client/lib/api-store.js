
export default async function apiToStore ($store, url) {
  $store.setKey('loading', true);
  const res = await fetch(url);
  const data = await res.json();
  if (res.status !== 200) {
    const { error } = data;
    $store.setKey('error', error || 'Unknown error');
    $store.setKey('data', []);
  }
  else {
    $store.setKey('error', false);
    $store.setKey('data', data.data);
  }
  $store.setKey('loading', false);
}
