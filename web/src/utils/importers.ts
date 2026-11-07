import { parse as parseYaml } from 'yaml';
import { CollectionItem, RequestItem, HTTPMethod, HeaderItem } from '../types/collection';

/**
 * Safely parse string that could be JSON or YAML
 */
export function parseRawInput(content: string): any {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error('Input content is empty');
  }

  // Attempt JSON first
  try {
    return JSON.parse(trimmed);
  } catch {
    // Attempt YAML fallback
    try {
      return parseYaml(trimmed);
    } catch (yamlErr: any) {
      throw new Error(`Failed to parse content as JSON or YAML: ${yamlErr.message || 'Syntax error'}`);
    }
  }
}

/**
 * Recursively parse Postman Collection items (handles folders and requests)
 */
function walkPostmanItems(items: any[], currentFolder: string, requests: RequestItem[]) {
  if (!Array.isArray(items)) return;

  for (const item of items) {
    if (item.request) {
      // It's a request
      let rawUrl = '';
      if (typeof item.request === 'string') {
        rawUrl = item.request;
      } else if (typeof item.request.url === 'string') {
        rawUrl = item.request.url;
      } else if (item.request.url?.raw) {
        rawUrl = item.request.url.raw;
      } else if (item.request.url?.host) {
        const host = Array.isArray(item.request.url.host) ? item.request.url.host.join('.') : item.request.url.host;
        const path = Array.isArray(item.request.url.path) ? item.request.url.path.join('/') : (item.request.url.path || '');
        const protocol = item.request.url.protocol ? `${item.request.url.protocol}://` : 'https://';
        rawUrl = `${protocol}${host}/${path}`;
      }

      const methodStr = (item.request.method || 'GET').toUpperCase();
      const validMethods: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
      const method: HTTPMethod = validMethods.includes(methodStr as HTTPMethod) ? (methodStr as HTTPMethod) : 'GET';

      let body = '';
      if (item.request.body) {
        if (item.request.body.mode === 'raw' && item.request.body.raw) {
          body = item.request.body.raw;
        } else if (item.request.body.mode === 'urlencoded' && item.request.body.urlencoded) {
          const formObj: Record<string, string> = {};
          for (const param of item.request.body.urlencoded) {
            if (param.key) formObj[param.key] = param.value || '';
          }
          body = JSON.stringify(formObj, null, 2);
        } else if (item.request.body.mode === 'formdata' && item.request.body.formdata) {
          const formObj: Record<string, string> = {};
          for (const param of item.request.body.formdata) {
            if (param.key) formObj[param.key] = param.value || '';
          }
          body = JSON.stringify(formObj, null, 2);
        }
      }

      const headers: HeaderItem[] = Array.isArray(item.request.header)
        ? item.request.header.map((h: any) => ({
            key: h.key || '',
            value: h.value || '',
            enabled: h.disabled !== true,
          }))
        : [];

      requests.push({
        id: item.id || `req-${Math.random().toString(36).substring(2, 9)}`,
        name: item.name || rawUrl || 'Untitled Request',
        method,
        url: rawUrl,
        headers,
        body,
        bodyType: body ? 'JSON' : 'NONE',
        description: item.request.description || item.description || '',
        folder: currentFolder || undefined,
      });
    } else if (Array.isArray(item.item)) {
      // It's a folder
      const folderName = item.name ? (currentFolder ? `${currentFolder} / ${item.name}` : item.name) : currentFolder;
      walkPostmanItems(item.item, folderName, requests);
    }
  }
}

/**
 * Parse Postman Collection (v2.0 or v2.1)
 */
export function parsePostmanCollection(rawContent: string): CollectionItem {
  const data = parseRawInput(rawContent);

  const name = data.info?.name || data.name;
  if (!name) {
    throw new Error('Invalid Postman Collection: missing "info.name" field');
  }

  // Detect base_url variable if defined
  let baseUrl = '';
  if (Array.isArray(data.variable)) {
    const baseVar = data.variable.find((v: any) => v.key === 'base_url' || v.key === 'baseUrl' || v.key === 'host');
    if (baseVar?.value) {
      baseUrl = String(baseVar.value);
    }
  }

  const requests: RequestItem[] = [];
  if (Array.isArray(data.item)) {
    walkPostmanItems(data.item, '', requests);
  }

  if (requests.length === 0) {
    throw new Error('Postman collection parsed, but no HTTP requests were found inside.');
  }

  return {
    id: `col-${Math.random().toString(36).substring(2, 9)}`,
    name: String(name),
    description: data.info?.description || '',
    baseUrl,
    requests,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Parse Swagger (OpenAPI 2.0 or 3.x) JSON or YAML
 */
export function parseSwaggerOpenAPI(rawContent: string): CollectionItem {
  const data = parseRawInput(rawContent);

  // Validate that it looks like OpenAPI or Swagger
  const isOpenAPI3 = Boolean(data.openapi);
  const isSwagger2 = Boolean(data.swagger);

  if (!isOpenAPI3 && !isSwagger2 && !data.paths) {
    throw new Error('Invalid document: missing "openapi", "swagger", or "paths" property.');
  }

  const name = data.info?.title || 'Imported Swagger / OpenAPI';
  const description = data.info?.description || '';

  // Determine base URL
  let baseUrl = '';
  if (isOpenAPI3 && Array.isArray(data.servers) && data.servers.length > 0) {
    baseUrl = data.servers[0].url || '';
  } else if (isSwagger2 && data.host) {
    const scheme = (Array.isArray(data.schemes) && data.schemes[0]) || 'https';
    const basePath = data.basePath && data.basePath !== '/' ? data.basePath : '';
    baseUrl = `${scheme}://${data.host}${basePath}`;
  }

  const requests: RequestItem[] = [];
  const validMethods: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

  if (data.paths && typeof data.paths === 'object') {
    for (const [pathStr, pathItem] of Object.entries<any>(data.paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;

      for (const [methodKey, op] of Object.entries<any>(pathItem)) {
        const methodUpper = methodKey.toUpperCase() as HTTPMethod;
        if (!validMethods.includes(methodUpper)) continue;
        if (!op || typeof op !== 'object') continue;

        const summary = op.summary || op.operationId || `${methodUpper} ${pathStr}`;
        const folder = (Array.isArray(op.tags) && op.tags[0]) || '';

        // Clean URL
        let fullUrl = pathStr;
        if (baseUrl) {
          const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
          const cleanPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
          fullUrl = `${cleanBase}${cleanPath}`;
        }

        // Headers
        const headers: HeaderItem[] = [];
        if (Array.isArray(op.parameters)) {
          for (const param of op.parameters) {
            if (param.in === 'header' && param.name) {
              headers.push({
                key: param.name,
                value: param.example || (param.schema?.default !== undefined ? String(param.schema.default) : ''),
                enabled: param.required === true,
              });
            }
          }
        }

        // Request Body Sample
        let body = '';
        if (op.requestBody?.content) {
          const jsonContent = op.requestBody.content['application/json'];
          if (jsonContent?.example) {
            body = typeof jsonContent.example === 'string' ? jsonContent.example : JSON.stringify(jsonContent.example, null, 2);
          } else if (jsonContent?.schema?.example) {
            body = typeof jsonContent.schema.example === 'string' ? jsonContent.schema.example : JSON.stringify(jsonContent.schema.example, null, 2);
          } else if (jsonContent?.schema?.properties) {
            const sampleObj: Record<string, any> = {};
            for (const [propName, propDef] of Object.entries<any>(jsonContent.schema.properties)) {
              sampleObj[propName] = propDef.example || (propDef.type === 'string' ? 'string' : propDef.type === 'number' ? 0 : propDef.type === 'boolean' ? true : null);
            }
            body = JSON.stringify(sampleObj, null, 2);
          }
        } else if (isSwagger2 && Array.isArray(op.parameters)) {
          const bodyParam = op.parameters.find((p: any) => p.in === 'body');
          if (bodyParam?.schema?.example) {
            body = JSON.stringify(bodyParam.schema.example, null, 2);
          }
        }

        // Default empty JSON template for mutative methods if none specified
        if (!body && ['POST', 'PUT', 'PATCH'].includes(methodUpper)) {
          body = '{\n  \n}';
        }

        requests.push({
          id: `req-${Math.random().toString(36).substring(2, 9)}`,
          name: summary,
          method: methodUpper,
          url: fullUrl,
          headers,
          body,
          bodyType: body ? 'JSON' : 'NONE',
          description: op.description || '',
          folder: folder || undefined,
        });
      }
    }
  }

  if (requests.length === 0) {
    throw new Error('OpenAPI / Swagger parsed, but no valid path endpoints were found.');
  }

  return {
    id: `col-${Math.random().toString(36).substring(2, 9)}`,
    name: String(name),
    description: String(description),
    baseUrl,
    requests,
    createdAt: new Date().toISOString(),
  };
}
