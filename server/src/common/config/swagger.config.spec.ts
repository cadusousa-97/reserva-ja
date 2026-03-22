import { buildSwaggerConfig } from './swagger.config';

describe('buildSwaggerConfig', () => {
  it('should build a document with bearer auth and metadata', () => {
    const config = buildSwaggerConfig();
    const document = config as Record<string, unknown>;

    expect(document.info).toMatchObject({
      title: 'Reserva Ja API',
      version: '1.0.0',
    });

    const components = document.components as Record<string, unknown>;
    const securitySchemes = components.securitySchemes as Record<
      string,
      Record<string, unknown>
    >;

    expect(securitySchemes.bearer).toMatchObject({
      scheme: 'bearer',
      type: 'http',
    });
  });
});
