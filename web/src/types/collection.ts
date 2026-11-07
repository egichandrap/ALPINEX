export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface HeaderItem {
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestItem {
  id: string;
  name: string;
  method: HTTPMethod;
  url: string;
  headers?: HeaderItem[];
  body?: string;
  bodyType?: 'NONE' | 'JSON' | 'FORM' | 'RAW';
  description?: string;
  folder?: string;
}

export interface CollectionItem {
  id: string;
  name: string;
  description?: string;
  baseUrl?: string;
  requests: RequestItem[];
  createdAt: string;
}
