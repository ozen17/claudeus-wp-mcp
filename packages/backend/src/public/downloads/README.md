# Downloads Directory

This directory contains downloadable files for users, such as WordPress plugins.

## WordPress MCP Plugin

### Setup Instructions

1. **Place the plugin file here** with the exact name:
   ```
   wordpress-mcp-plugin.zip
   ```

2. **The plugin is automatically served** via the public endpoint:
   ```
   GET /api/v1/download/wordpress-mcp-plugin
   ```

3. **Users can download it** directly from the setup wizard (Step 1)

### File Requirements

- File name must be exactly: `wordpress-mcp-plugin.zip`
- File should contain a valid WordPress plugin
- Plugin should implement MCP (Model Context Protocol) for WordPress
- Must include JWT authentication capability

### Security Notes

- This file is **NOT committed to Git** (see .gitignore)
- Place the file manually on the server after deployment
- Endpoint is **public** (no authentication required)
- File is streamed directly without loading into memory

### Checking Plugin Availability

Get plugin info (without downloading):
```
GET /api/v1/download/wordpress-mcp-plugin/info
```

Response:
```json
{
  "available": true,
  "filename": "wordpress-mcp-plugin.zip",
  "size": 1234567,
  "sizeFormatted": "1.18 MB",
  "lastModified": "2025-11-03T10:00:00.000Z"
}
```

### Development

For local development, you can create a dummy plugin:
```bash
cd packages/backend/src/public/downloads
echo "dummy plugin content" > wordpress-mcp-plugin.zip
```

The real plugin should be placed here before deploying to production.
