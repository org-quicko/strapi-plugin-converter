import { Core } from "@strapi/strapi";


// Extend the ComponentType
type ComponentType = `${string}.${string}` | { schema: Schema.Attributes };

// Update Schema.Attributes
export namespace Schema {
  export interface Attributes {
    [key: string]: {
      type: string;
      component?: ComponentType; // Allow string or schema object
    };
  }

  export interface ContentType {
    attributes: Attributes;
  }
}

export function getMediaFields(
  strapi: Core.Strapi,
  attributes: Schema.Attributes,
  component = ''
): string[] {
  const mediaFields: string[] = [];
  getSchema(strapi, attributes, mediaFields, component);
  return mediaFields;
}

export function getSchema(strapi: Core.Strapi, attributes: Schema.Attributes, mediaFields: string[], component = ''): Schema.Attributes {
  const processedAttributes = { ...attributes };

  for (const key in processedAttributes) {
    if (processedAttributes[key].type === 'component') {
      const componentUid = processedAttributes[key].component as `${string}.${string}`;

      // Safely get the component content type
      const componentContentType = strapi.components[componentUid] as Schema.ContentType;

      if (componentContentType && componentContentType.attributes) {
        // Recursively resolve the component schema
        const componentSchema = getSchema(strapi, componentContentType.attributes, mediaFields, component ? `${component}.${key}` : key);

        // Attach the resolved schema to the attribute
        processedAttributes[key] = {
          ...processedAttributes[key],
          component: { schema: componentSchema }, // Now safely assign the schema object
        };
      }
    } else if (processedAttributes[key].type === 'media') {
      mediaFields.push(component ? `${component}.${key}` : key);

    }
  }

  return processedAttributes;
}
