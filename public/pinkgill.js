
import { loadIdentity } from '../client/store/identity.js';

import '@shoelace-style/shoelace';

import '../client/el/root.js';
import '../client/el/404.js';
import '../client/el/loading.js';
import '../client/el/avatar.js';

(async function () {
  await loadIdentity();
})();
