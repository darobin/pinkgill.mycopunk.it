
// This is mostly taken from nanostores/router and updated to support hash routing.
// We'll switch to proper routing but for now this is simpler.

import { atom, onMount } from 'nanostores';

export function createRouter (routes, options) {
  const router = atom();
  router.routes = Object.keys(routes).map(name => {
    let value = routes[name];
    if (typeof value === 'string') {
      value = value.replace(/\/$/g, '') || '/';
      const names = (value.match(/\/:\w+/g) || []).map(i => i.slice(2));
      const pattern = value
        .replace(/[\s!#$()+,.:<=?[\\\]^{|}]/g, '\\$&')
        .replace(/\/\\:\w+\\\?/g, '/?([^/]*)')
        .replace(/\/\\:\w+/g, '/([^/]+)')
      ;
      return [
        name,
        RegExp('^' + pattern + '$', 'i'),
        (...matches) =>
          matches.reduce((params, match, index) => {
            params[names[index]] = decodeURIComponent(match);
            return params;
          }, {}),
        value
      ];
    }
    return [name, ...value];
  });

  let prev;
  const parse = path => {
    path = path.replace(/\/($|\?)/, '$1') || '/';
    if (prev === path) return false;
    prev = path;

    for (const [route, pattern, cb] of router.routes) {
      const match = path.match(pattern);
      if (match) return { params: cb(...match.slice(1)), path, route };
    }
    if (options?.notFound) return { params: { requestedPath: path }, path: options.notFound, route: '404' };
  }

  const click = event => {
    const link = event.target.closest('a');
    if (
      link &&
      !link.defaultPrevented &&
      event.button === 0 &&
      link.target !== '_blank' &&
      link.dataset.noRouter == null &&
      link.rel !== 'external' &&
      !link.download &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      // XXX we will have to figure out how to handle links inside content.
      // For now this is only for app links.
      event.preventDefault();
      const url = new URL(link.href);
      router.open(dehash(url));
    }
  }

  const set = router.set;
  const popstate = () => {
    const page = parse(dehash(location));
    if (page !== false) set(page);
  }

  if (typeof window !== 'undefined' && typeof location !== 'undefined') {
    onMount(router, () => {
      const page = parse(dehash(location));
      if (page !== false) set(page);
      document.body.addEventListener('click', click);
      window.addEventListener('popstate', popstate);
      return () => {
        prev = undefined;
        document.body.removeEventListener('click', click);
        window.removeEventListener('popstate', popstate);
      }
    });
  }
  else {
    set(parse('/'));
  }

  router.open = (path, redirect) => {
    const page = parse(path);
    if (page !== false) {
      if (typeof history !== 'undefined') {
        if (redirect) history.replaceState(null, null, `#${path}`);
        else history.pushState(null, null, `#${path}`);
      }
      set(page);
    }
  }
  return router;
}

export function getPagePath (router, name, params) {
  const route = router.routes.find(i => i[0] === name);
  const path = route[3]
    .replace(/\/:\w+\?/g, i => {
      let param = params ? params[i.slice(2).slice(0, -1)] : null
      if (param) return '/' + encodeURIComponent(param);
      return '';
    })
    .replace(/\/:\w+/g, i => '/' + encodeURIComponent(params[i.slice(2)]));
  return path || '/';
}

export function openPage (router, name, params) {
  router.open(getPagePath(router, name, params));
}

export function redirectPage (router, name, params) {
  router.open(getPagePath(router, name, params), true);
}

function dehash (obj) {
  return obj.hash.replace('#', '');
}
