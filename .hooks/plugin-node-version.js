module.exports = {
  name: 'plugin-node-version',
  factory: () => ({
    hooks: {
      validateProject() {
        const nodeVersion = process.version

        if (!nodeVersion.startsWith('v14.')) {
          console.error('\x1b[1m' /* bold */ + '╔'.padEnd(79, '═') + '╗')
          console.error(`║ Must be running node 14, you have ${nodeVersion}. One way to fix (Mac/Homebrew):`.padEnd(79) + '║')
          console.error('║ $ brew install node@14; brew link node@14 --force --overwrite'.padEnd(79) + '║')
          console.error('╚'.padEnd(79, '═') + '╝')
          console.error('\x1b[0m' /* not-bold */)

          process.exit(1)
        }
      }
    }
  })
}
