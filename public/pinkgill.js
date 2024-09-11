
import { loadIdentity, $isLoggedIn, $loginLoading } from '../client/store/identity.js';

import '@shoelace-style/shoelace';

import '../client/el/root-routes.js';
import '../client/el/404.js';
import '../client/el/loading.js';
import '../client/el/avatar.js';

$isLoggedIn.subscribe(val => console.warn(`logged in: ${val}`));
$loginLoading.subscribe(val => console.warn(`loading: ${val}`));

(async function () {
  await loadIdentity();
})();
