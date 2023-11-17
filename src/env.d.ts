interface ImportMetaEnv {
  // vite.config.js sets envPrefix to TERRA_UI_.
  // Thus, import.env will only contain keys that begin with TERRA_UI_.
  readonly [key: `TERRA_UI_${string}`]: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
