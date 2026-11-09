export interface EnvironmentVariable {
  key: string;
  value: string;
  enabled: boolean;
  isSecret?: boolean;
}

export interface EnvironmentConfig {
  id: 'dev' | 'staging' | 'prod';
  name: string;
  color: string;
  baseUrl: string;
  description: string;
  variables: EnvironmentVariable[];
}

export const DEFAULT_ENVIRONMENTS: EnvironmentConfig[] = [
  {
    id: 'dev',
    name: 'Development',
    color: '#10b981',
    baseUrl: 'http://localhost:8080',
    description: 'Local development and mock environment. Relaxed constraints.',
    variables: [
      { key: 'base_url', value: 'http://localhost:8080', enabled: true },
      { key: 'env_name', value: 'development', enabled: true },
      { key: 'api_version', value: 'v1', enabled: true },
    ],
  },
  {
    id: 'staging',
    name: 'Staging',
    color: '#f59e0b',
    baseUrl: 'https://staging-api.alpinex.internal',
    description: 'Pre-production staging cluster for QA integration and validation.',
    variables: [
      { key: 'base_url', value: 'https://staging-api.alpinex.internal', enabled: true },
      { key: 'env_name', value: 'staging', enabled: true },
      { key: 'api_version', value: 'v1', enabled: true },
    ],
  },
  {
    id: 'prod',
    name: 'Production (Locked)',
    color: '#ef4444',
    baseUrl: 'https://api.alpinex.com',
    description: 'Live production environment. Strict safety lock & confirmation prompts enabled.',
    variables: [
      { key: 'base_url', value: 'https://api.alpinex.com', enabled: true },
      { key: 'env_name', value: 'production', enabled: true },
      { key: 'api_version', value: 'v1', enabled: true },
    ],
  },
];

export function resolveEnvironmentVariables(
  text: string,
  env: EnvironmentConfig,
  collectionBaseUrl?: string
): string {
  if (!text) return text;
  let result = text;

  // First resolve {{base_url}}
  const effectiveBaseUrl = env.baseUrl || collectionBaseUrl || 'http://localhost:8080';
  result = result.replace(/\{\{base_url\}\}/g, effectiveBaseUrl.replace(/\/$/, ''));

  // Then resolve all custom variables in the environment
  env.variables.forEach((v) => {
    if (v.enabled && v.key.trim()) {
      const regex = new RegExp(`\\{\\{${v.key.trim()}\\}\\}`, 'g');
      result = result.replace(regex, v.value);
    }
  });

  return result;
}
