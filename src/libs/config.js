import _ from 'lodash/fp'
import { loadedConfigStore } from 'src/configStore'
import { configOverridesStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


export const nonBreakingHyphen = '\u2011'

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
export const brands = {
  anvil: {
    name: 'AnVIL',
    signInName: 'AnVIL',
    welcomeHeader: 'Welcome to AnVIL',
    description: `The NHGRI AnVIL (Genomic Data Science Analysis, Visualization, and Informatics Lab-space) is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.`,
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: 'Find how-to\'s, documentation, video tutorials, and discussion forums'
      }
    ],
    enable: () => configOverridesStore.set({ isAnvil: true }),
    isEnabled: () => (window.location.hostname === 'anvil.terra.bio') || getConfig().isAnvil
  },
  baseline: {
    name: 'Project Baseline',
    signInName: 'Project Baseline',
    welcomeHeader: 'Welcome to Project Baseline',
    description: 'The Baseline Health Study Data Portal is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: 'Find how-to\'s, documentation, video tutorials, and discussion forums'
      }
    ],
    enable: () => configOverridesStore.set({ isBaseline: true }),
    isEnabled: () => (window.location.hostname === 'baseline.terra.bio') || getConfig().isBaseline
  },
  bioDataCatalyst: {
    name: 'NHLBI BioData Catalyst',
    signInName: 'NHLBI BioData Catalyst',
    welcomeHeader: 'Welcome to NHLBI BioData Catalyst',
    description: 'NHLBI BioData Catalyst is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: 'Find how-to\'s, documentation, video tutorials, and discussion forums'
      }
    ],
    enable: () => configOverridesStore.set({ isBioDataCatalyst: true }),
    isEnabled: () => (window.location.hostname === 'terra.biodatacatalyst.nhlbi.nih.gov') || getConfig().isBioDataCatalyst
  },
  datastage: {
    name: 'DataStage',
    signInName: 'DataStage',
    welcomeHeader: 'Welcome to DataStage',
    description: 'DataStage is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: 'Find how-to\'s, documentation, video tutorials, and discussion forums'
      }
    ],
    enable: () => configOverridesStore.set({ isDatastage: true }),
    isEnabled: () => (window.location.hostname === 'datastage.terra.bio') || getConfig().isDatastage
  },
  elwazi: {
    name: 'eLwazi',
    signInName: 'eLwazi',
    welcomeHeader: 'Welcome to eLwazi',
    description: 'The eLwazi Open Data Science Platform is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: 'Find how-to\'s, documentation, video tutorials, and discussion forums'
      }
    ],
    enable: () => configOverridesStore.set({ isElwazi: true }),
    isEnabled: () => (window.location.hostname === 'elwazi.terra.bio') || getConfig().isElwazi
  },
  firecloud: {
    name: 'FireCloud',
    signInName: 'FireCloud',
    welcomeHeader: 'Welcome to FireCloud',
    description: 'FireCloud is a NCI Cloud Resource project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: 'Find how-to\'s, documentation, video tutorials, and discussion forums'
      },
      {
        link: 'https://support.terra.bio/hc/en-us/articles/360022694271',
        text: 'Already a FireCloud user? Learn what\'s new.'
      },
      {
        link: 'https://support.terra.bio/hc/en-us/articles/360033416912',
        text: 'Learn more about the Cancer Research Data Commons and other NCI Cloud Resources'
      }
    ],
    enable: () => configOverridesStore.set({ isFirecloud: true }),
    isEnabled: () => (window.location.hostname === 'firecloud.terra.bio') || getConfig().isFirecloud
  },
  projectSingular: {
    name: 'Project Singular',
    signInName: 'Project Singular',
    welcomeHeader: 'Welcome to Project Singular',
    description: 'Project Singular is a project funded by Additional Ventures and powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: 'Find how-to\'s, documentation, video tutorials, and discussion forums'
      }
    ],
    enable: () => configOverridesStore.set({ isProjectSingular: true }),
    isEnabled: () => (window.location.hostname === 'projectsingular.terra.bio') || getConfig().isProjectSingular
  },
  rareX: {
    name: `The RARE${nonBreakingHyphen}X Data Analysis Platform`,
    signInName: `the RARE${nonBreakingHyphen}X Data Analysis Platform`,
    welcomeHeader: `Welcome to the RARE${nonBreakingHyphen}X Data Analysis Platform`,
    description: `The RARE${nonBreakingHyphen}X Data Analysis Platform is a federated data repository of rare disease patient health data, including patient reported outcomes, clinical and molecular information. The platform is powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.`,
    docLinks: [
      {
        link: 'https://rare-x.org/DataAnalysisPlatform-Documentation',
        text: 'Find RARE-X Data Analysis Platform documentation, tutorials and Jupyter notebook examples'
      },
      {
        link: 'https://rare-x.org/researchers/',
        text: 'Learn more about the RARE-X Data Analysis Platform'
      },
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: 'Find Terra how-to\'s, documentation, video tutorials, and discussion forums'
      }
    ],
    enable: () => configOverridesStore.set({ isRareX: true }),
    isEnabled: () => (window.location.hostname === 'rare-x.terra.bio') || getConfig().isRareX
  },
  terra: {
    name: 'Terra',
    signInName: 'Terra',
    welcomeHeader: 'Welcome to Terra Community Workbench',
    description: 'Terra is a cloud-native platform for biomedical researchers to access data, run analysis tools, and collaborate.',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: 'Find how-to\'s, documentation, video tutorials, and discussion forums'
      },
      {
        link: 'https://support.terra.bio/hc/en-us/articles/360033416672',
        text: 'Learn more about the Terra platform and our co-branded sites'
      }
    ],
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

export const getEnabledBrand = () => Utils.cond(
  [isAnvil(), () => brands.anvil],
  [isBaseline(), () => brands.baseline],
  [isBioDataCatalyst(), () => brands.bioDataCatalyst],
  [isDatastage(), () => brands.datastage],
  [isElwazi(), () => brands.elwazi],
  [isFirecloud(), () => brands.firecloud],
  [isProjectSingular(), () => brands.projectSingular],
  [isRareX(), () => brands.rareX],
  [isTerra(), () => brands.terra],
  () => brands.terra
)
