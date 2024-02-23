module.exports = {
  name: 'plugin-warning-logger',
  factory: () => ({
    hooks: {
      validateProject() {
        const expectedNodeVersion = '20.11';
        const actualNodeVersion = process.version;

        if (!actualNodeVersion.startsWith(`v${expectedNodeVersion}.`)) {
          console.warn('\x1b[1m' /* bold */ + '╔'.padEnd(79, '═') + '╗');
          console.warn(`║ You are using Node ${actualNodeVersion}.`.padEnd(79) + '║');
          console.warn(`║ For consistency with CI environments, Node v${expectedNodeVersion} is recommended.`.padEnd(79) + '║');
          console.warn('║ See https://nodejs.org/en/download/ for installation options'.padEnd(79) + '║');
          console.warn('╚'.padEnd(79, '═') + '╝');
          console.warn('\x1b[0m' /* not-bold */);
        }
      },
      wrapScriptExecution(executor, project, locator, scriptName) {
        let isAppWorkspace = false
        try {
          const workspace = project.getWorkspaceByLocator(locator);
          isAppWorkspace = workspace.relativeCwd === '.';
        } catch (err) {}
        if (isAppWorkspace && scriptName === 'build' && !process.env.CI) {
          return async () => {
            const status = await executor()
            console.warn('\x1b[1m' /* bold */ + '╔'.padEnd(79, '═') + '╗')
            console.warn('║ Be sure to copy a config/xxx.json to build/config.json if you\'re planning to'.padEnd(79) + '║')
            console.warn('║ deploy this build.'.padEnd(79) + '║')
            console.warn('╚'.padEnd(79, '═') + '╝')
            console.warn('\x1b[0m' /* not-bold */)
            return status
          }
        } else {
          return executor
        }
      }
    }
  })
}
