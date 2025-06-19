'use strict';

import { Context } from 'koa';
import _ from 'lodash';
interface RequestTransforms {
    wrapBodyWithDataKey?: boolean;
}


/**
 * Transforms a request based on the provided options and context.
 * 
 * @param transforms Configuration for the transformation.
 * @param transforms.wrapBodyWithDataKey Whether to wrap the request body with a `data` key.
 * @param ctx The context of the request.
 */
function transformRequest(transforms: RequestTransforms = {}, ctx: Context): void {

}


export {
    transformRequest
};

