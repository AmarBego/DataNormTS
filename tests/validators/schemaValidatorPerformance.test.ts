import { validateSchema } from '../../src/validators/schemaValidator';
import { Schema, SchemaEntity } from '../../src/types';

describe('Schema Validator Performance', () => {
    it('should validate a large schema within a reasonable time', () => {
        const generateLargeSchema = (depth: number, breadth: number): SchemaEntity => {
            if (depth === 0) {
                return { type: 'string' } as SchemaEntity;
            }
            const properties: Record<string, SchemaEntity> = {};
            for (let i = 0; i < breadth; i++) {
                properties[`prop${i}`] = generateLargeSchema(depth - 1, breadth);
            }
            return {
                type: 'object',
                name: `object_${depth}`,
                properties
            } as SchemaEntity;
        };
    
        const largeSchema: Schema = {
            root: generateLargeSchema(5, 5) as SchemaEntity
        };
    
        const startTime = Date.now();
        validateSchema(largeSchema);
        const endTime = Date.now();
        const executionTime = endTime - startTime;
    
        expect(executionTime).toBeLessThan(1000);
    });
    
    it('should throw for schema exceeding maximum depth', () => {
        const generateDeepSchema = (depth: number): SchemaEntity => {
            if (depth === 0) {
                return { type: 'string' } as SchemaEntity;
            }
            return {
                type: 'object',
                name: `object_${depth}`, 
                properties: {
                    nested: generateDeepSchema(depth - 1)
                }
            } as SchemaEntity;
        };
    
        const deepSchema: Schema = {
            root: generateDeepSchema(101) as SchemaEntity
        };
    
        expect(() => validateSchema(deepSchema)).toThrow('Schema too deeply nested');
    });
});