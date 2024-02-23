/**
 * This is a jscodeshift transformer that replaces an import statement with another import statement.
 * It's useful for updating import paths after a module has been moved or renamed.
 *
 * Usage:
 * yarn run jscodeshift --transform=./scripts/replace-import.ts --extensions=js,ts --parser=ts src --originalImportPath=... --originalImportName=... --newImportPath=... --newImportName=...
 * yarn run jscodeshift --transform=./scripts/replace-import.ts --extensions=jsx,tsx --parser=tsx src --originalImportPath=... --originalImportName=... --newImportPath=... --newImportName=...
 * yarn run lint
 *
 * Currently, the transformer has to be run twice (with different parser options) to support both .js/.ts and .jsx/.tsx files.
 * The ESLint step at the end is to sort the imports.
 */

import { API, FileInfo, Options } from 'jscodeshift';

const requiredOptions = ['originalImportPath', 'originalImportName', 'newImportPath', 'newImportName'];
const validateRequiredOptions = (options: Options): void => {
  requiredOptions.forEach((option) => {
    if (!options[option]) {
      throw new Error(`Option "${option}" is required.`);
    }
  });

  if (options.newImportName === 'default') {
    throw new Error('Default import is not supported for the new import.');
  }
};

export default function transformer(file: FileInfo, api: API, options: Options): string | undefined {
  validateRequiredOptions(options);

  const originalImportPath = options.originalImportPath as string;
  const originalImportName = options.originalImportName as string;
  const newImportPath = options.newImportPath as string;
  const newImportName = options.newImportName as string;

  const j = api.jscodeshift;
  const source = j(file.source);

  const existingImportsFromOriginalModule = source
    .find(j.ImportDeclaration)
    .filter((path) => path.node.source.value === originalImportPath);

  const existingImports =
    originalImportName === 'default'
      ? existingImportsFromOriginalModule.find(j.ImportDefaultSpecifier)
      : existingImportsFromOriginalModule
          .find(j.ImportSpecifier)
          .filter((path) => path.node.imported.name === originalImportName);

  // If no imports from the original module exist, do not modify the file.
  if (existingImports.size() === 0) {
    return;
  }

  existingImports.forEach((path) => {
    const importDeclaration = j(path.parent);
    const numImportsFromModule =
      importDeclaration.find(j.ImportSpecifier).size() + importDeclaration.find(j.ImportDefaultSpecifier).size();

    // If this was the only import from the module, remove the entire import statement.
    // Otherwise, just remove the import specifier.
    if (numImportsFromModule === 1) {
      importDeclaration.remove();
    } else {
      j(path).remove();
    }
  });

  const existingImportsFromNewModule = source
    .find(j.ImportDeclaration)
    .filter((path) => path.node.source.value === newImportPath);

  // If an import from the new path already exists, add the new import to it.
  // Otherwise, create a new import statement.
  if (existingImportsFromNewModule.size() > 0) {
    const newImport = existingImportsFromNewModule.at(0);
    newImport.get().node.specifiers.push(j.importSpecifier(j.identifier(newImportName)));
  } else {
    const newImport = j.importDeclaration(
      [j.importSpecifier(j.identifier(newImportName))],
      j.stringLiteral(newImportPath)
    );
    source.get().node.program.body.unshift(newImport);
  }

  return source.toSource();
}
