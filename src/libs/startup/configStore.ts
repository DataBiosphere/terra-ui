export type AppConfigSettings = typeof import('src/../public/config.json') & {
  /**
   * injected from /public/build-info.json
   */
  gitRevision: string;

  /**
   * injected from /public/build-info.json
   */
  buildTimestamp: string | number;

  cbasUrlRoot: string;
  cromwellUrlRoot: string;
  wdsUrlRoot: string;
  brand: string;
  workspaceId?: string;
  googleClientId?: string;
  isAxeEnabled?: boolean;
  isCromwellAppVisible?: boolean;
};

type LoadedConfig = { current?: AppConfigSettings };

const nullConfig: LoadedConfig = { current: undefined };

const loadedConfig: LoadedConfig = nullConfig;

export const resetConfigStore = () => {
  loadedConfig.current = nullConfig.current;
};

export const loadedConfigStore = (): AppConfigSettings | undefined => loadedConfig.current;
export const setLoadedConfigStore = (value: AppConfigSettings) => {
  loadedConfig.current = value;
};
