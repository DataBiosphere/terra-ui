import _ from 'lodash/fp'
import * as Utils from 'src/libs/utils'
import {
  defaultGceBootDiskSize, defaultGceMachineType, defaultGcePersistentDiskSize, defaultLocation, defaultPersistentDiskType, runtimeStatuses
} from 'src/pages/workspaces/workspace/analysis/runtime-utils'
import { tools } from 'src/pages/workspaces/workspace/analysis/tool-utils'
import { v4 as uuid } from 'uuid'


const defaultGoogleWorkspaceNamespace = 'test-ws'

//this is important, so the test impl can diverge
export const testDefaultLocation = defaultLocation


export const defaultImage = {
  id: 'terra-jupyter-gatk',
  image: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-gatk:2.2.8',
  label: 'Default: (GATK 4.2.4.0, Python 3.7.12, R 4.2.1)',
  packages: 'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-gatk-2.2.8-versions.json',
  requiresSpark: false,
  updated: '2022-08-09',
  version: '2.2.8'
}
export const defaultRImage = {
  id: 'RStudio',
  image: 'us.gcr.io/broad-dsp-gcr-public/anvil-rstudio-bioconductor:3.15.2',
  isRStudio: true,
  label: 'RStudio (R 4.2.0, Bioconductor 3.15, Python 3.8.10)',
  packages: 'https://storage.googleapis.com/terra-docker-image-documentation/placeholder.json',
  requiresSpark: false,
  updated: '2022-05-09',
  version: '3.15.2'
}

export const hailImage = {
  id: 'terra-jupyter-hail',
  image: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-hail:1.0.20',
  label: 'Hail: (Python 3.7.12, Spark 2.4.5, hail 0.2.98)',
  packages: 'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-hail-1.0.20-versions.json',
  requiresSpark: true,
  updated: '2022-08-25',
  version: '1.0.20'
}
export const imageDocs = [
  defaultImage,
  {
    id: 'terra-jupyter-bioconductor',
    image: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-bioconductor:2.1.7',
    label: 'R / Bioconductor: (Python 3.7.12, R 4.2.1, Bioconductor 3.15, tidyverse 1.3.2)',
    packages: 'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-bioconductor-2.1.7-versions.json',
    requiresSpark: false,
    updated: '2022-08-08',
    version: '2.1.7'
  },
  hailImage,
  {
    id: 'terra-jupyter-python',
    image: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-python:1.0.13',
    label: 'Python: (Python 3.7.12, pandas 1.3.5, scikit-learn 1.0.2)',
    packages: 'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-python-1.0.13-versions.json',
    requiresSpark: false,
    updated: '2022-08-18',
    version: '1.0.13'
  },
  {
    id: 'Pegasus',
    image: 'cumulusprod/pegasus-terra:1.6.0',
    isCommunity: true,
    label: 'Pegasus (Pegasuspy 1.6.0, Python 3.7.12, harmony-pytorch 0.1.7, nmf-torch 0.1.1, scVI-tools 0.16.0)',
    packages: 'https://raw.githubusercontent.com/lilab-bcb/cumulus/master/docker/pegasus-terra/1.6.0/pegasus-terra-1_6_0-versions.json',
    requiresSpark: false,
    updated: '2022-04-16',
    version: '1.6.0'
  },
  defaultRImage,
  {
    id: 'OpenVINO integration with Tensorflow',
    image: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-gatk-ovtf:0.1.7',
    isCommunity: true,
    label: 'OpenVINO integration with Tensorflow (openvino-tensorflow 1.1.0, Python 3.7.12, GATK 4.2.4.1)',
    packages: 'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-gatk-ovtf-0.1.7-versions.json',
    requiresSpark: false,
    updated: '2022-01-31',
    version: '0.2.0'
  },
  {
    id: 'terra-jupyter-gatk_legacy',
    image: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-gatk:2.0.9',
    label: 'Legacy GATK: (GATK 4.2.4.0, Python 3.7.12, R 4.1.3)',
    packages: 'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-gatk-2.0.9-versions.json',
    requiresSpark: false,
    updated: '2022-04-25',
    version: '2.0.9'
  },
  {
    id: 'terra-jupyter-bioconductor_legacy',
    image: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-bioconductor:2.1.3',
    label: 'Legacy R / Bioconductor: (Python 3.7.12, R 4.1.3, Bioconductor 3.14, tidyverse 1.3.1)',
    packages: 'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-bioconductor-2.1.3-versions.json',
    requiresSpark: false,
    updated: '2022-05-31',
    version: '2.1.3'
  }
]

export const defaultGoogleWorkspace = {
  cloudPlatform: 'Gcp',
  workspace: {
    bucketName: 'test-bucket', googleProject: `${defaultGoogleWorkspaceNamespace}-project`,
    name: `${defaultGoogleWorkspaceNamespace}_ws`, namespace: defaultGoogleWorkspaceNamespace
  }
}

export const defaultTestDisk = {
  id: 15778,
  googleProject: defaultGoogleWorkspace.workspace.googleProject,
  cloudContext: {
    cloudProvider: 'GCP',
    cloudResource: defaultGoogleWorkspace.workspace.googleProject
  },
  zone: 'us-central1-a',
  name: 'saturn-pd-c4aea6ef-5618-47d3-b674-5d456c9dcf4f',
  status: 'Ready',
  auditInfo: {
    creator: 'testuser123@broad.com',
    createdDate: '2022-07-18T18:35:32.012698Z',
    destroyedDate: null,
    dateAccessed: '2022-07-18T20:34:56.092Z'
  },
  size: defaultGcePersistentDiskSize,
  diskType: defaultPersistentDiskType,
  blockSize: 4096
}

export const getDisk = ({ size = defaultGcePersistentDiskSize } = {}) => ({
  ...defaultTestDisk,
  id: getRandomInt(10000),
  size
})


export const defaultWorkspaceLabels = {
  saturnWorkspaceNamespace: defaultGoogleWorkspace.workspace.namespace,
  saturnWorkspaceName: defaultGoogleWorkspace.workspace.name
}

const randomMaxInt = 10000
export const getJupyterRuntimeConfig = ({ diskId = getRandomInt(randomMaxInt), machineType = defaultGceMachineType } = {}) => ({
  machineType,
  persistentDiskId: diskId,
  cloudService: 'GCE',
  bootDiskSize: defaultGceBootDiskSize,
  zone: 'us-central1-a',
  gpuConfig: null
})

export const getRandomInt = max => Math.floor(Math.random() * max)

export const defaultAuditInfo = {
  creator: 'testuser123@broad.com',
  createdDate: '2022-07-18T18:35:32.012698Z',
  destroyedDate: null,
  dateAccessed: '2022-07-18T21:44:17.565Z'
}

export const generateGoogleProject = () => `terra-test-${uuid().substring(0, 8)}`

export const getGoogleRuntime = ({
  workspace = defaultGoogleWorkspace,
  runtimeName = Utils.generateRuntimeName(),
  status = runtimeStatuses.running.label,
  tool = tools.Jupyter,
  runtimeConfig = getJupyterRuntimeConfig(),
  image = undefined
} = {}) => {
  const googleProject = workspace.workspace.googleProject
  const imageUri = image ? image : Utils.switchCase(tool.label,
    [tools.RStudio.label, () => defaultRImage.image],
    [Utils.DEFAULT, () => defaultImage.image])

  return {
    id: getRandomInt(randomMaxInt),
    workspaceId: null,
    runtimeName,
    googleProject,
    cloudContext: {
      cloudProvider: 'GCP',
      cloudResource: googleProject
    },
    auditInfo: defaultAuditInfo,
    runtimeConfig,
    proxyUrl: `https://leonardo.dsde-dev.broadinstitute.org/proxy/${googleProject}/${runtimeName}/${_.toLower(tool.label)}`,
    status,
    autopauseThreshold: 30,
    labels: {
      ...defaultWorkspaceLabels,
      'saturn-iframe-extension': 'https://bvdp-saturn-dev.appspot.com/jupyter-iframe-extension.js',
      creator: 'testuser123@broad.com',
      clusterServiceAccount: 'pet-26534176105071279add1@terra-dev-cf677740.iam.gserviceaccount.com',
      saturnAutoCreated: 'true',
      clusterName: runtimeName,
      saturnVersion: '6',
      tool: tool.label,
      runtimeName,
      cloudContext: `Gcp/${googleProject}`,
      googleProject
    },
    runtimeImages: [
      {
        imageType: 'Proxy',
        imageUrl: 'broadinstitute/openidc-proxy:2.3.1_2',
        homeDirectory: null,
        timestamp: '2022-09-19T15:37:11.035465Z'
      },
      {
        imageType: tool.label,
        imageUrl: imageUri,
        // "homeDirectory": "/home/jupyter", //TODO: is this needed anywhere in UI?
        timestamp: '2022-09-19T15:37:11.035465Z'
      },
      {
        imageType: 'Welder',
        imageUrl: 'us.gcr.io/broad-dsp-gcr-public/welder-server:ef956b2',
        homeDirectory: null,
        timestamp: '2022-09-19T15:37:11.035465Z'
      },
      {
        imageType: 'BootSource',
        imageUrl: 'projects/broad-dsp-gcr-public/global/images/nl-825-2-gce-cos-image-e06f7d9',
        homeDirectory: null,
        timestamp: '2022-09-19T15:37:12.119Z'
      },
      {
        imageType: 'CryptoDetector',
        imageUrl: 'us.gcr.io/broad-dsp-gcr-public/cryptomining-detector:0.0.2',
        homeDirectory: null,
        timestamp: '2022-09-19T15:37:11.035465Z'
      }
    ],
    patchInProgress: false
  }
}
