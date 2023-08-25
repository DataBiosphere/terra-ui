import { atom } from '@terra-ui-packages/core-utils';
import { createHashHistory as createHistory } from 'history';
import _ from 'lodash/fp';
import * as qs from 'qs';
import { createContext, useContext, useEffect, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { useOnMount, useStore } from 'src/libs/react-utils';
import { routeHandlersStore } from 'src/libs/state';


// TODO: add all used nav key names here and switch consumers to use the safe const values here
/**
 * union type (enum-like) of safe nav key names
 */
export type TerraNavKey = 'billing' | 'workspace-dashboard' | 'workspaces';

export type TerraNavKeyLookup = { [key in TerraNavKey]: key };

// TODO: fill out this value lookup to reflect full list of key names once available above
/**
 * allowed values for nav keys in a lookup table
 * Note: use terraNavKey type guard method below instead of this const.
 *   Typescript currently allows unsafe object['not-a-enum-key-name'] indexing
 *   lookups into this otherwise type-safe construct.
 */
export const terraNavKeyValue: TerraNavKeyLookup = {
  billing: 'billing',
  'workspace-dashboard': 'workspace-dashboard',
  workspaces: 'workspaces',
};

/**
 * type guard for nav keys to better enforce key names with snake-case
 * @param key
 */
export const terraNavKey = (key: TerraNavKey): TerraNavKey => key;

export const isTerraNavKey = (value: unknown): value is TerraNavKey => {
  const maybeKey = value as string;
  return maybeKey in terraNavKeyValue;
};

export const blockNav = atom(() => Promise.resolve());

export const history = createHistory({
  hashType: 'noslash',
  getUserConfirmation: (_, cb) =>
    blockNav
      .get()()
      .then(() => cb(true)),
});

history.block('');

/**
 * returns the parsed url route path
 */
export const getPath = (name: string, params?: Record<string, any>): string => {
  // TODO: replace any type with better type, and throw on _.find() returning undefined
  const handler: any = _.find({ name }, routeHandlersStore.get());
  console.assert(
    handler,
    `No handler found for key ${name}. Valid path keys are: ${_.map('name', routeHandlersStore.get())}`
  );
  return handler.makePath(params);
};

/**
 * alias for getPath()
 */
export const getLink = (name: string, params?: Record<string, any>) => `#${getPath(name, params).slice(1)}`; // slice off leading slash

/**
 * navigate the application to the desired nav path.
 */
export const goToPath = (name: string, params?: Record<string, any>) => {
  history.push({ pathname: getPath(name, params) });
};

export function Redirector({ pathname, search }) {
  useOnMount(() => {
    history.replace({ pathname, search });
  });

  return null;
}

const parseRoute = (handlers, { pathname, search }) => {
  const handler = _.find(({ regex }) => regex.test(pathname), handlers);
  console.assert(handler, 'No handler found for path');
  return (
    handler && {
      ...handler,
      params: _.zipObject(handler.keys, _.tail(handler.regex.exec(pathname))),
      query: qs.parse(search, { ignoreQueryPrefix: true, plainObjects: true }),
    }
  );
};

const locationContext: React.Context<any> = createContext<any>(undefined);

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(history.location);
  useOnMount(() => {
    return history.listen((v) => setLocation(v));
  });
  return h(locationContext.Provider, { value: location }, [children]);
};

export const getCurrentUrl = () => {
  return new URL(window.location.href);
};

export const getCurrentRoute = () => {
  return parseRoute(routeHandlersStore.get(), history.location);
};

export const useRoute = () => {
  const location: any = useContext(locationContext);
  const handlers = useStore(routeHandlersStore);
  return parseRoute(handlers, location);
};

export const Router = () => {
  const { component, params, query } = useRoute();
  useEffect(() => {
    (window as any).Appcues && (window as any).Appcues.page();
  }, [component]);
  return div({ style: { display: 'flex', flexDirection: 'column', flex: '1 0 auto', position: 'relative' } }, [
    h(component, { key: history.location.pathname, ...params, queryParams: query }),
  ]);
};

export const updateSearch = (params) => {
  const newSearch = qs.stringify(params, { addQueryPrefix: true, arrayFormat: 'brackets' });

  if (newSearch !== history.location.search) {
    history.replace({ search: newSearch });
  }
};

export const useQueryParameter = (key) => {
  const { query } = useRoute();

  return [
    query[key],
    (value) => {
      updateSearch({ ...query, [key]: value });
    },
  ];
};

export function PathHashInserter() {
  useOnMount(() => {
    const loc = window.location;
    const desiredPath = '/';
    if (loc.pathname !== desiredPath) {
      history.replace({ pathname: loc.pathname.substr(1), search: loc.search });
      window.history.replaceState({}, '', desiredPath);
    }
  });
  return null;
}

export interface TerraNavLinkProvider {
  getLink: (name: string, params?: Record<string, any>) => string;
  goToPath: (name: string, params?: Record<string, any>) => void;
}

export const terraNavLinkProvider: TerraNavLinkProvider = {
  getLink,
  goToPath,
};
