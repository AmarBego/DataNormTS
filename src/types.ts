export type PrimitiveType = 'string' | 'number' | 'boolean';
export type SchemaType = 'object' | 'array' | PrimitiveType | 'custom';

export interface BaseSchemaEntity {
  type: SchemaType;
  name?: string;
  [key: string]: unknown;
}

export interface ObjectSchemaEntity extends BaseSchemaEntity {
  type: 'object';
  name: string;
  properties: Schema;
}

export interface ArraySchemaEntity extends BaseSchemaEntity {
  type: 'array';
  items: SchemaEntity;
}

export interface PrimitiveSchemaEntity extends BaseSchemaEntity {
  type: PrimitiveType;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
}

export interface CustomSchemaEntity extends BaseSchemaEntity {
  type: 'custom';
  name: string;
}

export type SchemaEntity = ObjectSchemaEntity | ArraySchemaEntity | PrimitiveSchemaEntity | CustomSchemaEntity;

export interface Schema {
  [key: string]: SchemaEntity;
}

export type EntityID = string | number;

export interface NormalizedData {
  entities: {
    [entityName: string]: {
      [id: EntityID]: unknown;
    };
  };
  result: EntityID | EntityID[] | unknown;
}

// Custom schema handler type
export type CustomSchemaHandler = (
  entity: unknown,
  schema: CustomSchemaEntity,
  entities: NormalizedData['entities']
) => EntityID | EntityID[];

// Registry for custom schema handlers
const customSchemaHandlers: Record<string, CustomSchemaHandler> = {};

// Function to register a custom schema handler
export function registerCustomSchemaHandler(type: string, handler: CustomSchemaHandler): void {
  customSchemaHandlers[type] = handler;
}

// Function to get a custom schema handler
export function getCustomSchemaHandler(type: string): CustomSchemaHandler | undefined {
  return customSchemaHandlers[type];
}

// Add this new function to clear handlers (useful for testing)
export function clearCustomSchemaHandlers(): void {
  Object.keys(customSchemaHandlers).forEach(key => delete customSchemaHandlers[key]);
}