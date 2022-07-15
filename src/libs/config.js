import _ from 'lodash/fp'
import { strong } from 'react-hyperscript-helpers'
import { loadedConfigStore } from 'src/configStore'
import { configOverridesStore } from 'src/libs/state'


export const getConfig = () => {
  console.assert(loadedConfigStore.current, 'Called getConfig before initialization')
  return _.merge(loadedConfigStore.current, configOverridesStore.get())
}

/**
 * Features hidden behind flags
 */
export const isAnalysisTabVisible = () => getConfig().isAnalysisTabVisible
export const isCromwellAppVisible = () => getConfig().isCromwellAppVisible
export const isDataBrowserVisible = () => getConfig().isDataBrowserVisible

/**
 * Co-brands (a.k.a. white label sites) of Terra
 * https://broadworkbench.atlassian.net/wiki/spaces/WOR/pages/2369388553/Cobranding+and+White+Label+Sites
 * TODO: Deprecate Datastage (https://broadworkbench.atlassian.net/browse/SATURN-1414)
 */
const bold = child => strong([child])

export const brands = {
  anvil: {
    shortName: 'AnVIL',
    longName: 'AnVIL',
    welcomeHeader: 'Welcome to AnVIL',
    description: `The NHGRI AnVIL (Genomic Data Science Analysis, Visualization, and Informatics Lab-space) is a project powered by Terra for biomedical researchers to ${bold('access data')}, ${bold('run analysis tools')}, and ${bold('collaborate')}.`,
    enable: () => configOverridesStore.set({ isAnvil: true }),
    isEnabled: () => (window.location.hostname === 'anvil.terra.bio') || getConfig().isAnvil
  },
  baseline: {
    shortName: '',
    longName: '',
    welcomeHeader: 'Welcome to Project Baseline',
    description: `The Baseline Health Study Data Portal is a project powered by Terra for biomedical researchers to ${bold('access data')}, ${bold('run analysis tools')}, and ${bold('collaborate')}.`,
    enable: () => configOverridesStore.set({ isBaseline: true }),
    isEnabled: () => (window.location.hostname === 'baseline.terra.bio') || getConfig().isBaseline
  },
  bioDataCatalyst: {
    shortName: '',
    longName: '',
    welcomeHeader: 'Welcome to NHLBI BioData Catalyst',
    description: `NHLBI BioData Catalyst is a project powered by Terra for biomedical researchers to ${bold('access data')}, ${bold('run analysis tools')}, and ${bold('collaborate')}.`,
    enable: () => configOverridesStore.set({ isBioDataCatalyst: true }),
    isEnabled: () => (window.location.hostname === 'terra.biodatacatalyst.nhlbi.nih.gov') || getConfig().isBioDataCatalyst
  },
  datastage: {
    shortName: '',
    longName: '',
    welcomeText: 'Welcome to DataStage',
    description: ` is a project powered by Terra for biomedical researchers to ${bold('access data')}, ${bold('run analysis tools')}, and ${bold('collaborate')}.`,
    enable: () => configOverridesStore.set({ isDatastage: true }),
    isEnabled: () => (window.location.hostname === 'datastage.terra.bio') || getConfig().isDatastage
  },
  elwazi: {
    shortName: '',
    longName: '',
    welcomeText: 'Welcome to eLwazi',
    description: ` is a project powered by Terra for biomedical researchers to ${bold('access data')}, ${bold('run analysis tools')}, and ${bold('collaborate')}.`,
    enable: () => configOverridesStore.set({ isElwazi: true }),
    isEnabled: () => (window.location.hostname === 'elwazi.terra.bio') || getConfig().isElwazi
  },
  firecloud: {
    shortName: '',
    longName: '',
    welcomeText: 'Welcome to FireCloud',
    description: `FireCloud is a NCI Cloud Resource project powered by Terra for biomedical researchers to ${bold('access data')}, ${bold('run analysis tools')}, and ${bold('collaborate')}.`,
    enable: () => configOverridesStore.set({ isFirecloud: true }),
    isEnabled: () => (window.location.hostname === 'firecloud.terra.bio') || getConfig().isFirecloud
  },
  projectSingular: {
    shortName: '',
    longName: '',
    welcomeText: 'Welcome to Project Singular',
    description: `Project Singular is a project funded by Additional Ventures and powered by Terra for biomedical researchers to ${bold('access data')}, ${bold('run analysis tools')}, and ${bold('collaborate')} to advance research around single ventricle heart disease.`,
    enable: () => configOverridesStore.set({ isProjectSingular: true }),
    isEnabled: () => (window.location.hostname === 'projectsingular.terra.bio') || getConfig().isProjectSingular
  },
  rareX: {
    shortName: '',
    longName: '',
    welcomeText: 'Welcome to the RARE‑X Data Analysis Platform',
    description: `The RARE‑X Data Analysis Platform is a federated data repository of rare disease patient health data, including patient reported outcomes, clinical and molecular information. The platform is powered by Terra for biomedical researchers to ${bold('access data')}, ${bold('run analysis tools')}, and ${bold('collaborate')}.`,
    enable: () => configOverridesStore.set({ isRareX: true }),
    isEnabled: () => (window.location.hostname === 'rare-x.terra.bio') || getConfig().isRareX
  },
  terra: {
    shortName: '',
    longName: '',
    welcomeText: 'Welcome to Terra Community Workbench',
    description: `Terra is a cloud-native platform for biomedical researchers to ${bold('access data')}, ${bold('run analysis tools')}, and ${bold('collaborate')}.`,
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
export const isTerra = () => brands.terra.isEnabled() ||
  (!isFirecloud() && !isDatastage() && !isAnvil() && !isBioDataCatalyst() && !isBaseline() && !isElwazi() &&
    !isProjectSingular() && !isRareX())

// const getEnabledBrand = () => Utils.cond(
//   [isAnvil(), () => brands.anvil],
//   [isBaseline(), () => brands.baseline],
//   [isBioDataCatalyst(), () => brands.bioDataCatalyst],
//   [isDatastage(), () => brands.datastage],
//   [isElwazi(), () => brands.elwazi],
//   [isFirecloud(), () => brands.firecloud],
//   [isProjectSingular(), () => brands.projectSingular],
//   [isRareX(), () => brands.rareX],
//   [isTerra(), () => brands.terra],
//   () => brands.terra
// )
