import { verificarSecretoJwt } from './secreto-jwt';

describe('Secreto JWT en producción', () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
    jest.restoreAllMocks();
  });

  it('impide arrancar en producción si falta JWT_SECRET', () => {
    process.env.RENDER = 'true';
    delete process.env.JWT_SECRET;
    expect(() => verificarSecretoJwt()).toThrow('JWT_SECRET');
  });

  it('avisa si en producción se usa el valor de ejemplo del repositorio', () => {
    process.env.RENDER = 'true';
    process.env.JWT_SECRET = 'cambia-esto-por-un-secreto-largo-y-aleatorio';
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => verificarSecretoJwt()).not.toThrow();
    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('valor de ejemplo'));
  });

  it('no avisa con un secreto aleatorio largo', () => {
    process.env.RENDER = 'true';
    process.env.JWT_SECRET = 'a3f9c2e81b7d4056af12c9e8d7b6a5f4e3d2c1b0a9f8e7d6';
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
    verificarSecretoJwt();
    expect(aviso).not.toHaveBeenCalled();
  });
});
