// This test is owned by the Interactive Analysis (IA) Team.
const { withUserToken } = require('../utils/terra-sa-utils')
const _ = require('lodash/fp')
const { withRegisteredUser, withBilling, withWorkspace, performAnalysisTabSetup } = require('../utils/integration-helpers')
const {
  click, clickable, getAnimatedDrawer, findElement, noSpinnersAfter, radioButton, delay, gotoPage
} = require('../utils/integration-utils')
const { registerTest } = require('../utils/jest-utils')

const analysesTabPage = (testPage, token, testUrl, workspaceName) => {
  return {
    visit: async () => {
      await performAnalysisTabSetup(page, token, testUrl, workspaceName)
    },
    createRuntime: async () => {
      await click(page, clickable({ textContains: 'Environment Configuration' }))
      await findElement(page, getAnimatedDrawer('Cloud Environment Details'))
      await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Settings' })), debugMessage: 'mno' })
      await findElement(page, getAnimatedDrawer('Jupyter Cloud Environment'), { timeout: 40000 })
      await noSpinnersAfter(page, { action: () => click(page, clickable({ text: 'Create' })), debugMessage: 'pqr' })

      await findElement(page, clickable({ textContains: 'Terminal', isEnabled: false }))
      await findElement(page, clickable({ textContains: 'Jupyter Environment ( Running )' }), { timeout: 10 * 60 * 1000 })
    }
  }
}

const setGcpAjaxMockValues = async (testPage, namespace, name) => {
  return await testPage.evaluate((namespace, name) => {
    const getRuntimeListUrl = new RegExp(`api/google/v2/runtimes?saturnAutoCreated(.*)`, 'g')
    const createRuntimeUrl = new RegExp(`https://leonardo.dsde-dev.broadinstitute.org/api/google/v1/runtimes/(.*)`, 'g')
    window.ajaxOverridesStore.set([
      {
        filter: { url: getRuntimeListUrl },
        fn: () => () => {
          console.log("WOPOO")
          Promise.resolve(
            new Response(JSON.stringify({ runtimes: [{ runtimeConfig: { persistentDiskId: 444333 } }] }), { status: 200 })
          )
        }
      },
      {
        filter: { url: createRuntimeUrl }, // Bucket location response
        fn: () => params => {
          console.log("----")
          Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))
        }
      }
    ])
  }, namespace, name)
}

const testDiskReatachmentMocksFn = _.flow(
  withWorkspace,
  withBilling,
  withRegisteredUser,
  withUserToken
)(async ({ page, token, testUrl, workspaceName, billingProject, email }) => {
  // Navigate to appropriate part of UI (the analysis tab)
  await gotoPage(page, testUrl)
  await setGcpAjaxMockValues(page, billingProject, workspaceName)
  const analyses = analysesTabPage(page, token, testUrl, workspaceName)
  await analyses.visit()
  await analyses.createRuntime()

  const runtimes = await page.evaluate(async (billingProject, email) => {
    return await window.Ajax().Runtimes.list({ googleProject: billingProject, creator: email })
  }, billingProject, email)

  console.log("====")
  console.log(runtimes)
  const persistentDiskId = runtimes[0]['runtimeConfig']['persistentDiskId']
  expect(444333).toEqual(persistentDiskId)

  // Create a runtime

  // // Ensure UI displays the runtime is creating and the terminal icon is present + disabled
  // await findElement(page, clickable({ textContains: 'Terminal', isEnabled: false }))
  // await findElement(page, clickable({ textContains: 'Jupyter Environment ( Running )' }), { timeout: 10 * 60 * 1000 })

  // const secondRuntimes = await page.evaluate(async (billingProject, email) => {
  //   return await window.Ajax().Runtimes.list({ googleProject: billingProject, creator: email })
  // })

  // const secondPersistentDiskId = secondRuntimes[0]['runtimeConfig']['persistentDiskId']
  // // const secondRuntimeID = secondRuntimes[0]['id']
  // expect(444333).toEqual(secondPersistentDiskId)
  // // expect(runtimeID).not.toEqual(secondRuntimeID)
})

registerTest({
  name: 'disk-reattachment-mocks',
  fn: testDiskReatachmentMocksFn,
  timeout: 15 * 60 * 1000
})
