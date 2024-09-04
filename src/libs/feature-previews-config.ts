export const JUPYTERLAB_GCP_FEATURE_ID = 'jupyterlab-gcp';
export const ENABLE_JUPYTERLAB_ID = 'enableJupyterLabGCP';
export const HAIL_BATCH_AZURE_FEATURE_ID = 'hail-batch-azure';
export const ENABLE_AZURE_PFB_IMPORT = 'enableAzurePfbImport';
export const ENABLE_AZURE_TDR_IMPORT = 'enableAzureTdrImport';
export const FIRECLOUD_UI_MIGRATION = 'firecloudUiMigration';
export const AXIN_DATASET_CARD = 'axinDatasetCard';
export const GCP_BUCKET_LIFECYCLE_RULES = 'gcpBucketLifecycleRules';

// If the groups option is defined for a FeaturePreview, it must contain at least one group.
type GroupsList = readonly [string, ...string[]];

export type FeaturePreview = {
  /**
   * ID for the feature. This is used to check if the feature is enabled and to toggle it enabled/disabled.
   */
  readonly id: string;

  /**
   * Name of the feature. Shown on the feature previews page.
   */
  readonly title: string;

  /**
   * Description for the feature. Shown on the feature previews page.
   */
  readonly description: string;

  /**
   * Optional list of groups. If specified, the feature will only appear on the feature previews page
   * for users that are a member of at least one of the specified groups.
   * This only applies in production. In dev environments, all features are available to all users.
   */
  readonly groups?: GroupsList;

  /**
   * Optional URL for feature documentation. Shown on the feature previews page.
   */
  readonly documentationUrl?: string;

  /**
   * Optional URL for users to provide feedback on the feature. Shown on the feature previews page.
   */
  readonly feedbackUrl?: string;
};

const featurePreviewsConfig: readonly FeaturePreview[] = [
  {
    id: 'data-table-versioning',
    title: 'Data Table Versioning',
    description:
      'Enabling this feature will allow you to save uniquely named versions of data tables. These saved versions will appear in the Data tab and can be restored at any time.',
    groups: ['preview-data-versioning-and-provenance'],
    feedbackUrl: `mailto:dsp-sue@broadinstitute.org?subject=${encodeURIComponent('Feedback on data table versioning')}`,
  },
  {
    id: 'data-table-provenance',
    title: 'Data Table Provenance',
    description:
      'Enabling this feature will allow you to view information about the workflow that generated data table columns and files.',
    groups: ['preview-data-versioning-and-provenance'],
    feedbackUrl: `mailto:dsp-sue@broadinstitute.org?subject=${encodeURIComponent('Feedback on data table provenance')}`,
  },
  {
    id: JUPYTERLAB_GCP_FEATURE_ID,
    title: 'JupyterLab on GCP',
    description: 'Enabling this feature will allow you to launch notebooks using JupyterLab in GCP workspaces.',
    groups: ['preview-jupyterlab-gcp'],
    feedbackUrl: `mailto:dsp-sue@broadinstitute.org?subject=${encodeURIComponent('Feedback on JupyterLab (GCP)')}`,
  },
  {
    id: 'workspace-files',
    title: 'Workspace Files Browser',
    description: 'Enabling this feature will allow you to use the new workspace files browser.',
    groups: ['preview-workspace-files'],
    feedbackUrl: `mailto:dsp-sue@broadinstitute.org?subject=${encodeURIComponent(
      'Feedback on workspace files browser'
    )}`,
  },
  {
    id: HAIL_BATCH_AZURE_FEATURE_ID,
    title: 'Hail Batch App on Azure',
    description: 'Enabling this feature will allow you to launch the Hail Batch app in Azure workspaces.',
    groups: ['preview-hail-batch-azure'],
    feedbackUrl: `mailto:dsp-sue@broadinstitute.org?subject=${encodeURIComponent('Feedback on Hail Batch (Azure)')}`,
  },
  {
    id: ENABLE_AZURE_PFB_IMPORT,
    title: 'Azure PFB Import',
    description: 'Enabling this feature will allow PFB import into Azure workspaces.',
    groups: ['preview-azure-pfb-import'],
    feedbackUrl: `mailto:dsp-analysis-journeys@broadinstitute.org?subject=${encodeURIComponent(
      'Feedback on Azure PFB Import'
    )}`,
  },
  {
    id: ENABLE_AZURE_TDR_IMPORT,
    title: 'Azure TDR Import',
    description: 'Enabling this feature will allow importing TDR snapshots into Azure workspaces.',
    groups: ['preview-azure-tdr-import'],
    feedbackUrl: `mailto:dsp-analysis-journeys@broadinstitute.org?subject=${encodeURIComponent(
      'Feedback on Azure TDR snapshot Import'
    )}`,
  },
  {
    id: FIRECLOUD_UI_MIGRATION,
    title: 'Firecloud UI Feature Migration',
    description: 'Enabling this feature will update replaceable links to Firecloud UI with new links to Terra UI',
    feedbackUrl: `mailto:dsp-workflow-management@broadinstitute.org?subject=${encodeURIComponent(
      'Feedback on deprecating Firecloud UI'
    )}`,
  },
  {
    id: AXIN_DATASET_CARD,
    title: 'AXIN Dataset Card',
    description: 'Enabling this feature will show the card for AnalytiXIN in the Datasets tab in the Library.',
    feedbackUrl: `mailto:dsp-data-exploration@broadinstitute.org?subject=${encodeURIComponent(
      'Feedback on Axin Dataset Card'
    )}`,
  },
  {
    id: GCP_BUCKET_LIFECYCLE_RULES,
    title: 'GCP Workspace Bucket Lifecycle Rules',
    description:
      'Enabling this feature will allow GCP bucket lifecycle rules to be set via the Workspace Settings dialog.',
    feedbackUrl: `mailto:dsp-workspaces@broadinstitute.org?subject=${encodeURIComponent(
      'Feedback on GCP Bucket Lifecycle Rules'
    )}`,
  },
];

export default featurePreviewsConfig;
