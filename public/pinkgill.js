
import { loadProfile } from '../client/store.js';

import '@shoelace-style/shoelace';


import '../client/el/404.js';
import '../client/el/nav.js';
import '../client/el/avatar.js';
// import '../client/el/create-tile-dialog.js'; // XXX needs update
// import '../client/el/install.js'; // XXX needs update
// import '../client/el/installed-palette.js'; // XXX needs update
import '../client/el/loading.js';
import '../client/el/login.js';
import '../client/el/root.js';
import '../client/el/profile.js';
import '../client/el/tile-editor.js';
import '../client/el/tile-loader.js';
// import '../client/el/tile-viewer.js'; // XXX needs update
// import '../client/el/tile.js'; // XXX needs update
// import '../client/el/timeline.js'; // XXX needs update
// import '../client/el/upload.js'; // XXX needs update
// import '../client/el/wish-dialog.js'; // XXX needs update

const ret = (document.cookie || '').split(/\s*;\s*/).find((it) => it.startsWith("return="))?.split('=')[1];
if (ret) {
  document.cookie = "return=;";
  window.location = decodeURIComponent(ret);
}

(async function () {
  await loadProfile();
})();
