/**
 * Because packages are published as modules, relative imports must include file extensions in the path.
 * Because the packages built with TypeScript's tsc, that means that imports in the source files must
 * include the .js file extensions of the compiled output files. For a full description of the issue,
 * see https://www.typescriptlang.org/docs/handbook/esm-node.html.
 *
 * Since the source files actually have .ts extensions intead of .js, by default Jest can't handle imports
 * that include .js file extensions in test files. This resolver allows .js extensions in those imports
 * by replacing .js with .ts if the original request cannot be resolved. This allows using a consistent
 * style of imports in test files and source files.
 */

module.exports = (request, options) => {
  const { basedir, defaultResolver, rootDir } = options;

  // Is the request for a JS file within the package where Jest is being run?
  const isRequestForLocalJSFile = request.startsWith('.') && basedir.startsWith(rootDir) && request.endsWith('.js');

  try {
    return defaultResolver(request, options);
  } catch (err) {
    if (isRequestForLocalJSFile && err.code === 'MODULE_NOT_FOUND') {
      return defaultResolver(request.replace(/\.js$/, '.ts'), options);
    }
    throw err;
  }
};
