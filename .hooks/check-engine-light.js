const { execSync } = require('child_process')

const npmVersion = execSync('npm -v').toString().trim()
const npmCorrect = npmVersion.startsWith('6.8.')
const nodeVersion = process.version
const nodeCorrect = nodeVersion.startsWith('v11.')

if (!npmCorrect || !nodeCorrect) {
  console.error('\x1b[1m' /* bold */ + '╔'.padEnd(70, '═') + '╗')
  if (!npmCorrect) {
    console.error(`║ Must have npm 6.9, you have ${npmVersion}. To fix:`.padEnd(70) + '║')
    console.error('║ $ npm install -g npm@6.9'.padEnd(70) + '║')
  }
  !npmCorrect && !nodeCorrect &&
  console.error('╠'.padEnd(70, '═') + '╣')
  if (!nodeCorrect) {
    console.error(`║ Must be running node 10, you have ${nodeVersion}. One way to fix:`.padEnd(70) + '║')
    console.error('║ $ brew install node@10; brew link node@10 --force --overwrite'.padEnd(70) + '║')
  }
  console.error('╚'.padEnd(70, '═') + '╝')
  console.error('\x1b[0m' /* not-bold */)

  process.exit(1)
}

