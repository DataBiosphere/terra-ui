module.exports = {
  name: 'plugin-warning-logger',
  factory: () => ({
    hooks: {
      validateProject() {
        const nodeVersion = process.version

        if (!nodeVersion.startsWith('v18.')) {
          console.error('\x1b[1m' /* bold */ + '╔'.padEnd(79, '═') + '╗')
          console.error(`║ Must be running node 18, you have ${nodeVersion}`.padEnd(79) + '║')
          console.error('║ See https://nodejs.org/en/download/ for installation options'.padEnd(79) + '║')
          console.error('╚'.padEnd(79, '═') + '╝')
          console.error('\x1b[0m' /* not-bold */)

          process.exit(1)
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
