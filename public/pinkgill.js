
import { loadIdentity } from '../client/store/identity.js';

import '@shoelace-style/shoelace';

import '../client/el/root.js';
import '../client/el/404.js';
import '../client/el/loading.js';
import '../client/el/avatar.js';
import '../client/el/upload.js';
import '../client/el/timeline.js';
import '../client/el/tile.js';
import '../client/el/login.js';
import '../client/el/create-tile-dialog.js';
import '../client/el/installed-palette.js';
import '../client/el/install.js';
import '../client/el/tile-loader.js';
import '../client/el/wish-dialog.js';

(async function () {
  await loadIdentity();
})();
