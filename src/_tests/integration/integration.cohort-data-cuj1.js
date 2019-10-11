const { click, findIframe, findSVG, clickImage, findText, findClickable, fillIn, select, waitForNoSpinners } = require('./integration-utils')


jest.setTimeout(100000)

test('integration', async () => {
  await page.goto('http://localhost:3000')
  // await page.evaluate(token => window.forceSignIn(token), process.env.TERRA_TOKEN)
  await click(page, 'Browse Data')
  await click(page, '1000 Genomes Low Coverage')
  // const img = await findClickableImage(page, 'Has WGS Low Cov…')
  // console.log(img)
  await page.waitForXPath(`//iframe[contains(normalize-space(@title),"1000")]`)
  const frame = await findIframe(page, '1000')
  // console.log(frame.executionContext())
  console.log('Returned:', frame.url())
  console.log('Frames:', page.frames()[0].url())
  const svg = await findSVG(page.frames()[0], '//div[@id="root"][1]/@class')
  console.log('SVG:', svg)
  // console.log(await findSVG(page.frames()[0], '//html/body/div'))
  // console.log(await findSVG(page.frames()[1], '//html/body/div'))
  // console.log(await findSVG(page.frames()[2], '//html/body/div'))

  await findText(page, 'requires a Google Account')

  page.evaluate(() => { debugger })

  // await findClickable(page, 'New Workspace')
  // await waitForNoSpinners(page)
  // await click(page, 'New Workspace')
  // await fillIn(page, 'Workspace name', 'My workspace')
  // await select(page, 'Billing project', 'general-dev-billing-account')
  // await fillIn(page, 'Description', '# This is my workspace')
}, 60 * 1000)

