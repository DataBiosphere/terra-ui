import { Theme } from '@terra-ui-packages/components';
import anvilLogo from 'src/images/brands/anvil/ANVIL-Logo.svg';
import anvilLogoWhite from 'src/images/brands/anvil/ANVIL-Logo-White.svg';
import baselineLogo from 'src/images/brands/baseline/baseline-logo-color.svg';
import baselineLogoWhite from 'src/images/brands/baseline/baseline-logo-white.svg';
import bioDataCatalystLogo from 'src/images/brands/bioDataCatalyst/bioDataCatalyst-Logo-color.svg';
import bioDataCatalystLogoWhite from 'src/images/brands/bioDataCatalyst/bioDataCatalyst-Logo-white.svg';
import datastageLogo from 'src/images/brands/datastage/DataSTAGE-Logo.svg';
import datastageLogoWhite from 'src/images/brands/datastage/DataSTAGE-Logo-White.svg';
import elwaziLogo from 'src/images/brands/elwazi/elwazi-logo-color.svg';
import elwaziLogoWhite from 'src/images/brands/elwazi/elwazi-logo-white.svg';
import fcLogo from 'src/images/brands/firecloud/FireCloud-Logo.svg';
import fcLogoWhite from 'src/images/brands/firecloud/FireCloud-Logo-White.svg';
import projectSingularLogo from 'src/images/brands/projectSingular/project-singular-logo-black.svg';
import projectSingularLogoWhite from 'src/images/brands/projectSingular/project-singular-logo-white.svg';
import rareXLogo from 'src/images/brands/rareX/rarex-logo-color.svg';
import rareXLogoWhite from 'src/images/brands/rareX/rarex-logo-white.svg';
import terraLogo from 'src/images/brands/terra/logo.svg';
import terraLogoWhite from 'src/images/brands/terra/logo-grey.svg';
import terraLogoShadow from 'src/images/brands/terra/logo-wShadow.svg';

const nonBreakingHyphen = '\u2011';

export interface BrandConfiguration {
  /** Brand name */
  name: string;

  /** Used to construct return URLs for FireCloud */
  queryName: string;

  /** Landing page header text */
  welcomeHeader: string;

  /** Landing page text */
  description: string;

  /** Host name for branded site */
  hostName: string;

  /** Links shown on landing page */
  docLinks: {
    /** Link URL */
    link: string;

    /** Link text */
    text: string;
  }[];

  /** URLs for logo images */
  logos: {
    /** Brand logo */
    color: string;

    /** Light version of brand logo used against dark backgrounds */
    white: string;
    [otherLogoType: string]: string;
  };

  /** Optional URL for landing page background image */
  landingPageBackground?: string;

  /** Optionally filter which datasets show up in the Data Catalog */
  catalogDataCollectionsToInclude?: string[];

  /** Theme for components */
  theme: Theme;
}

const baseColors: Theme['colorPalette'] = {
  primary: '#74ae43',
  secondary: '#6d6e70',
  accent: '#4d72aa',
  success: '#74ae43',
  warning: '#f7981c',
  danger: '#db3214',
  light: '#e9ecef',
  dark: '#333f52',
  grey: '#808080',
  disabled: '#b6b7b8',
};

/**
 * Configuration for Terra co-brands (a.k.a. white label sites)
 * https://broadworkbench.atlassian.net/wiki/spaces/WOR/pages/2369388553/Cobranding+and+White+Label+Sites
 */
export const brands: Record<string, BrandConfiguration> = {
  anvil: {
    name: 'AnVIL',
    queryName: 'anvil',
    welcomeHeader: 'Welcome to AnVIL',
    description:
      'The NHGRI AnVIL (Genomic Data Science Analysis, Visualization, and Informatics Lab-space) is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.',
    hostName: 'anvil.terra.bio',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: "Find how-to's, documentation, video tutorials, and discussion forums",
      },
    ],
    logos: {
      color: anvilLogo,
      white: anvilLogoWhite,
    },
    theme: {
      colorPalette: { ...baseColors, primary: '#e0dd10', accent: '#035c94', light: '#f6f7f4', dark: '#012840' },
    },
  },
  baseline: {
    name: 'Project Baseline',
    queryName: 'project baseline',
    welcomeHeader: 'Welcome to Project Baseline',
    description:
      'The Baseline Health Study Data Portal is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.',
    hostName: 'baseline.terra.bio',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: "Find how-to's, documentation, video tutorials, and discussion forums",
      },
    ],
    logos: {
      color: baselineLogo,
      white: baselineLogoWhite,
    },
    theme: {
      colorPalette: { ...baseColors, primary: '#c41061', secondary: '#31164c', light: '#f6f7f4', dark: '#012840' },
    },
  },
  bioDataCatalyst: {
    name: 'NHLBI BioData Catalyst',
    queryName: 'nhlbi biodata catalyst',
    welcomeHeader: 'Welcome to NHLBI BioData Catalyst',
    description:
      'NHLBI BioData Catalyst (BDC) is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.',
    hostName: 'terra.biodatacatalyst.nhlbi.nih.gov',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: "Find how-to's, documentation, video tutorials, and discussion forums",
      },
    ],
    logos: {
      color: bioDataCatalystLogo,
      white: bioDataCatalystLogoWhite,
    },
    theme: {
      colorPalette: {
        ...baseColors,
        primary: '#c0143c',
        secondary: '#1a568c',
        accent: '#1a568c',
        light: '#f4f4f6',
        dark: '#12385a',
      },
    },
  },
  datastage: {
    name: 'DataStage',
    queryName: 'datastage',
    welcomeHeader: 'Welcome to DataStage',
    description:
      'DataStage is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.',
    hostName: 'datastage.terra.bio',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: "Find how-to's, documentation, video tutorials, and discussion forums",
      },
    ],
    logos: {
      color: datastageLogo,
      white: datastageLogoWhite,
    },
    theme: {
      colorPalette: {
        ...baseColors,
        primary: '#c02f42',
        secondary: '#1a568c',
        accent: '#1a568c',
        light: '#f4f4f6',
        dark: '#12385a',
      },
    },
  },
  elwazi: {
    name: 'eLwazi',
    queryName: 'elwazi',
    welcomeHeader: 'Welcome to eLwazi',
    description:
      'The eLwazi Open Data Science Platform is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.',
    hostName: 'elwazi.terra.bio',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: "Find how-to's, documentation, video tutorials, and discussion forums",
      },
    ],
    logos: {
      color: elwaziLogo,
      white: elwaziLogoWhite,
    },
    theme: {
      colorPalette: {
        ...baseColors,
        primary: '#c13f27',
        secondary: '#c13f27',
        dark: '#1d1d1b',
        accent: '#6e3d3b',
        success: '#9eb642',
      },
    },
  },
  firecloud: {
    name: 'FireCloud',
    queryName: 'firecloud',
    welcomeHeader: 'Welcome to FireCloud',
    description:
      'FireCloud is a NCI Cloud Resource project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.',
    hostName: 'firecloud.terra.bio',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: "Find how-to's, documentation, video tutorials, and discussion forums",
      },
      {
        link: 'https://support.terra.bio/hc/en-us/articles/360022694271',
        text: "Already a FireCloud user? Learn what's new.",
      },
      {
        link: 'https://support.terra.bio/hc/en-us/articles/360033416912',
        text: 'Learn more about the Cancer Research Data Commons and other NCI Cloud Resources',
      },
    ],
    logos: {
      color: fcLogo,
      white: fcLogoWhite,
    },
    theme: {
      colorPalette: { ...baseColors, primary: '#4d72aa' },
    },
  },
  projectSingular: {
    name: 'Project Singular',
    queryName: 'project singular',
    welcomeHeader: 'Welcome to Project Singular',
    description:
      'Project Singular is a project funded by Additional Ventures and powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.',
    hostName: 'projectsingular.terra.bio',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: "Find how-to's, documentation, video tutorials, and discussion forums",
      },
    ],
    logos: {
      color: projectSingularLogo,
      white: projectSingularLogoWhite,
    },
    theme: {
      colorPalette: { ...baseColors, primary: '#521b93', secondary: '#011c48', accent: '#521b93' },
    },
  },
  rareX: {
    name: `The RARE${nonBreakingHyphen}X Data Analysis Platform`,
    queryName: `the rare${nonBreakingHyphen}x data analysis platform`,
    welcomeHeader: `Welcome to the RARE${nonBreakingHyphen}X Data Analysis Platform`,
    description: `The RARE${nonBreakingHyphen}X Data Analysis Platform is a federated data repository of rare disease patient health data, including patient reported outcomes, clinical and molecular information. The platform is powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.`,
    hostName: 'rare-x.terra.bio',
    docLinks: [
      {
        link: 'https://docs.google.com/forms/d/e/1FAIpQLScpqfZIXW53IJOiYz2RhASJzm7lZBYAjzkjJ67qFDERUpuDAQ/viewform',
        text: 'Request access to the RARE-X data set within Terra',
      },
      {
        link: 'https://rare-x.org/researchers/',
        text: 'Learn more about the data available from RARE-X',
      },
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: "Find Terra how-to's, documentation, video tutorials, and discussion forums",
      },
    ],
    logos: {
      color: rareXLogo,
      white: rareXLogoWhite,
    },
    theme: {
      colorPalette: {
        ...baseColors,
        primary: '#26355c',
        secondary: '#26355c',
        dark: '#414042',
        accent: '#4e6888',
        light: '#f4efea',
      },
    },
  },
  terra: {
    name: 'Terra',
    queryName: 'terra',
    welcomeHeader: 'Welcome to Terra Community Workbench',
    description:
      'Terra is a cloud-native platform for biomedical researchers to access data, run analysis tools, and collaborate.',
    hostName: 'app.terra.bio',
    docLinks: [
      {
        link: 'https://support.terra.bio/hc/en-us',
        text: "Find how-to's, documentation, video tutorials, and discussion forums",
      },
      {
        link: 'https://support.terra.bio/hc/en-us/articles/360033416672',
        text: 'Learn more about the Terra platform and our co-branded sites',
      },
    ],
    logos: {
      color: terraLogo,
      white: terraLogoWhite,
      shadow: terraLogoShadow,
    },
    theme: {
      colorPalette: { ...baseColors },
    },
  },
};

export const defaultBrand = brands.terra;
