import { cloudServiceTypes } from 'src/libs/ajax/leonardo/models/runtime-config-models';

import { defaultImage, getGoogleRuntime, getPersistentDiskDetail } from '../_testData/testData';
import { defaultGceBootDiskSize } from '../utils/disk-utils';
import { defaultGpuType, defaultNumGpus } from '../utils/runtime-utils';
import {
  buildDesiredEnvironmentConfig,
  buildExistingEnvironmentConfig,
  DesiredEnvironmentParams,
  DesiredModalRuntimeConfig,
  IComputeConfig,
  NormalizedModalRuntime,
} from './modal-utils';

const computeConfig: IComputeConfig = {
  bootDiskSize: 250,
  diskSize: 50,
  diskType: 'pd-standard',
  masterMachineType: 'n1-standard-2',
  masterDiskSize: 150,
  numberOfWorkers: 2,
  componentGatewayEnabled: false,
  numberOfPreemptibleWorkers: 0,
  workerMachineType: 'n1-standard-4',
  workerDiskSize: 150,
  gpuEnabled: true,
  hasGpu: true,
  gpuType: 'nvidia-tesla-t4',
  numGpus: 1,
  autopauseThreshold: 30,
  computeZone: 'US-CENTRAL1-A',
  computeRegion: 'US-CENTRAL1',
};

describe('modal-utils', () => {
  describe('existing config', () => {
    it('correctly handles non-variable fields', () => {
      // Arrange
      const tempGoogleRuntime = getGoogleRuntime();
      const testUri = 'testUri';
      const gpuConfig = { gpuType: defaultGpuType, numOfGpus: defaultNumGpus };
      const googleRuntime = {
        ...tempGoogleRuntime,
        jupyterUserScriptUri: testUri,
        runtimeConfig: { ...tempGoogleRuntime.runtimeConfig, gpuConfig },
      };
      const disk = getPersistentDiskDetail();

      // Act
      const existingConfig = buildExistingEnvironmentConfig(computeConfig, googleRuntime, disk);
      const runtimeConfig = googleRuntime.runtimeConfig;

      // Assert
      expect(existingConfig.hasGpu).toBe(computeConfig.hasGpu);
      expect(existingConfig.autopauseThreshold).toBe(googleRuntime?.autopauseThreshold);
      expect(existingConfig.computeConfig).toBe(computeConfig);
      expect(existingConfig.currentRuntimeDetails).toBe(googleRuntime);

      // runtime inner field
      expect(existingConfig.runtime?.cloudService).toBe(runtimeConfig.cloudService);
      expect(existingConfig.runtime?.region).toBe(computeConfig.computeRegion);
      expect(existingConfig.runtime?.persistentDiskAttached).toBe(true);
      expect(existingConfig.runtime?.gpuConfig).toBe(gpuConfig);
      expect(existingConfig.runtime?.jupyterUserScriptUri).toBe(testUri);
      expect(existingConfig.runtime?.toolDockerImage).toBe(defaultImage.image);

      // TODO: all fields when runtime is well typed
    });

    // TODO: dataproc when runtime is well typed
  });

  describe('desired config', () => {
    it('correctly handles fields when a GCE runtime exists', () => {
      // Arrange
      const tempGoogleRuntime = getGoogleRuntime();
      const existingModalRuntimeConfig: NormalizedModalRuntime = {
        cloudService: 'GCE',
        toolDockerImage: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-python:1.1.5',
        tool: 'Jupyter',
        region: 'US-CENTRAL1',
        persistentDiskAttached: true,
        zone: 'US-CENTRAL1-A',
        machineType: 'n1-standard-1',
        bootDiskSize: 250,
      };
      const testUri = 'testUri';
      const gpuConfig = { gpuType: defaultGpuType, numOfGpus: defaultNumGpus };
      const googleRuntime = {
        ...tempGoogleRuntime,
        jupyterUserScriptUri: testUri,
        runtimeConfig: { ...tempGoogleRuntime.runtimeConfig, gpuConfig },
      };
      const existingConfig: DesiredModalRuntimeConfig = {
        hasGpu: false,
        autopauseThreshold: 30,
        computeConfig,
        currentRuntimeDetails: googleRuntime,
        runtime: existingModalRuntimeConfig,
        persistentDisk: {
          size: 50,
          diskType: 'pd-standard',
        },
      };

      const params: DesiredEnvironmentParams = {
        desiredRuntimeType: 'Standard VM',
        timeoutInMinutes: null,
        deleteDiskSelected: false,
        upgradeDiskSelected: false,
        jupyterUserScriptUri: testUri,
        isCustomSelectedImage: false,
        customImageUrl: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-python:1.1.5',
        selectedImage: {
          id: 'terra-jupyter-python',
          url: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-python:1.1.5',
          isCommunity: false,
          isRStudio: false,
          isTerraSupported: true,
          toolLabel: 'Jupyter',
          label: 'Python: (Python 3.10.12, pandas 2.0.3, scikit-learn 1.3.0)',
          packages:
            'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-python-1.1.5-versions.json',
          requiresSpark: false,
          updated: '2023-11-30',
          version: '1.1.5',
        },
      };

      // Act
      const desiredConfig = buildDesiredEnvironmentConfig(existingConfig, 'environmentWarning', params);
      const runtimeConfig = googleRuntime.runtimeConfig;

      // Assert
      expect(desiredConfig.hasGpu).toBe(computeConfig.hasGpu);
      expect(desiredConfig.autopauseThreshold).toBe(googleRuntime?.autopauseThreshold);
      expect(desiredConfig.computeConfig).toBe(computeConfig);
      expect(desiredConfig.currentRuntimeDetails).toBe(googleRuntime);

      // runtime inner field
      expect(desiredConfig.runtime?.cloudService).toBe(runtimeConfig.cloudService);
      expect(desiredConfig.runtime?.region).toBe(computeConfig.computeRegion);
      expect(desiredConfig.runtime?.persistentDiskAttached).toBe(true);
      expect(desiredConfig.runtime?.gpuConfig).toStrictEqual(gpuConfig);
      expect(desiredConfig.runtime?.jupyterUserScriptUri).toBe(testUri);
      expect(desiredConfig.runtime?.toolDockerImage).toBe(params.selectedImage?.url);
      expect(desiredConfig.runtime?.tool).toBe(params.selectedImage?.toolLabel);
      expect(desiredConfig.runtime?.machineType).toBe(computeConfig.masterMachineType);
      // we know the bootdisksize exists on the runtimeconfig here because we made it
      // @ts-expect-error
      expect(desiredConfig.runtime?.bootDiskSize).toBe(runtimeConfig.bootDiskSize);
      expect(desiredConfig.runtime?.diskSize).toBe(undefined);

      // Dataproc fields all undefined
      expect(desiredConfig.runtime?.masterMachineType).toBe(undefined);
      expect(desiredConfig.runtime?.masterDiskSize).toBe(undefined);
      expect(desiredConfig.runtime?.numberOfWorkers).toBe(undefined);
      expect(desiredConfig.runtime?.componentGatewayEnabled).toBe(undefined);
      expect(desiredConfig.runtime?.numberOfPreemptibleWorkers).toBe(undefined);
      expect(desiredConfig.runtime?.workerMachineType).toBe(undefined);
      expect(desiredConfig.runtime?.workerDiskSize).toBe(undefined);

      // Disk
      expect(desiredConfig.persistentDisk).toStrictEqual(existingConfig.persistentDisk);
    });

    it('correctly handles fields when a runtime does not exist', () => {
      // Arrange
      const existingModalRuntimeConfig: NormalizedModalRuntime = {
        cloudService: 'GCE',
        toolDockerImage: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-python:1.1.5',
        tool: 'Jupyter',
        region: 'US-CENTRAL1',
        persistentDiskAttached: true,
        zone: 'US-CENTRAL1-A',
        machineType: 'n1-standard-1',
        bootDiskSize: 250,
      };
      const testUri = 'testUri';
      const gpuConfig = { gpuType: computeConfig.gpuType, numOfGpus: computeConfig.numGpus };

      const existingConfig: DesiredModalRuntimeConfig = {
        hasGpu: false,
        autopauseThreshold: 30,
        computeConfig,
        currentRuntimeDetails: undefined,
        runtime: existingModalRuntimeConfig,
        persistentDisk: {
          size: 50,
          diskType: 'pd-standard',
        },
      };

      const params: DesiredEnvironmentParams = {
        desiredRuntimeType: 'Standard VM',
        timeoutInMinutes: 10,
        deleteDiskSelected: false,
        upgradeDiskSelected: false,
        jupyterUserScriptUri: testUri,
        isCustomSelectedImage: false,
        customImageUrl: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-python:1.1.5',
        selectedImage: {
          id: 'terra-jupyter-python',
          url: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-python:1.1.5',
          isCommunity: false,
          isRStudio: false,
          isTerraSupported: true,
          toolLabel: 'Jupyter',
          label: 'Python: (Python 3.10.12, pandas 2.0.3, scikit-learn 1.3.0)',
          packages:
            'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-python-1.1.5-versions.json',
          requiresSpark: false,
          updated: '2023-11-30',
          version: '1.1.5',
        },
      };

      // Act
      const desiredConfig = buildDesiredEnvironmentConfig(existingConfig, 'environmentWarning', params);
      // const runtimeConfig = googleRuntime.runtimeConfig

      // Assert
      expect(desiredConfig.hasGpu).toBe(computeConfig.hasGpu);
      expect(desiredConfig.autopauseThreshold).toBe(computeConfig.autopauseThreshold);
      expect(desiredConfig.computeConfig).toBe(computeConfig);
      expect(desiredConfig.currentRuntimeDetails).toBe(undefined);

      // runtime inner field
      expect(desiredConfig.runtime?.cloudService).toBe(cloudServiceTypes.GCE);
      expect(desiredConfig.runtime?.region).toBe(computeConfig.computeRegion);
      expect(desiredConfig.runtime?.persistentDiskAttached).toBe(true);
      expect(desiredConfig.runtime?.gpuConfig).toStrictEqual(gpuConfig);
      expect(desiredConfig.runtime?.jupyterUserScriptUri).toBe(testUri);
      expect(desiredConfig.runtime?.toolDockerImage).toBe(params.selectedImage?.url);
      expect(desiredConfig.runtime?.tool).toBe(params.selectedImage?.toolLabel);
      expect(desiredConfig.runtime?.timeoutInMinutes).toBe(params.timeoutInMinutes);
      expect(desiredConfig.runtime?.zone).toBe(computeConfig.computeZone);
      expect(desiredConfig.runtime?.machineType).toBe(computeConfig.masterMachineType);
      expect(desiredConfig.runtime?.bootDiskSize).toBe(defaultGceBootDiskSize);
      expect(desiredConfig.runtime?.diskSize).toBe(undefined);

      // Dataproc fields all undefined
      expect(desiredConfig.runtime?.masterMachineType).toBe(undefined);
      expect(desiredConfig.runtime?.masterDiskSize).toBe(undefined);
      expect(desiredConfig.runtime?.numberOfWorkers).toBe(undefined);
      expect(desiredConfig.runtime?.componentGatewayEnabled).toBe(undefined);
      expect(desiredConfig.runtime?.numberOfPreemptibleWorkers).toBe(undefined);
      expect(desiredConfig.runtime?.workerMachineType).toBe(undefined);
      expect(desiredConfig.runtime?.workerDiskSize).toBe(undefined);

      expect(desiredConfig.persistentDisk).toStrictEqual(existingConfig.persistentDisk);
    });

    it('correctly handles deleteEnvironment with deleteDiskSelected=false', () => {
      // Arrange
      const existingModalRuntimeConfig: NormalizedModalRuntime = {
        cloudService: 'GCE',
        toolDockerImage: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-python:1.1.5',
        tool: 'Jupyter',
        region: 'US-CENTRAL1',
        persistentDiskAttached: true,
        zone: 'US-CENTRAL1-A',
        machineType: 'n1-standard-1',
        bootDiskSize: 250,
      };
      const testUri = 'testUri';

      const existingConfig: DesiredModalRuntimeConfig = {
        hasGpu: false,
        autopauseThreshold: 30,
        computeConfig,
        currentRuntimeDetails: undefined,
        runtime: existingModalRuntimeConfig,
        persistentDisk: {
          size: 50,
          diskType: 'pd-standard',
        },
      };

      const params: DesiredEnvironmentParams = {
        desiredRuntimeType: 'Standard VM',
        timeoutInMinutes: 10,
        deleteDiskSelected: true,
        upgradeDiskSelected: false,
        jupyterUserScriptUri: testUri,
        isCustomSelectedImage: false,
        customImageUrl: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-python:1.1.5',
        selectedImage: {
          id: 'terra-jupyter-python',
          url: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-python:1.1.5',
          isCommunity: false,
          isRStudio: false,
          isTerraSupported: true,
          toolLabel: 'Jupyter',
          label: 'Python: (Python 3.10.12, pandas 2.0.3, scikit-learn 1.3.0)',
          packages:
            'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-python-1.1.5-versions.json',
          requiresSpark: false,
          updated: '2023-11-30',
          version: '1.1.5',
        },
      };

      // Act
      const desiredConfig = buildDesiredEnvironmentConfig(existingConfig, 'deleteEnvironment', params);

      // Assert
      expect(desiredConfig.hasGpu).toBe(computeConfig.hasGpu);
      expect(desiredConfig.autopauseThreshold).toBe(computeConfig.autopauseThreshold);
      expect(desiredConfig.computeConfig).toBe(computeConfig);
      expect(desiredConfig.currentRuntimeDetails).toBe(undefined);

      // runtime inner field
      expect(desiredConfig.runtime).toBe(undefined);

      expect(desiredConfig.persistentDisk).toStrictEqual(undefined);
    });

    it('correctly handles keeps a disk when deleting an environment (deleteDiskSelected=false and persistentDiskAttached=true)', () => {
      // Arrange
      const existingModalRuntimeConfig: NormalizedModalRuntime = {
        cloudService: 'GCE',
        toolDockerImage: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-python:1.1.5',
        tool: 'Jupyter',
        region: 'US-CENTRAL1',
        persistentDiskAttached: true,
        zone: 'US-CENTRAL1-A',
        machineType: 'n1-standard-1',
        bootDiskSize: 250,
      };
      const testUri = 'testUri';
      const existingConfig: DesiredModalRuntimeConfig = {
        hasGpu: false,
        autopauseThreshold: 30,
        computeConfig,
        currentRuntimeDetails: undefined,
        runtime: existingModalRuntimeConfig,
        persistentDisk: {
          size: 50,
          diskType: 'pd-standard',
        },
      };

      const params: DesiredEnvironmentParams = {
        desiredRuntimeType: 'Standard VM',
        timeoutInMinutes: 10,
        deleteDiskSelected: false,
        upgradeDiskSelected: false,
        jupyterUserScriptUri: testUri,
        isCustomSelectedImage: false,
        customImageUrl: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-python:1.1.5',
        selectedImage: {
          id: 'terra-jupyter-python',
          url: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-python:1.1.5',
          isCommunity: false,
          isRStudio: false,
          isTerraSupported: true,
          toolLabel: 'Jupyter',
          label: 'Python: (Python 3.10.12, pandas 2.0.3, scikit-learn 1.3.0)',
          packages:
            'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-python-1.1.5-versions.json',
          requiresSpark: false,
          updated: '2023-11-30',
          version: '1.1.5',
        },
      };

      // Act
      const desiredConfig = buildDesiredEnvironmentConfig(existingConfig, 'deleteEnvironment', params);

      // Assert
      expect(desiredConfig.hasGpu).toBe(computeConfig.hasGpu);
      expect(desiredConfig.autopauseThreshold).toBe(computeConfig.autopauseThreshold);
      expect(desiredConfig.computeConfig).toBe(computeConfig);
      expect(desiredConfig.currentRuntimeDetails).toBe(undefined);

      // runtime inner field
      expect(desiredConfig.runtime).toBe(undefined);

      expect(desiredConfig.persistentDisk).toStrictEqual(existingConfig.persistentDisk);
    });

    it('correctly handles the disk upgrade branch', () => {
      // Arrange
      const tempGoogleRuntime = getGoogleRuntime();
      const existingModalRuntimeConfig: NormalizedModalRuntime = {
        cloudService: 'GCE',
        toolDockerImage: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-python:1.1.5',
        tool: 'Jupyter',
        region: 'US-CENTRAL1',
        persistentDiskAttached: true,
        zone: 'US-CENTRAL1-A',
        machineType: 'n1-standard-1',
        bootDiskSize: 250,
      };
      const testUri = 'testUri';
      const gpuConfig = { gpuType: defaultGpuType, numOfGpus: defaultNumGpus };
      const googleRuntime = {
        ...tempGoogleRuntime,
        jupyterUserScriptUri: testUri,
        runtimeConfig: { ...tempGoogleRuntime.runtimeConfig, gpuConfig },
      };
      const existingConfig: DesiredModalRuntimeConfig = {
        hasGpu: false,
        autopauseThreshold: 30,
        computeConfig,
        currentRuntimeDetails: googleRuntime,
        runtime: existingModalRuntimeConfig,
        persistentDisk: {
          size: 50,
          diskType: 'pd-standard',
        },
      };

      const params: DesiredEnvironmentParams = {
        desiredRuntimeType: 'Standard VM',
        timeoutInMinutes: null,
        deleteDiskSelected: false,
        upgradeDiskSelected: true,
        jupyterUserScriptUri: testUri,
        isCustomSelectedImage: false,
        customImageUrl: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-python:1.1.5',
        selectedImage: {
          id: 'terra-jupyter-python',
          url: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-python:1.1.5',
          isCommunity: false,
          isRStudio: false,
          isTerraSupported: true,
          toolLabel: 'Jupyter',
          label: 'Python: (Python 3.10.12, pandas 2.0.3, scikit-learn 1.3.0)',
          packages:
            'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-python-1.1.5-versions.json',
          requiresSpark: false,
          updated: '2023-11-30',
          version: '1.1.5',
        },
      };

      // Act
      const desiredConfig = buildDesiredEnvironmentConfig(existingConfig, 'environmentWarning', params);
      const runtimeConfig = googleRuntime.runtimeConfig;

      // Assert
      expect(desiredConfig.hasGpu).toBe(computeConfig.hasGpu);
      expect(desiredConfig.autopauseThreshold).toBe(googleRuntime?.autopauseThreshold);
      expect(desiredConfig.computeConfig).toBe(computeConfig);
      expect(desiredConfig.currentRuntimeDetails).toBe(googleRuntime);

      // runtime inner field
      expect(desiredConfig.runtime?.cloudService).toBe(runtimeConfig.cloudService);
      expect(desiredConfig.runtime?.region).toBe(computeConfig.computeRegion);
      expect(desiredConfig.runtime?.persistentDiskAttached).toBe(true);
      expect(desiredConfig.runtime?.gpuConfig).toStrictEqual(gpuConfig);
      expect(desiredConfig.runtime?.jupyterUserScriptUri).toBe(testUri);
      expect(desiredConfig.runtime?.toolDockerImage).toBe(params.selectedImage?.url);
      expect(desiredConfig.runtime?.tool).toBe(params.selectedImage?.toolLabel);
      expect(desiredConfig.runtime?.machineType).toBe(computeConfig.masterMachineType);
      // we know the bootdisksize exists on the runtimeconfig here because we made it
      // @ts-expect-error
      expect(desiredConfig.runtime?.bootDiskSize).toBe(runtimeConfig.bootDiskSize);
      expect(desiredConfig.runtime?.diskSize).toBe(undefined);

      // Dataproc fields all undefined
      expect(desiredConfig.runtime?.masterMachineType).toBe(undefined);
      expect(desiredConfig.runtime?.masterDiskSize).toBe(undefined);
      expect(desiredConfig.runtime?.numberOfWorkers).toBe(undefined);
      expect(desiredConfig.runtime?.componentGatewayEnabled).toBe(undefined);
      expect(desiredConfig.runtime?.numberOfPreemptibleWorkers).toBe(undefined);
      expect(desiredConfig.runtime?.workerMachineType).toBe(undefined);
      expect(desiredConfig.runtime?.workerDiskSize).toBe(undefined);

      // Disk
      expect(desiredConfig.persistentDisk).toStrictEqual({
        size: computeConfig.diskSize,
        diskType: computeConfig.diskType,
      });
    });

    it('correctly handles fields when a dataproc runtime is desired (Spark single node) and google runtime exists', () => {
      // Arrange
      const tempGoogleRuntime = getGoogleRuntime();

      const existingModalRuntimeConfig: NormalizedModalRuntime = {
        cloudService: 'GCE',
        toolDockerImage: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-python:1.1.5',
        tool: 'Jupyter',
        region: 'US-CENTRAL1',
        persistentDiskAttached: true,
        zone: 'US-CENTRAL1-A',
        machineType: 'n1-standard-1',
        bootDiskSize: 250,
      };
      const testUri = 'testUri';
      const gpuConfig = { gpuType: defaultGpuType, numOfGpus: defaultNumGpus };
      const googleRuntime = {
        ...tempGoogleRuntime,
        jupyterUserScriptUri: testUri,
        runtimeConfig: { ...tempGoogleRuntime.runtimeConfig, gpuConfig },
      };
      const existingConfig: DesiredModalRuntimeConfig = {
        hasGpu: false,
        autopauseThreshold: 30,
        computeConfig,
        currentRuntimeDetails: googleRuntime,
        runtime: existingModalRuntimeConfig,
        persistentDisk: {
          size: 50,
          diskType: 'pd-standard',
        },
      };

      const params: DesiredEnvironmentParams = {
        desiredRuntimeType: 'Spark single node',
        timeoutInMinutes: 5,
        deleteDiskSelected: false,
        upgradeDiskSelected: false,
        jupyterUserScriptUri: testUri,
        isCustomSelectedImage: false,
        customImageUrl: '',
        selectedImage: {
          id: 'terra-jupyter-hail',
          toolLabel: 'Jupyter',
          url: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-hail:1.0.20',
          label: 'Hail: (Python 3.7.12, Spark 2.4.5, hail 0.2.98)',
          packages:
            'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-hail-1.0.20-versions.json',
          requiresSpark: true,
          updated: '2022-08-25',
          version: '1.0.20',
          isCommunity: false,
          isRStudio: false,
          isTerraSupported: true,
        },
      };

      // Act
      const desiredConfig = buildDesiredEnvironmentConfig(existingConfig, 'environmentWarning', params);

      // Assert
      expect(desiredConfig.hasGpu).toBe(computeConfig.hasGpu);
      expect(desiredConfig.autopauseThreshold).toBe(googleRuntime?.autopauseThreshold);
      expect(desiredConfig.computeConfig).toBe(computeConfig);
      expect(desiredConfig.currentRuntimeDetails).toBe(googleRuntime);

      // runtime inner field
      expect(desiredConfig.runtime?.cloudService).toBe(cloudServiceTypes.DATAPROC);
      expect(desiredConfig.runtime?.region).toBe(computeConfig.computeRegion);
      expect(desiredConfig.runtime?.persistentDiskAttached).toBe(false);
      expect(desiredConfig.runtime?.gpuConfig).toStrictEqual(gpuConfig);
      expect(desiredConfig.runtime?.jupyterUserScriptUri).toBe(testUri);
      expect(desiredConfig.runtime?.timeoutInMinutes).toBe(params.timeoutInMinutes);
      expect(desiredConfig.runtime?.toolDockerImage).toBe(params.selectedImage?.url);
      expect(desiredConfig.runtime?.tool).toBe(params.selectedImage?.toolLabel);

      // GCE vm fields undefined
      expect(desiredConfig.runtime?.machineType).toBe(undefined);
      expect(desiredConfig.runtime?.zone).toBe(undefined);
      expect(desiredConfig.runtime?.bootDiskSize).toBe(undefined);
      expect(desiredConfig.runtime?.diskSize).toBe(undefined);

      // Dataproc fields for single node defined
      expect(desiredConfig.runtime?.masterMachineType).toBe(computeConfig.masterMachineType);
      expect(desiredConfig.runtime?.masterDiskSize).toBe(computeConfig.masterDiskSize);
      expect(desiredConfig.runtime?.numberOfWorkers).toBe(0);
      expect(desiredConfig.runtime?.componentGatewayEnabled).toBe(computeConfig.componentGatewayEnabled);

      // Dataproc fields for cluster undefined
      expect(desiredConfig.runtime?.numberOfPreemptibleWorkers).toBe(undefined);
      expect(desiredConfig.runtime?.workerMachineType).toBe(undefined);
      expect(desiredConfig.runtime?.workerDiskSize).toBe(undefined);

      // Disk
      expect(desiredConfig.persistentDisk).toStrictEqual(existingConfig.persistentDisk);
    });

    it('correctly handles fields when a dataproc runtime is desired (Spark cluster) and google runtime exists', () => {
      // Arrange
      const tempGoogleRuntime = getGoogleRuntime();

      const existingModalRuntimeConfig: NormalizedModalRuntime = {
        cloudService: 'GCE',
        toolDockerImage: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-python:1.1.5',
        tool: 'Jupyter',
        region: 'US-CENTRAL1',
        persistentDiskAttached: true,
        zone: 'US-CENTRAL1-A',
        machineType: 'n1-standard-1',
        bootDiskSize: 250,
      };
      const testUri = 'testUri';
      const gpuConfig = { gpuType: defaultGpuType, numOfGpus: defaultNumGpus };
      const googleRuntime = {
        ...tempGoogleRuntime,
        jupyterUserScriptUri: testUri,
        runtimeConfig: { ...tempGoogleRuntime.runtimeConfig, gpuConfig },
      };
      const existingConfig: DesiredModalRuntimeConfig = {
        hasGpu: false,
        autopauseThreshold: 30,
        computeConfig,
        currentRuntimeDetails: googleRuntime,
        runtime: existingModalRuntimeConfig,
        persistentDisk: {
          size: 50,
          diskType: 'pd-standard',
        },
      };

      const params: DesiredEnvironmentParams = {
        desiredRuntimeType: 'Spark cluster',
        timeoutInMinutes: 5,
        deleteDiskSelected: false,
        upgradeDiskSelected: false,
        jupyterUserScriptUri: testUri,
        isCustomSelectedImage: false,
        customImageUrl: '',
        selectedImage: {
          id: 'terra-jupyter-hail',
          toolLabel: 'Jupyter',
          url: 'us.gcr.io/broad-dsp-gcr-public/terra-jupyter-hail:1.0.20',
          label: 'Hail: (Python 3.7.12, Spark 2.4.5, hail 0.2.98)',
          packages:
            'https://storage.googleapis.com/terra-docker-image-documentation/terra-jupyter-hail-1.0.20-versions.json',
          requiresSpark: true,
          updated: '2022-08-25',
          version: '1.0.20',
          isCommunity: false,
          isRStudio: false,
          isTerraSupported: true,
        },
      };

      // Act
      const desiredConfig = buildDesiredEnvironmentConfig(existingConfig, 'environmentWarning', params);

      // Assert
      expect(desiredConfig.hasGpu).toBe(computeConfig.hasGpu);
      expect(desiredConfig.autopauseThreshold).toBe(googleRuntime?.autopauseThreshold);
      expect(desiredConfig.computeConfig).toBe(computeConfig);
      expect(desiredConfig.currentRuntimeDetails).toBe(googleRuntime);

      // runtime inner field
      expect(desiredConfig.runtime?.cloudService).toBe(cloudServiceTypes.DATAPROC);
      expect(desiredConfig.runtime?.region).toBe(computeConfig.computeRegion);
      expect(desiredConfig.runtime?.persistentDiskAttached).toBe(false);
      expect(desiredConfig.runtime?.gpuConfig).toStrictEqual(gpuConfig);
      expect(desiredConfig.runtime?.jupyterUserScriptUri).toBe(testUri);
      expect(desiredConfig.runtime?.timeoutInMinutes).toBe(params.timeoutInMinutes);
      expect(desiredConfig.runtime?.toolDockerImage).toBe(params.selectedImage?.url);
      expect(desiredConfig.runtime?.tool).toBe(params.selectedImage?.toolLabel);

      // Runtime fields undefined
      expect(desiredConfig.runtime?.machineType).toBe(undefined);
      expect(desiredConfig.runtime?.zone).toBe(undefined);
      expect(desiredConfig.runtime?.bootDiskSize).toBe(undefined);
      expect(desiredConfig.runtime?.diskSize).toBe(undefined);

      // Dataproc fields defined
      expect(desiredConfig.runtime?.masterMachineType).toBe(computeConfig.masterMachineType);
      expect(desiredConfig.runtime?.masterDiskSize).toBe(computeConfig.masterDiskSize);
      expect(desiredConfig.runtime?.numberOfWorkers).toBe(computeConfig.numberOfWorkers);
      expect(desiredConfig.runtime?.componentGatewayEnabled).toBe(computeConfig.componentGatewayEnabled);
      expect(desiredConfig.runtime?.numberOfPreemptibleWorkers).toBe(computeConfig.numberOfPreemptibleWorkers);
      expect(desiredConfig.runtime?.workerMachineType).toBe(computeConfig.workerMachineType);
      expect(desiredConfig.runtime?.workerDiskSize).toBe(computeConfig.workerDiskSize);

      // Disk
      expect(desiredConfig.persistentDisk).toStrictEqual(existingConfig.persistentDisk);
    });
  });
});
