type SensitiveFieldsConfig = { [entityName: string]: Set<string> };

let sensitiveFields: SensitiveFieldsConfig = {
  users: new Set(['password', 'ssn', 'creditCard']),
};

/**
 * Sets or updates the sensitive fields for entity types.
 * @param customFields - An object containing entity names as keys and arrays of sensitive field names as values.
 */
export function setSensitiveFields(customFields: { [entityName: string]: string[] }): void {
  for (const [entityName, fields] of Object.entries(customFields)) {
    sensitiveFields[entityName] = new Set(fields);
  }
}

/**
 * Checks if a given field is considered sensitive for a specific entity type.
 * @param fieldName - The name of the field to check.
 * @param entityName - The name of the entity type.
 * @returns True if the field is sensitive, false otherwise.
 */
export function isSensitiveField(fieldName: string, entityName: string): boolean {
  return sensitiveFields[entityName]?.has(fieldName) || false;
}

/**
 * Gets the sensitive fields for a specific entity type.
 * @param entityName - The name of the entity type.
 * @returns A Set of sensitive field names, or undefined if the entity type is not found.
 */
export function getSensitiveFields(entityName: string): Set<string> | undefined {
  return sensitiveFields[entityName];
}

/**
 * Redacts sensitive fields in an object based on the entity type.
 * @param obj - The object to redact.
 * @param entityName - The name of the entity type.
 * @returns A new object with sensitive fields redacted.
 */
export function redactSensitiveFields(obj: { [key: string]: any }, entityName: string): { [key: string]: any } {
  const sensitiveSet = sensitiveFields[entityName];
  if (!sensitiveSet) return obj;

  const result: { [key: string]: any } = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = sensitiveSet.has(key) ? '[REDACTED]' : value;
  }
  return result;
}