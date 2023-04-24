import anvilLogo from "src/images/brands/anvil/ANVIL-Logo.svg";
import anvilLogoWhite from "src/images/brands/anvil/ANVIL-Logo-White.svg";
import baselineLogo from "src/images/brands/baseline/baseline-logo-color.svg";
import baselineLogoWhite from "src/images/brands/baseline/baseline-logo-white.svg";
import bioDataCatalystLogo from "src/images/brands/bioDataCatalyst/bioDataCatalyst-Logo-color.svg";
import bioDataCatalystLogoWhite from "src/images/brands/bioDataCatalyst/bioDataCatalyst-Logo-white.svg";
import datastageLogo from "src/images/brands/datastage/DataSTAGE-Logo.svg";
import datastageLogoWhite from "src/images/brands/datastage/DataSTAGE-Logo-White.svg";
import elwaziLogo from "src/images/brands/elwazi/elwazi-logo-color.svg";
import elwaziLogoWhite from "src/images/brands/elwazi/elwazi-logo-white.svg";
import fcLogo from "src/images/brands/firecloud/FireCloud-Logo.svg";
import fcLogoWhite from "src/images/brands/firecloud/FireCloud-Logo-White.svg";
import projectSingularLogo from "src/images/brands/projectSingular/project-singular-logo-black.svg";
import projectSingularLogoWhite from "src/images/brands/projectSingular/project-singular-logo-white.svg";
import rareXLogo from "src/images/brands/rareX/rarex-logo-color.svg";
import rareXLogoWhite from "src/images/brands/rareX/rarex-logo-white.svg";
import terraLogo from "src/images/brands/terra/logo.svg";
import terraLogoWhite from "src/images/brands/terra/logo-grey.svg";
import terraLogoShadow from "src/images/brands/terra/logo-wShadow.svg";

const nonBreakingHyphen = "\u2011";

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
}

/**
 * Configuration for Terra co-brands (a.k.a. white label sites)
 * https://broadworkbench.atlassian.net/wiki/spaces/WOR/pages/2369388553/Cobranding+and+White+Label+Sites
 */
export const brands: Record<string, BrandConfiguration> = {
  anvil: {
    name: "AnVIL",
    queryName: "anvil",
    welcomeHeader: "Welcome to AnVIL",
    description:
      "The NHGRI AnVIL (Genomic Data Science Analysis, Visualization, and Informatics Lab-space) is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.",
    hostName: "anvil.terra.bio",
    docLinks: [
      {
        link: "https://support.terra.bio/hc/en-us",
        text: "Find how-to's, documentation, video tutorials, and discussion forums",
      },
    ],
    logos: {
      color: anvilLogo,
      white: anvilLogoWhite,
    },
  },
  baseline: {
    name: "Project Baseline",
    queryName: "project baseline",
    welcomeHeader: "Welcome to Project Baseline",
    description:
      "The Baseline Health Study Data Portal is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.",
    hostName: "baseline.terra.bio",
    docLinks: [
      {
        link: "https://support.terra.bio/hc/en-us",
        text: "Find how-to's, documentation, video tutorials, and discussion forums",
      },
    ],
    logos: {
      color: baselineLogo,
      white: baselineLogoWhite,
    },
  },
  bioDataCatalyst: {
    name: "NHLBI BioData Catalyst",
    queryName: "nhlbi biodata catalyst",
    welcomeHeader: "Welcome to NHLBI BioData Catalyst",
    description:
      "NHLBI BioData Catalyst (BDC) is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.",
    hostName: "terra.biodatacatalyst.nhlbi.nih.gov",
    docLinks: [
      {
        link: "https://support.terra.bio/hc/en-us",
        text: "Find how-to's, documentation, video tutorials, and discussion forums",
      },
    ],
    logos: {
      color: bioDataCatalystLogo,
      white: bioDataCatalystLogoWhite,
    },
  },
  datastage: {
    name: "DataStage",
    queryName: "datastage",
    welcomeHeader: "Welcome to DataStage",
    description:
      "DataStage is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.",
    hostName: "datastage.terra.bio",
    docLinks: [
      {
        link: "https://support.terra.bio/hc/en-us",
        text: "Find how-to's, documentation, video tutorials, and discussion forums",
      },
    ],
    logos: {
      color: datastageLogo,
      white: datastageLogoWhite,
    },
  },
  elwazi: {
    name: "eLwazi",
    queryName: "elwazi",
    welcomeHeader: "Welcome to eLwazi",
    description:
      "The eLwazi Open Data Science Platform is a project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.",
    hostName: "elwazi.terra.bio",
    docLinks: [
      {
        link: "https://support.terra.bio/hc/en-us",
        text: "Find how-to's, documentation, video tutorials, and discussion forums",
      },
    ],
    logos: {
      color: elwaziLogo,
      white: elwaziLogoWhite,
    },
  },
  firecloud: {
    name: "FireCloud",
    queryName: "firecloud",
    welcomeHeader: "Welcome to FireCloud",
    description:
      "FireCloud is a NCI Cloud Resource project powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.",
    hostName: "firecloud.terra.bio",
    docLinks: [
      {
        link: "https://support.terra.bio/hc/en-us",
        text: "Find how-to's, documentation, video tutorials, and discussion forums",
      },
      {
        link: "https://support.terra.bio/hc/en-us/articles/360022694271",
        text: "Already a FireCloud user? Learn what's new.",
      },
      {
        link: "https://support.terra.bio/hc/en-us/articles/360033416912",
        text: "Learn more about the Cancer Research Data Commons and other NCI Cloud Resources",
      },
    ],
    logos: {
      color: fcLogo,
      white: fcLogoWhite,
    },
  },
  projectSingular: {
    name: "Project Singular",
    queryName: "project singular",
    welcomeHeader: "Welcome to Project Singular",
    description:
      "Project Singular is a project funded by Additional Ventures and powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.",
    hostName: "projectsingular.terra.bio",
    docLinks: [
      {
        link: "https://support.terra.bio/hc/en-us",
        text: "Find how-to's, documentation, video tutorials, and discussion forums",
      },
    ],
    logos: {
      color: projectSingularLogo,
      white: projectSingularLogoWhite,
    },
  },
  rareX: {
    name: `The RARE${nonBreakingHyphen}X Data Analysis Platform`,
    queryName: `the rare${nonBreakingHyphen}x data analysis platform`,
    welcomeHeader: `Welcome to the RARE${nonBreakingHyphen}X Data Analysis Platform`,
    description: `The RARE${nonBreakingHyphen}X Data Analysis Platform is a federated data repository of rare disease patient health data, including patient reported outcomes, clinical and molecular information. The platform is powered by Terra for biomedical researchers to access data, run analysis tools, and collaborate.`,
    hostName: "rare-x.terra.bio",
    docLinks: [
      {
        link: "https://docs.google.com/forms/d/e/1FAIpQLScpqfZIXW53IJOiYz2RhASJzm7lZBYAjzkjJ67qFDERUpuDAQ/viewform",
        text: "Request access to the RARE-X data set within Terra",
      },
      {
        link: "https://rare-x.org/researchers/",
        text: "Learn more about the data available from RARE-X",
      },
      {
        link: "https://support.terra.bio/hc/en-us",
        text: "Find Terra how-to's, documentation, video tutorials, and discussion forums",
      },
    ],
    logos: {
      color: rareXLogo,
      white: rareXLogoWhite,
    },
  },
  terra: {
    name: "Terra",
    queryName: "terra",
    welcomeHeader: "Welcome to Terra Community Workbench",
    description:
      "Terra is a cloud-native platform for biomedical researchers to access data, run analysis tools, and collaborate.",
    hostName: "app.terra.bio",
    docLinks: [
      {
        link: "https://support.terra.bio/hc/en-us",
        text: "Find how-to's, documentation, video tutorials, and discussion forums",
      },
      {
        link: "https://support.terra.bio/hc/en-us/articles/360033416672",
        text: "Learn more about the Terra platform and our co-branded sites",
      },
    ],
    logos: {
      color: terraLogo,
      white: terraLogoWhite,
      shadow: terraLogoShadow,
    },
  },
};

export const defaultBrand = brands.terra;
