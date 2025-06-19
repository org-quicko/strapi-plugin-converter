import type { Core } from '@strapi/strapi';
import _ from 'lodash';
import transform from './middlewares/transform';
import settingsService from './services/settings-service';

function addTransformMiddleware(route: Core.Route): void {
  // Ensure path exists
  if (!_.has(route, ['config', 'middlewares'])) {
    _.set(route, ['config', 'middlewares'], []);
  }

  // Register route middleware
  route.config.middlewares.push((ctx, next) => transform(strapi, ctx, next));
}

function isAllowableAPI({ mode, uid, filterValues, }: { mode: string; uid: string; filterValues: Record<string, boolean | Record<string, boolean>>; }): boolean {
  const filterUID = _.get(filterValues, [uid], false);
  if (mode === 'allow' && !filterUID && _.isBoolean(filterUID)) {
    return false;
  } else if (mode === 'deny' && filterUID && _.isBoolean(filterUID)) {
    return false;
  }

  return true;
}

function isAllowableMethod({ mode, uid, method, filterValues, }: {
  mode: string; uid: string; method?: string; filterValues: Record<string, boolean | Record<string, boolean>>;
}): boolean {
  const filterMethod = _.get(filterValues, [uid, method], null);
  if (mode === 'allow' && !filterMethod && _.isBoolean(filterMethod)) {
    return false;
  } else if (mode === 'deny' && filterMethod && _.isBoolean(filterMethod)) {
    return false;
  }

  return true;
}

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const settings = settingsService({ strapi }).get();
  let ctFilterMode = _.get(settings, ['contentTypeFilter', 'mode'], 'none');
  let pluginFilterMode = _.get(settings, ['plugins', 'mode'], 'allow');
  const ctFilterUIDs = _.get(settings, ['contentTypeFilter', 'uids'], {});
  const pluginFilterIDs = _.get(settings, ['plugins', 'ids'], {});
  const apiTypes: string[] = ['apis'];

  // Default UID list to all APIs
  if (_.size(ctFilterUIDs) === 0) {
    ctFilterMode = 'none';
  }

  // Default plugins list to none
  if (_.size(pluginFilterIDs) !== 0) {
    apiTypes.push('plugins');
  }

  _.forEach(apiTypes, (apiType) => {
    const mode = apiType === 'apis' ? ctFilterMode : pluginFilterMode;
    const filterValues = apiType === 'apis' ? ctFilterUIDs : pluginFilterIDs;
    _.forEach(strapi[apiType], (api: Core.API, apiName: string) => {
      const uid = _.get(api, ['contentTypes', apiName, 'uid'], apiName);
      if (!isAllowableAPI({ uid, mode, filterValues })) {
        return;
      }

      _.forEach(api.routes, (router: Core.Router) => {
        // Skip admin routes
        if (router.type && router.type === 'admin') {
          return;
        }

        if (router.routes) {
          // Process routes
          _.forEach(router.routes, (route: Core.Route) => {
            if (!isAllowableMethod({ uid, mode, filterValues, method: route.method })) {
              return;
            }

            addTransformMiddleware(route);
          });
          return;
        }
      });
    });
  });
};
