const { withUserToken } = require('../utils/terra-sa-utils')


test('get-scarlett-flowerpicker token', withUserToken(({ token }) => console.log(token)))
