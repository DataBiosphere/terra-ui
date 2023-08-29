import { injectStyle } from './injectStyle';

describe('injectStyle', () => {
  it('adds a style element to the document', () => {
    // Act
    injectStyle('body { background: red; }');

    // Assert
    const style = document.querySelector('style')!;
    expect(style.textContent).toBe('body { background: red; }');

    // Cleanup
    style.remove();
  });
});
