import { Core } from '@strapi/strapi';
import { Context } from 'koa';
import _ from 'lodash';
import settingsService from '../services/settings-service';
import transformService from '../services/transform';


const transform = async (strapi: Core.Strapi, ctx: Context, next): Promise<void> => {
  const settings = settingsService({ strapi }).get();

  // Skip any requests that have the ignore header
  const transformIgnoreHeader = _.get(ctx.headers, 'org-quicko-strapi-converter-ignore', 'false');
  if (transformIgnoreHeader === 'true') {
    return next();
  }

  try {
    transformService().request(settings, ctx);

    await next();

    if (!ctx.body) return;

    await transformService().response(settings, ctx);
  } catch (error) {
    throw error;
  }
};

export default transform;