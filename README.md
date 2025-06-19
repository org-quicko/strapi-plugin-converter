# @org-quicko/strapi-plugin-converter

A Strapi plugin that converts API responses into a standardized response format. This plugin automatically transforms Strapi's default API response structure to create a flattened data format.

## Features

- **Automatic Response Transformation**: Converts Strapi's nested response structure to a flattened format
- **Media Field Handling**: Automatically extracts URLs from media fields for direct access
- **Pagination Support**: Handles paginated responses and can optionally fetch all data across pages
- **Selective API Filtering**: Configure which content types and methods should be transformed
- **Request ID Tracking**: Adds unique request IDs for better logging and debugging
- **Configurable Middleware**: Easy to configure and disable for specific requests

## Installation

```bash
npm install @org-quicko/strapi-plugin-converter
```

## How It Works

### Response Transformation

The plugin intercepts Strapi API responses and transforms them from this format:

```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "title": "My Article",
        "content": "Article content...",
        "cover": {
          "data": {
            "attributes": {
              "url": "/uploads/image.jpg"
            }
          }
        }
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

To this format:

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "title": "My Article",
      "content": "Article content...",
      "cover": "/uploads/image.jpg"
    }
  ],
  "transaction_id": "uuid-v4-string",
  "timestamp": 1640995200000
}
```

### Key Transformations

1. **Flattens nested attributes**: Moves all attributes to the root level of each data object
2. **Simplifies media fields**: Extracts URLs directly from media field structures
3. **Adds metadata**: Includes timestamp and transaction ID for tracking
4. **Standardizes response format**: Consistent structure across all endpoints

### Pagination Handling

The plugin can automatically fetch all pages of data when:
- A paginated response has multiple pages
- No explicit pagination parameters were provided in the request
- The response indicates more pages are available

This ensures complete data retrieval when needed while respecting explicit pagination requests.

## Usage

### Basic Usage

Once installed and configured, the plugin works automatically. All API responses will be transformed according to the configuration.

### Skipping Transformation

To skip transformation for specific requests, include the header:

```
org-quicko-strapi-converter-ignore: true
```

### Example API Call

```javascript
// Before transformation (Strapi default)
fetch('/api/articles')
  .then(response => {
    const articles = response.data.map(item => ({
      id: item.id,
      title: item.attributes.title,
      image: item.attributes.image?.data?.attributes?.url
    }));
  });

// After transformation (with plugin)
fetch('/api/articles')
  .then(response => {
    const articles = response.data.map(item => ({
      id: item.id,
      title: item.title,
      image: item.image // Direct URL access
    }));
  });
```

## Components

### Middleware

- **Transform Middleware**: Main middleware that handles request/response transformation
- **Final Middleware**: Additional processing if needed

### Services

- **Settings Service**: Manages plugin configuration
- **Transform Service**: Handles the actual data transformation logic
- **Response Transformer**: Core transformation logic for API responses

### Utilities

- **Media Field Detection**: Automatically identifies media fields in content types
- **Schema Processing**: Handles component and nested field transformations

## Development

### Building

```bash
npm run build
```

### Watching for Changes

```bash
npm run watch
```

### TypeScript Validation

```bash
npm run test:ts:back
```

## Dependencies

### Peer Dependencies

- `@strapi/strapi`: ^5.4.0
- `@strapi/sdk-plugin`: ^5.2.7
- `@org-quicko/core`: ^1.1.0

### Development Dependencies

- TypeScript support
- Prettier for code formatting
- Strapi development tools

## API Reference

### Response Format

All transformed responses follow this structure:

```typescript
interface TransformedResponse {
  code: number;           // HTTP status code
  data: any;             // Transformed data
  transaction_id: string; // Unique request identifier
  timestamp: number;     // Unix timestamp in milliseconds
}
```

### Configuration Types

```typescript
interface PluginConfig {
  contentTypeFilter?: {
    mode: 'allow' | 'deny' | 'none';
    uids: Record<string, boolean | Record<string, boolean>>;
  };
  plugins?: {
    mode: 'allow' | 'deny';
    ids: Record<string, boolean>;
  };
}
```

## Troubleshooting

### Common Issues

1. **Plugin not transforming responses**
   - Check if the content type is included in the filter configuration
   - Verify the plugin is enabled in `config/plugins.js`
   - Ensure the request doesn't have the ignore header

2. **Media URLs not working**
   - Verify media fields are properly configured in your content types
   - Check that the media field contains the expected structure

3. **Performance issues with large datasets**
   - Consider using explicit pagination instead of auto-fetching all pages
   - Review content type filters to exclude unnecessary transformations

### Logging

The plugin logs transformation activities with request IDs for debugging:

```
Converter | [uuid] GET /api/articles - 200
```

## License

ISC

## Author

Quicko <developer@quicko.org.in>

## Version

1.0.0
