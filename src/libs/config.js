import _ from 'lodash/fp'
import { loadedConfigStore } from 'src/configStore'
import { configOverridesStore } from 'src/libs/state'


export const getConfig = () => {
  console.assert(loadedConfigStore.current, 'Called getConfig before initialization')
  return _.merge(loadedConfigStore.current, configOverridesStore.get())
}

/**
 * Co-brands (a.k.a. white label sites) of Terra
 * https://broadworkbench.atlassian.net/wiki/spaces/WOR/pages/2369388553/Cobranding+and+White+Label+Sites
 * TODO: Deprecate Datastage (https://broadworkbench.atlassian.net/browse/SATURN-1414)
 */
export const brands = {
  anvil: {
    welcomeText: '',
    enable: () => configOverridesStore.set({ isAnvil: true }),
    isEnabled: () => (window.location.hostname === 'anvil.terra.bio') || getConfig().isAnvil
  },
  baseline: {
    welcomeText: '',
    enable: () => configOverridesStore.set({ isBaseline: true }),
    isEnabled: () => (window.location.hostname === 'baseline.terra.bio') || getConfig().isBaseline
  },
  bioDataCatalyst: {
    welcomeText: '',
    enable: () => configOverridesStore.set({ isBioDataCatalyst: true }),
    isEnabled: () => (window.location.hostname.endsWith('.biodatacatalyst.nhlbi.nih.gov')) || getConfig().isBioDataCatalyst
  },
  datastage: {
    welcomeText: '',
    enable: () => configOverridesStore.set({ isDatastage: true }),
    isEnabled: () => (window.location.hostname === 'datastage.terra.bio') || getConfig().isDatastage
  },
  elwazi: {
    welcomeText: '',
    enable: () => configOverridesStore.set({ isElwazi: true }),
    isEnabled: () => (window.location.hostname === 'elwazi.terra.bio') || getConfig().isElwazi
  },
  firecloud: {
    welcomeText: '',
    enable: () => configOverridesStore.set({ isFirecloud: true }),
    isEnabled: () => (window.location.hostname === 'firecloud.terra.bio') || getConfig().isFirecloud
  },
  projectSingular: {
    welcomeText: '',
    enable: () => configOverridesStore.set({ isProjectSingular: true }),
    isEnabled: () => (window.location.hostname === 'projectsingular.terra.bio') || getConfig().isProjectSingular
  },
  rareX: {
    welcomeText: '',
    enable: () => configOverridesStore.set({ isRareX: true }),
    isEnabled: () => (window.location.hostname === 'rare-x.terra.bio') || getConfig().isRareX
  },
  terra: {
    welcomeText: '',
    enable: () => configOverridesStore.set({ isTerra: true }),
    isEnabled: () => (window.location.hostname === 'app.terra.bio') || getConfig().isTerra
  }
}

export const isAnvil = () => brands.anvil.isEnabled()
export const isBaseline = () => brands.baseline.isEnabled()
export const isBioDataCatalyst = () => brands.bioDataCatalyst.isEnabled()
export const isDatastage = () => brands.datastage.isEnabled()
export const isElwazi = () => brands.elwazi.isEnabled()
export const isFirecloud = () => brands.firecloud.isEnabled()
export const isProjectSingular = () => brands.projectSingular.isEnabled()
export const isRareX = () => brands.rareX.isEnabled()
export const isTerra = () => brands.terra.isEnabled() || (!isFirecloud() && !isDatastage() && !isAnvil() && !isBioDataCatalyst() && !isBaseline() && !isElwazi() &&
  !isProjectSingular() && !isRareX())

// Features that are hidden behind feature flags
export const isAnalysisTabVisible = () => getConfig().isAnalysisTabVisible
export const isCromwellAppVisible = () => getConfig().isCromwellAppVisible
export const isDataBrowserVisible = () => getConfig().isDataBrowserVisible

