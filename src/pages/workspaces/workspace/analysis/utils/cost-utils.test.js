import { pdTypes } from "src/libs/ajax/leonardo/models/disk-models";
import { getAzurePricesForRegion } from "src/libs/azure-utils";
import {
  azureDisk,
  azureRuntime,
  galaxyDisk,
  galaxyRunning,
  getDisk,
  getGoogleRuntime,
  getJupyterRuntimeConfig,
} from "src/pages/workspaces/workspace/analysis/_testData/testData";
import {
  getCostDisplayForDisk,
  getCostDisplayForTool,
  getPersistentDiskCostMonthly,
  getRuntimeCost,
  runtimeConfigCost,
} from "src/pages/workspaces/workspace/analysis/utils/cost-utils";
import { cloudProviders } from "src/pages/workspaces/workspace/analysis/utils/runtime-utils";
import { appToolLabels, runtimeToolLabels } from "src/pages/workspaces/workspace/analysis/utils/tool-utils";

const defaultSparkSingleNode = {
  cloudService: "DATAPROC",
  autopauseThreshold: 30,
  region: "US-CENTRAL1",
  masterMachineType: "n1-standard-4",
  masterDiskSize: 150,
  numberOfWorkers: 0,
  componentGatewayEnabled: true,
  numberOfPreemptibleWorkers: 0,
  workerDiskSize: 0,
  workerPrivateAccess: false,
};

const defaultSparkCluster = {
  cloudService: "DATAPROC",
  autopauseThreshold: 30,
  region: "US-CENTRAL1",
  masterMachineType: "n1-standard-4",
  masterDiskSize: 150,
  numberOfWorkers: 2,
  componentGatewayEnabled: true,
  numberOfPreemptibleWorkers: 0,
  workerMachineType: "n1-standard-4",
  workerDiskSize: 150,
  workerPrivateAccess: false,
};

describe("getCostDisplayForDisk", () => {
  it("GCP - will get the disk cost for a Galaxy AppDataDisk", () => {
    // Arrange
    const app = galaxyRunning;
    const appDataDisks = [galaxyDisk];
    const computeRegion = "US-CENTRAL1";
    const currentRuntimeTool = undefined;
    const persistentDisks = [];
    const runtimes = [];
    const toolLabel = appToolLabels.GALAXY;
    const expectedResult = "Disk $0.04/hr";

    // Act
    const result = getCostDisplayForDisk(app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel);

    // Assert
    expect(result).toBe(expectedResult);
  });

  it("GCP - will get the disk cost for a Jupyter Persistent Disk", () => {
    // Arrange
    const jupyterDisk = getDisk();
    const jupyterRuntime = getGoogleRuntime({
      runtimeConfig: getJupyterRuntimeConfig({ diskId: jupyterDisk.id }),
    });
    const app = undefined;
    const appDataDisks = [];
    const computeRegion = "US-CENTRAL1";
    const currentRuntimeTool = runtimeToolLabels.Jupyter;
    const persistentDisks = [jupyterDisk];
    const runtimes = [jupyterRuntime];
    const toolLabel = runtimeToolLabels.Jupyter;
    const expectedResult = "Disk < $0.01/hr";

    // Act
    const result = getCostDisplayForDisk(app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel);

    // Assert
    expect(result).toBe(expectedResult);
  });

  it("Will return empty string because when there is no app or runtime to get cost information from.", () => {
    // Arrange
    const app = undefined;
    const appDataDisks = [];
    const computeRegion = "US-CENTRAL1";
    const currentRuntimeTool = undefined;
    const persistentDisks = [];
    const runtimes = [];
    const toolLabel = "";
    const expectedResult = "";

    // Act
    const result = getCostDisplayForDisk(app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel);

    // Assert
    expect(result).toBe(expectedResult);
  });

  it("GCP - will return empty string because toolLabel and currentRuntimeTool are not equal.", () => {
    // Arrange
    const app = undefined;
    const appDataDisks = [];
    const computeRegion = "US-CENTRAL1";
    const currentRuntimeTool = runtimeToolLabels.Jupyter;
    const persistentDisks = [];
    const runtimes = [];
    const toolLabel = runtimeToolLabels.RStudio;
    const expectedResult = "";

    // Act
    const result = getCostDisplayForDisk(app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel);

    // Assert
    expect(result).toBe(expectedResult);
  });

  it("GCP - will return blank string because cost is 0 due to deleting disk.", () => {
    // Arrange
    const jupyterDisk = getDisk();
    const jupyterRuntime = getGoogleRuntime({
      runtimeConfig: getJupyterRuntimeConfig({ diskId: jupyterDisk.id }),
    });
    const app = undefined;
    const appDataDisks = [];
    const computeRegion = "US-CENTRAL1";
    const currentRuntimeTool = runtimeToolLabels.Jupyter;
    const persistentDisks = [{ ...jupyterDisk, status: "Deleting" }];
    const runtimes = [jupyterRuntime];
    const toolLabel = runtimeToolLabels.Jupyter;
    const expectedResult = "";

    // Act
    const result = getCostDisplayForDisk(app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel);

    // Assert
    expect(result).toBe(expectedResult);
  });

  //  ---- Azure ----
  it("Azure - will get the disk cost display for an Azure disk.", () => {
    // Arrange
    const app = undefined;
    const appDataDisks = [];
    const computeRegion = "eastus";
    const currentRuntimeTool = runtimeToolLabels.JupyterLab;
    const persistentDisks = [azureDisk];
    const runtimes = [azureRuntime];
    const toolLabel = runtimeToolLabels.Jupyter;
    const expectedResult = "Disk < $0.01/hr";

    // Act
    const result = getCostDisplayForDisk(app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel);
    // Act
    getCostDisplayForDisk(azureRuntime);

    // Assert
    expect(result).toBe(expectedResult);
  });
});

describe("GCP getCostDisplayForTool", () => {
  it("Will get compute cost and compute status for Galaxy app", () => {
    // Arrange
    const expectedResult = "Running $0.53/hr";
    const app = galaxyRunning;
    const currentRuntime = undefined;
    const currentRuntimeTool = undefined;
    const toolLabel = appToolLabels.GALAXY;

    // Act
    const result = getCostDisplayForTool(app, currentRuntime, currentRuntimeTool, toolLabel);

    // Assert
    expect(result).toBe(expectedResult);
  });

  it("Will get compute cost and compute status for a running Jupyter runtime", () => {
    // Arrange
    const expectedResult = "Running $0.06/hr";
    const app = undefined;
    const currentRuntime = getGoogleRuntime({
      runtimeConfig: getJupyterRuntimeConfig(),
    });
    const currentRuntimeTool = runtimeToolLabels.Jupyter;
    const toolLabel = runtimeToolLabels.Jupyter;

    // Act
    const result = getCostDisplayForTool(app, currentRuntime, currentRuntimeTool, toolLabel);

    // Assert
    expect(result).toBe(expectedResult);
  });

  it("Will get compute cost and compute status for a stopped Jupyter runtime", () => {
    // Arrange
    const expectedResult = "Paused < $0.01/hr";
    const app = undefined;
    const jupyterRuntime = getGoogleRuntime({
      runtimeConfig: getJupyterRuntimeConfig(),
    });
    const currentRuntime = { ...jupyterRuntime, status: "Stopped" };
    const currentRuntimeTool = runtimeToolLabels.Jupyter;
    const toolLabel = runtimeToolLabels.Jupyter;

    // Act
    const result = getCostDisplayForTool(app, currentRuntime, currentRuntimeTool, toolLabel);

    // Assert
    expect(result).toBe(expectedResult);
  });

  it("Will return blank because current runtime is not equal to currentRuntimeTool", () => {
    // Arrange
    const expectedResult = "";
    const app = undefined;
    const currentRuntime = getGoogleRuntime({
      runtimeConfig: getJupyterRuntimeConfig(),
    });
    const currentRuntimeTool = runtimeToolLabels.RStudio;
    const toolLabel = runtimeToolLabels.Jupyter;

    // Act
    const result = getCostDisplayForTool(app, currentRuntime, currentRuntimeTool, toolLabel);

    // Assert
    expect(result).toBe(expectedResult);
  });
});

describe("getRuntimeCost", () => {
  it("Azure - will get runtime cost", () => {
    // Arrange
    const runtime = azureRuntime;

    // Act
    const result = getRuntimeCost(runtime);

    // Assert
    expect(result).toBeGreaterThan(0);
  });

  it("GCP - Will return 0 if runtime is in error", () => {
    // Arrange
    const runtime = getGoogleRuntime({
      runtimeConfig: getJupyterRuntimeConfig(),
      status: "Error",
    });

    // Act
    const result = getRuntimeCost(runtime);

    // Assert
    expect(result).toBe(0.0);
  });
});

describe("getCostDisplayForTool", () => {
  it("Azure - will get compute cost and compute status for a running Azure JupyterLab runtime", () => {
    // Arrange
    const app = undefined;
    const currentRuntime = azureRuntime;
    const currentRuntimeTool = runtimeToolLabels.JupyterLab;
    const toolLabel = runtimeToolLabels.JupyterLab;

    // Act
    const result = getCostDisplayForTool(app, currentRuntime, currentRuntimeTool, toolLabel);

    // Assert
    expect(result).toContain("Running"); // Costs may change, but we want to make sure the status prints correctly.
  });

  it("Will get blank compute cost due to no runtime.", () => {
    // Arrange
    const app = undefined;
    const currentRuntime = undefined;
    const currentRuntimeTool = runtimeToolLabels.JupyterLab;
    const toolLabel = runtimeToolLabels.JupyterLab;

    // Act
    const result = getCostDisplayForTool(app, currentRuntime, currentRuntimeTool, toolLabel);

    // Assert
    expect(result).toBe("");
  });
});

describe("getPersistentDiskCostMonthly", () => {
  it("GCP - Cost estimate", () => {
    // Arrange
    const cloudContext = { cloudProvider: cloudProviders.gcp.label };

    // Act
    const result = getPersistentDiskCostMonthly({ cloudContext, size: 50, diskType: pdTypes.standard }, "US-CENTRAL1");

    // Assert
    expect(result).not.toBe(NaN); // Seems excessive to check the math, we really just want to see that it calculates a number.
  });

  // TODO: Need disk types for Azure
  it("Azure - Standard disk smallest size cost estimate", () => {
    // Arrange
    const cloudContext = { cloudProvider: cloudProviders.azure.label };

    // Act
    const result = getPersistentDiskCostMonthly({ cloudContext, size: 50, zone: "eastus" });

    // Assert
    expect(result).toBe(getAzurePricesForRegion("eastus")["S6 LRS"]);
  });
});

describe("runtimeConfigCost for dataproc", () => {
  it("gets cost for a dataproc cluster", () => {
    // Act
    const result = runtimeConfigCost(defaultSparkCluster);
    // Assert
    expect(result).toBeGreaterThan(0);
  });
  it("gets cost for single node cluster", () => {
    // Act
    const result = runtimeConfigCost(defaultSparkSingleNode);

    // Assert
    expect(result).toBeGreaterThan(0);
  });
});
