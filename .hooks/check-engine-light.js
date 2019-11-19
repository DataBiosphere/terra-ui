const { execSync } = require('child_process')

const npmVersion = execSync('npm -v').toString().trim()
const npmCorrect = npmVersion.startsWith('6.13.')
const nodeVersion = process.version
const nodeCorrect = nodeVersion.startsWith('v12.')

if (!npmCorrect || !nodeCorrect) {
  console.error('\x1b[1m' /* bold */ + '╔'.padEnd(80, '═') + '╗')
  if (nodeCorrect) {
    console.error(`║ Must have npm 6.13, you have ${npmVersion}. To fix:`.padEnd(80) + '║')
    console.error('║ $ npm install -g npm@6.13'.padEnd(80) + '║')
  } else {
    console.error(`║ Must be running node 12, you have ${nodeVersion}. One way to fix (Mac/Homebrew):`.padEnd(80) + '║')
    console.error('║ $ brew install node@12; brew link node@12 --force --overwrite'.padEnd(80) + '║')
  }
  console.error('╚'.padEnd(80, '═') + '╝')
  console.error('\x1b[0m' /* not-bold */)

  process.exit(1)
}

