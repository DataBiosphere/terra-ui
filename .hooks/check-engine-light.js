const usingYarn = process.env.npm_config_user_agent.includes('yarn')

if (!usingYarn) {
  console.error('\x1b[1m' /* bold */ + '╔'.padEnd(79, '═') + '╗')
  console.error(`║ You should be using Yarn. If you don't have it installed (Mac/Homebrew):`.padEnd(79) + '║')
  console.error('║ $ brew install yarn'.padEnd(79) + '║')
  console.error('╚'.padEnd(79, '═') + '╝')
  console.error('\x1b[0m' /* not-bold */)

  process.exit(1)
}
