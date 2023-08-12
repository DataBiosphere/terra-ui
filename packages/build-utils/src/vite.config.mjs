/* eslint-disable import/no-extraneous-dependencies */
import typescript from '@rollup/plugin-typescript';
import process from 'process';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  return {
    build: {
      lib: {
        entry: 'src/index.ts',
        // Build ES Module as CommonJS versions.
        formats: ['es', 'cjs'],
        fileName: (format, entryName) => {
          // Since package.json contains `type: "module"`, .js files will be interpreted as ES Modules.
          // CommonJS modules must be distinguished with a .cjs extension.
          const extension = { es: 'js', cjs: 'cjs' }[format];
          // Base output directory on the the module format.
          // ES Modules are written to lib/es, CommonJS to lib/cjs.
          return `${format}/${entryName}.${extension}`;
        },
      },
      // Leave minification to consumers.
      // This makes the distributed code easier to read and stack traces easier to relate
      // back to the original source.
      minify: false,
      // Base output directory. Output paths are based on this and build.fileName.
      outDir: 'lib',
      rollupOptions: {
        // Do not bundle dependencies.
        external: /node_modules/,
        output: {
          paths: (id) => {
            // ES Modules require imports to be fully specified (including extensions).
            // Thus, we need to specify the extension for the fp.js file imported from lodash.
            // This allows us to omit it in source files as we've done in the past in Terra UI.
            if (id === 'lodash/fp') {
              return 'lodash/fp.js';
            }
            return id;
          },
          // Preserve source directory structure and file names.
          // This makes the distributed code easier to read and stack traces easier to relate
          // back to the original source.
          chunkFileNames: '[name].js',
          preserveModules: true,
          preserveModulesRoot: 'src',
        },
        // Check types and emit type declarations.
        // Because the library is built in two different formats, this results in the type declarations
        // being written twice. This isn't ideal, but it's acceptable to keep the build within Vite
        // and avoid running tsc separately. Using `@rollup/plugin-typescript` instead of `tsc` keeps
        // package.json scripts simpler, allows us to use Vite's watcher to regenerate types after changes,
        // and allows us to fail the Vite build if there are type errors (using noEmitOnError).
        //
        // emitDeclarationOnly is specified here because putting it in tsconfig.json breaks check-dts.
        // noEmitOnError causes the Vite build to fail if there are type errors. This is disabled in
        // the `dev` package.json script.
        plugins: [
          typescript({ compilerOptions: { emitDeclarationOnly: true, noEmitOnError: mode !== 'development' } }),
        ],
      },
    },
    // Without this, imports from dependencies would get written to /path/to/terra-ui/.yarn/cache/.../node_modules/...
    // This preserves the original import.
    plugins: [preserveExternalImports()],
  };
});

function preserveExternalImports() {
  // Depends on running the build from the package's directory.
  // This is a valid assumption when running the build from a package.json script with yarn or npm.
  const packageDirectory = process.cwd();
  return {
    name: 'vite-plugin-leave-external-imports-unchanged',
    enforce: 'pre',
    resolveId: (id) => {
      const isInternal = id.startsWith('.') || id.startsWith(`${packageDirectory}/`);
      return isInternal ? null : { id, external: true };
    },
  };
}
