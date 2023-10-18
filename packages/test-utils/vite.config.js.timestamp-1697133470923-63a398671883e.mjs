// vite.config.js
import { viteConfig as defineBaseConfig } from "file:///Users/roberts/Documents/source_new/terra-ui/.yarn/__virtual__/@terra-ui-packages-build-utils-virtual-2f1a754380/1/packages/build-utils/src/index.mjs";
import { defineConfig } from "file:///Users/roberts/Documents/source_new/terra-ui/.yarn/__virtual__/vite-virtual-cea4e1ccaa/0/cache/vite-npm-4.4.7-cdb8738fa5-787c4d891d.zip/node_modules/vite/dist/node/index.js";
var vite_config_default = defineConfig((args) => {
  const baseConfig = defineBaseConfig(args);
  return {
    ...baseConfig,
    build: {
      ...baseConfig.build,
      lib: {
        ...baseConfig.build.lib,
        entry: [
          "src/index.ts",
          // Since jest.config references setupTests but does not import it,
          // setupTests has to be added as a separate entry point in order
          // for it to be bundled.
          "src/setupTests.ts"
        ]
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcm9iZXJ0cy9Eb2N1bWVudHMvc291cmNlX25ldy90ZXJyYS11aS9wYWNrYWdlcy90ZXN0LXV0aWxzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvcm9iZXJ0cy9Eb2N1bWVudHMvc291cmNlX25ldy90ZXJyYS11aS9wYWNrYWdlcy90ZXN0LXV0aWxzL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9yb2JlcnRzL0RvY3VtZW50cy9zb3VyY2VfbmV3L3RlcnJhLXVpL3BhY2thZ2VzL3Rlc3QtdXRpbHMvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyB2aXRlQ29uZmlnIGFzIGRlZmluZUJhc2VDb25maWcgfSBmcm9tICdAdGVycmEtdWktcGFja2FnZXMvYnVpbGQtdXRpbHMnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoYXJncykgPT4ge1xuICBjb25zdCBiYXNlQ29uZmlnID0gZGVmaW5lQmFzZUNvbmZpZyhhcmdzKVxuICByZXR1cm4ge1xuICAgIC4uLmJhc2VDb25maWcsXG4gICAgYnVpbGQ6IHtcbiAgICAgIC4uLmJhc2VDb25maWcuYnVpbGQsXG4gICAgICBsaWI6IHtcbiAgICAgICAgLi4uYmFzZUNvbmZpZy5idWlsZC5saWIsXG4gICAgICAgIGVudHJ5OiBbXG4gICAgICAgICAgJ3NyYy9pbmRleC50cycsXG4gICAgICAgICAgLy8gU2luY2UgamVzdC5jb25maWcgcmVmZXJlbmNlcyBzZXR1cFRlc3RzIGJ1dCBkb2VzIG5vdCBpbXBvcnQgaXQsXG4gICAgICAgICAgLy8gc2V0dXBUZXN0cyBoYXMgdG8gYmUgYWRkZWQgYXMgYSBzZXBhcmF0ZSBlbnRyeSBwb2ludCBpbiBvcmRlclxuICAgICAgICAgIC8vIGZvciBpdCB0byBiZSBidW5kbGVkLlxuICAgICAgICAgICdzcmMvc2V0dXBUZXN0cy50cycsXG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgfVxuICB9XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1gsU0FBUyxjQUFjLHdCQUF3QjtBQUNqYSxTQUFTLG9CQUFvQjtBQUU3QixJQUFPLHNCQUFRLGFBQWEsQ0FBQyxTQUFTO0FBQ3BDLFFBQU0sYUFBYSxpQkFBaUIsSUFBSTtBQUN4QyxTQUFPO0FBQUEsSUFDTCxHQUFHO0FBQUEsSUFDSCxPQUFPO0FBQUEsTUFDTCxHQUFHLFdBQVc7QUFBQSxNQUNkLEtBQUs7QUFBQSxRQUNILEdBQUcsV0FBVyxNQUFNO0FBQUEsUUFDcEIsT0FBTztBQUFBLFVBQ0w7QUFBQTtBQUFBO0FBQUE7QUFBQSxVQUlBO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
