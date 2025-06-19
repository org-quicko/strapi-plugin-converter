'use strict';

import { Context } from 'koa';
import _ from 'lodash';
import { transformRequest } from './request';
import { StrapiResponseTransformer } from './response';

export interface Settings {
    requestTransforms?: Record<string, any>;
    responseTransforms?: Record<string, any>;
}

export default () => ({
    async response(settings: Settings, ctx: Context): Promise<void> {
        await new StrapiResponseTransformer().transform(settings.responseTransforms, ctx);
    },
    request(settings: Settings, ctx: Context): void {
        transformRequest(settings.requestTransforms, ctx); // There are no default request transforms
    },
});
