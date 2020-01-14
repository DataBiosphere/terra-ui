const { execSync } = require('child_process')

const usingYarn = process.env.npm_config_yarn_path
const nodeVersion = process.version
const nodeCorrect = nodeVersion.startsWith('v12.')

if (!usingYarn || !nodeCorrect) {
  console.error('\x1b[1m' /* bold */ + '╔'.padEnd(79, '═') + '╗')
  if (nodeCorrect) {
    console.error(`║ You should be using Yarn. If you don't have it installed (Mac/Homebrew):`.padEnd(79) + '║')
    console.error('║ $ brew install yarn'.padEnd(79) + '║')
  } else {
    console.error(`║ Must be running node 12, you have ${nodeVersion}. One way to fix (Mac/Homebrew):`.padEnd(79) + '║')
    console.error('║ $ brew install node@12; brew link node@12 --force --overwrite'.padEnd(79) + '║')
  }
  console.error('╚'.padEnd(79, '═') + '╝')
  console.error('\x1b[0m' /* not-bold */)

  process.exit(1)
}

