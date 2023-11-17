/**
 * Add a CSS stylesheet to the document.
 *
 * @param css - The CSS.
 */
export const injectStyle = (css: string): void => {
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
};
