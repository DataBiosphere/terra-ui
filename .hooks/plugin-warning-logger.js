module.exports = {
  name: 'plugin-warning-logger',
  factory: () => ({
    hooks: {
      validateProject() {
        const nodeVersion = process.version

        if (!nodeVersion.startsWith('v16.')) {
          console.error('\x1b[1m' /* bold */ + '╔'.padEnd(79, '═') + '╗')
          console.error(`║ Must be running node 16, you have ${nodeVersion}. One way to fix (Mac/Homebrew):`.padEnd(79) + '║')
          console.error('║ $ brew install node@16; brew link node@16 --force --overwrite'.padEnd(79) + '║')
          console.error('╚'.padEnd(79, '═') + '╝')
          console.error('\x1b[0m' /* not-bold */)

          process.exit(1)
        }
      },
      wrapScriptExecution(executor, project, locator, scriptName) {
        if (scriptName === 'build' && !process.env.CI) {
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
