import { normalize } from '../../src/normalizers/normalizer';
import { denormalize } from '../../src/denormalizers/denormalizer';
import { CustomSchemaHandler, Schema } from '../../src/types';
import { registerCustomSchemaHandler, clearCustomSchemaHandlers } from '../../src/types';
import { logger } from '../../src/logger';

describe('customDenormalizer', () => {
  beforeEach(() => {
    clearCustomSchemaHandlers();
    logger.setSilent(true);
  });

  afterEach(() => {
    logger.setSilent(false);
  });

  it('should correctly denormalize custom entities', () => {
    const schema: Schema = {
      user: {
        type: 'custom',
        name: 'user'
      }
    };

    const originalData = {
      id: '1',
      name: 'John Doe',
      age: 30
    };

    const customHandler: CustomSchemaHandler = (entity: any, schema: any, entities: any) => {
      
      if (typeof entity === 'string' || typeof entity === 'number') {
        return entities[schema.name][entity];
      } else {
        return entity.id;
      }
    };

    registerCustomSchemaHandler('user', customHandler);

    const normalizedData = normalize(originalData, schema);
    const denormalizedData = denormalize(normalizedData, schema);
    expect(denormalizedData).toEqual(originalData);
  });
});