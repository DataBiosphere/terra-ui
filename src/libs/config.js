import _ from 'lodash/fp'
import { loadedConfigStore } from 'src/configStore'
import { configOverridesStore } from 'src/libs/state'


export const getConfig = () => {
  console.assert(loadedConfigStore.current, 'Called getConfig before initialization')
  return _.merge(loadedConfigStore.current, configOverridesStore.get())
}

export const isAnvil = () => (window.location.hostname === 'anvil.terra.bio') || getConfig().isAnvil
export const isAnalysisTabVisible = () => getConfig().isAnalysisTabVisible
export const isCromwellAppVisible = () => getConfig().isCromwellAppVisible
// configOverridesStore.set({ isDataBrowserVisible: true }) in browser console to enable
export const isDataBrowserVisible = () => getConfig().isDataBrowserVisible
export const isBaseline = () => (window.location.hostname === 'baseline.terra.bio') || getConfig().isBaseline
export const isBioDataCatalyst = () => (window.location.hostname.endsWith('.biodatacatalyst.nhlbi.nih.gov')) || getConfig().isBioDataCatalyst
export const isDatastage = () => (window.location.hostname === 'datastage.terra.bio') || getConfig().isDatastage
export const isElwazi = () => (window.location.hostname === 'elwazi.terra.bio') || getConfig().isElwazi
export const isFirecloud = () => (window.location.hostname === 'firecloud.terra.bio') || getConfig().isFirecloud
export const isProjectSingular = () => (window.location.hostname === 'projectsingular.terra.bio') || getConfig().isProjectSingular
export const isRareX = () => (window.location.hostname === 'rare-x.terra.bio') || getConfig().isRareX
export const isTerra = () => !isFirecloud() && !isDatastage() && !isAnvil() && !isBioDataCatalyst() && !isBaseline() && !isElwazi() &&
  !isProjectSingular() && !isRareX()
