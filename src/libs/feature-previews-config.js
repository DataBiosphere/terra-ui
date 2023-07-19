export const JUPYTERLAB_GCP_FEATURE_ID = 'jupyterlab-gcp';
export const ENABLE_JUPYTERLAB_ID = 'enableJupyterLabGCP';
export const HAIL_BATCH_AZURE_FEATURE_ID = 'hail-batch-azure';
export const WORKFLOWS_TAB_AZURE_FEATURE_ID = 'workflows-tab-azure';
export const FIND_WORKFLOWS_AZURE_FEATURE_ID = 'find-workflows-azure';

const featurePreviewsConfig = [
  {
    id: 'data-table-versioning',
    title: 'Data Table Versioning',
    description:
      'Enabling this feature will allow you to save uniquely named versions of data tables. These saved versions will appear in the Data tab and can be restored at any time.',
    groups: ['preview-data-versioning-and-provenance'],
    feedbackUrl: `mailto:dsp-sue@broadinstitute.org?subject=${encodeURIComponent('Feedback on data table versioning')}`,
    order: 1,
  },
  {
    id: 'data-table-provenance',
    title: 'Data Table Provenance',
    description: 'Enabling this feature will allow you to view information about the workflow that generated data table columns and files.',
    groups: ['preview-data-versioning-and-provenance'],
    feedbackUrl: `mailto:dsp-sue@broadinstitute.org?subject=${encodeURIComponent('Feedback on data table provenance')}`,
    order: 2,
  },
  {
    id: JUPYTERLAB_GCP_FEATURE_ID,
    title: 'JupyterLab on GCP',
    description: 'Enabling this feature will allow you to launch notebooks using JupyterLab in GCP workspaces.',
    groups: ['preview-jupyterlab-gcp'],
    feedbackUrl: `mailto:dsp-sue@broadinstitute.org?subject=${encodeURIComponent('Feedback on JupyterLab (GCP)')}`,
    order: 3,
  },
  {
    id: 'workspace-files',
    title: 'Workspace Files Browser',
    description: 'Enabling this feature will allow you to use the new workspace files browser.',
    groups: ['preview-workspace-files'],
    feedbackUrl: `mailto:dsp-sue@broadinstitute.org?subject=${encodeURIComponent('Feedback on workspace files browser')}`,
    order: 4,
  },
  {
    id: HAIL_BATCH_AZURE_FEATURE_ID,
    title: 'Hail Batch App on Azure',
    description: 'Enabling this feature will allow you to launch the Hail Batch app in Azure workspaces.',
    groups: ['preview-hail-batch-azure'],
    feedbackUrl: `mailto:dsp-sue@broadinstitute.org?subject=${encodeURIComponent('Feedback on Hail Batch (Azure)')}`,
    order: 5,
  },
  {
    id: WORKFLOWS_TAB_AZURE_FEATURE_ID,
    title: 'Workflows Tab for Azure workspaces',
    description: 'Enabling this feature will allow you to launch workflows in Azure workspaces.',
    feedbackUrl: `mailto:dsp-sue@broadinstitute.org?subject=${encodeURIComponent('Feedback on Workflows Tab (Azure)')}`,
    order: 6,
  },
  {
    id: FIND_WORKFLOWS_AZURE_FEATURE_ID,
    title: 'Find Workflows for Azure workspaces',
    description: 'Enabling this feature will allow you to find and import new workflows in Azure workspaces.',
    feedbackUrl: `mailto:dsp-sue@broadinstitute.org?subject=${encodeURIComponent('Feedback on Find Workflows (Azure)')}`,
    order: 7,
  },
];

export default featurePreviewsConfig;
