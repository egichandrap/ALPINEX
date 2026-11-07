export type AssertionSource = 'STATUS' | 'RESPONSE_TIME' | 'HEADER' | 'JSON_PATH' | 'BODY';
export type AssertionOperator = 'EQUALS' | 'NOT_EQUALS' | 'LESS_THAN' | 'GREATER_THAN' | 'CONTAINS' | 'EXISTS';

export interface Assertion {
  id: string;
  source: AssertionSource;
  operator: AssertionOperator;
  targetValue: string;
  propertyPath?: string;
}

export interface VariableExtraction {
  variableName: string;
  source: AssertionSource;
  propertyPath: string;
}

export interface TestCaseItem {
  id: string;
  requestId?: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: string;
  body?: string;
  position: number;
  assertions: Assertion[];
  extractions: VariableExtraction[];
}

export interface TestSuiteItem {
  id: string;
  projectId: string;
  collectionId?: string;
  collectionName?: string;
  name: string;
  description: string;
  stopOnFailure: boolean;
  cases: TestCaseItem[];
  createdAt: string;
}
