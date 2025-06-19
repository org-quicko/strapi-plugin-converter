import { JSONValue } from '@org-quicko/core/types';
import { DateUtil } from '@org-quicko/core/utils';
import { Context } from 'koa';
import { getMediaFields, Schema } from './util';

// Improved type definitions
interface PaginationParams {
    pageSize?: number;
    page?: number;
    pageCount?: number;
    total?: number;
}
interface ResponseTransforms {

}




export class StrapiResponseTransformer {
    mediaFields: string[] = [];


    /**
     * Find the UID for a specific API based on its plural name
     */
    private findContentTypeUID(api: string): string {
        for (const [, contentType] of Object.entries(strapi.contentTypes)) {
            if (contentType?.info?.pluralName === api || contentType?.info?.singularName === api) {
                return contentType.uid;
            }
        }
        throw new Error(`Content type UID not found for API: ${api}`);
    }


    /**
     * Fetch paginated data recursively
     */
    private async fetchPaginatedData(
        uid: string,
        query: Record<string, any>,
        body: any,
        pageSize: number
    ): Promise<any[]> {
        const service = strapi.services[uid];
        const results: any[] = body.data || [];
        let currentPage = 2;
        let totalPages = 1;

        do {
            const paginationQuery = {
                ...query,
                pagination: {
                    page: currentPage,
                    pageSize,
                },
            };

            const response = await service.find(paginationQuery);

            if (!response?.results) break;

            results.push(...response.results);
            totalPages = response.pagination?.pageCount || 1;
            currentPage++;
        } while (currentPage <= totalPages);

        return results;
    }


    /**
 * Recursively converts data to a JSONValue format.
 * Handles arrays, objects, and nested structures specific to Strapi's API response.
 * @param data The input data to be converted.
 * @returns The normalized JSONValue.
 */
    convertTo(data: any, component = ''): JSONValue {
        if (Array.isArray(data)) {
            return data.map(item => this.convertTo(item, component));
        }

        if (data && typeof data === 'object') {
            if ('data' in data) {
                return this.convertTo(data.data, component);
            }

            const attributes = 'attributes' in data ? data.attributes : data;
            return this.convertAttributes(attributes, component);
        }

        return data;
    }


    /**
 * Converts attributes object by normalizing each property.
 * @param attributes Attributes object from Strapi data.
 * @returns Normalized object.
 */
    private convertAttributes(attributes: { [key: string]: any }, component: string): { [key: string]: JSONValue } {
        const normalizedData: { [key: string]: JSONValue } = {};

        for (const key in attributes) {
            if (this.mediaFields.includes(component ? `${component}.${key}` : key) && this.hasUrlAttribute(attributes, key)) {
                normalizedData[key] = `${attributes[key].url}`;
            } else {
                normalizedData[key] = this.convertTo(attributes[key], component ? `${component}.${key}` : key);
            }
        }
        return normalizedData;
    }




    /**
 * Checks if a specified key within the data object contains a URL attribute.
 * @param data The object containing potential media fields.
 * @param key The key to check for a URL attribute.
 * @returns True if the URL attribute exists, false otherwise.
 */
    private hasUrlAttribute(data: any, key: string): boolean {
        return Boolean(data[key]?.url);
    }

    /**
     * Main transformation method for Strapi responses
     */
    async transform(transforms: ResponseTransforms = {}, ctx: Context): Promise<void> {
        const body = ctx.body as { data: any; meta?: any };
        if (!body.data) return;

        try {
            const api = ctx.routerPath.split('/')[2];
            const uid = this.findContentTypeUID(api);

            let schema = (strapi.contentTypes[uid] as Schema.ContentType).attributes
            this.mediaFields = getMediaFields(strapi,schema)

            const pagination = ctx.query.pagination as PaginationParams;
            const pageSize = pagination?.pageSize ||
                Number.parseInt(strapi.config.get('api.rest.defaultLimit'));

            let transformedData: any;

            // Determine transformation strategy based on pagination
            const pageCount = body.meta?.pagination?.pageCount;
            const page = body.meta?.pagination?.page;

            if (pageCount && page && pageCount > page && !ctx.query.pagination) {
                const paginatedResults = await this.fetchPaginatedData(uid, ctx.query, ctx.body, pageSize);
                transformedData = this.convertTo(paginatedResults);
            } else {
                transformedData = this.convertTo(body.data);
            }

            // Construct standardized API response
            const resBody = {
                timestamp: DateUtil.nowInMillis(),
                data: transformedData,
                transaction_id: ctx.requestId,
            };

            ctx.status = 200;
            ctx.body = {
                code: 200,
                data: resBody.data,
                transaction_id: resBody.transaction_id,
                timestamp: resBody.timestamp,
            };
        } catch (error) {
            strapi.log.error(`Converter | [${ctx.requestId}] Error in response transformation: ${error.message}`);
            ctx.throw(500, error.message);
        }
    }
}
