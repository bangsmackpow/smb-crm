'use strict';
describe('Example Test Suite', () => {
  it('should demonstrate basic jest testing', () => {
    const result = 1 + 1;
    expect(result).toBe(2);
  });
  it('should handle async operations', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });
  describe('Nested test suite', () => {
    it('can organize related tests', () => {
      const isValid = true;
      expect(isValid).toBeTruthy();
    });
  });
  afterEach(() => {});
});
//# sourceMappingURL=example.test.js.map
