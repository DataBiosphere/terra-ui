const nonBreakingHyphen = '\u2011'


/**
 * Configuration for Terra co-brands (a.k.a. white label sites)
 * https://broadworkbench.atlassian.net/wiki/spaces/WOR/pages/2369388553/Cobranding+and+White+Label+Sites
 */
export const brands = {
  anvil: {
    name: 'AnVIL',
    signInName: 'AnVIL',
    welcomeHeader: 'Welcome to AnVIL',
    description: `The NHGRI AnVIL (Genomic Data Science Analysis, Visualization, and Informatics Lab-space) is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.`,
    hostName: 'anvil.terra.bio',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: 'Find how-to\'s, documentation, video tutorials, and discussion forums'
      }
    ]
  },
  baseline: {
    name: 'Project Baseline',
    signInName: 'Project Baseline',
    welcomeHeader: 'Welcome to Project Baseline',
    description: 'The Baseline Health Study Data Portal is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.',
    hostName: 'baseline.terra.bio',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: 'Find how-to\'s, documentation, video tutorials, and discussion forums'
      }
    ]
  },
  bioDataCatalyst: {
    name: 'NHLBI BioData Catalyst',
    signInName: 'NHLBI BioData Catalyst',
    welcomeHeader: 'Welcome to NHLBI BioData Catalyst',
    description: 'NHLBI BioData Catalyst is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.',
    hostName: 'terra.biodatacatalyst.nhlbi.nih.gov',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: 'Find how-to\'s, documentation, video tutorials, and discussion forums'
      }
    ]
  },
  datastage: {
    name: 'DataStage',
    signInName: 'DataStage',
    welcomeHeader: 'Welcome to DataStage',
    description: 'DataStage is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.',
    hostName: 'datastage.terra.bio',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: 'Find how-to\'s, documentation, video tutorials, and discussion forums'
      }
    ]
  },
  elwazi: {
    name: 'eLwazi',
    signInName: 'eLwazi',
    welcomeHeader: 'Welcome to eLwazi',
    description: 'The eLwazi Open Data Science Platform is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.',
    hostName: 'elwazi.terra.bio',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: 'Find how-to\'s, documentation, video tutorials, and discussion forums'
      }
    ]
  },
  firecloud: {
    name: 'FireCloud',
    signInName: 'FireCloud',
    welcomeHeader: 'Welcome to FireCloud',
    description: 'FireCloud is a NCI Cloud Resource project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.',
    hostName: 'firecloud.terra.bio',
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
    ]
  },
  projectSingular: {
    name: 'Project Singular',
    signInName: 'Project Singular',
    welcomeHeader: 'Welcome to Project Singular',
    description: 'Project Singular is a project funded by Additional Ventures and powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.',
    hostName: 'projectsingular.terra.bio',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: 'Find how-to\'s, documentation, video tutorials, and discussion forums'
      }
    ]
  },
  rareX: {
    name: `The RARE${nonBreakingHyphen}X Data Analysis Platform`,
    signInName: `the RARE${nonBreakingHyphen}X Data Analysis Platform`,
    welcomeHeader: `Welcome to the RARE${nonBreakingHyphen}X Data Analysis Platform`,
    description: `The RARE${nonBreakingHyphen}X Data Analysis Platform is a federated data repository of rare disease patient health data, including patient reported outcomes, clinical and molecular information. The platform is powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.`,
    hostName: 'rare-x.terra.bio',
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
    ]
  },
  terra: {
    name: 'Terra',
    signInName: 'Terra',
    welcomeHeader: 'Welcome to Terra Community Workbench',
    description: 'Terra is a cloud-native platform for biomedical researchers to access data, run analysis tools, and collaborate.',
    hostName: 'app.terra.bio',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: 'Find how-to\'s, documentation, video tutorials, and discussion forums'
      },
      {
        link: 'https://support.terra.bio/hc/en-us/articles/360033416672',
        text: 'Learn more about the Terra platform and our co-branded sites'
      }
    ]
  }
}
