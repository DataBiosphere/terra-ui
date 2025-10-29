export const JUPYTERLAB_GCP_FEATURE_ID = 'jupyterlab-gcp';
export const ENABLE_JUPYTERLAB_ID = 'enableJupyterLabGCP';
export const COHORT_BUILDER_CARD = 'cohortBuilderCard';
export const RAS_PROVIDER = 'rasProvider';
export const WORKFLOW_RETRY_WITH_MORE_MEMORY = 'retryWithMoreMemory';

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

  /**
   * Optional date string for the last updated date. Shown on the feature previews page.
   */
  readonly lastUpdated?: string;
};

const featurePreviewsConfig: readonly FeaturePreview[] = [
  {
    id: JUPYTERLAB_GCP_FEATURE_ID,
    title: 'JupyterLab on GCP',
    description: 'Enabling this feature will allow you to launch notebooks using JupyterLab in GCP workspaces.',
    groups: ['preview-jupyterlab-gcp'],
    feedbackUrl: `mailto:dsp-sue@broadinstitute.org?subject=${encodeURIComponent('Feedback on JupyterLab (GCP)')}`,
    lastUpdated: '12/22/2022',
  },
  {
    id: COHORT_BUILDER_CARD,
    title: 'Cohort Builder Card',
    description:
      'Enabling this feature will show the card for the demo cohort builder in the Datasets tab in the Library.',
    groups: ['CohortBuilderUsers'],
    feedbackUrl: `mailto:dsp-data-exploration@broadinstitute.org?subject=${encodeURIComponent(
      'Feedback on Cohort Builder Card'
    )}`,
    lastUpdated: '7/25/2024',
  },
  {
    id: RAS_PROVIDER,
    title: 'RAS Integration with Terra',
    description: 'Enables the NIH Researcher Authentication Service (RAS) as an external identity provider.',
    groups: ['preview-ras-provider'],
    feedbackUrl: 'https://support.terra.bio/hc/en-us/articles/32634034451099',
    lastUpdated: '6/26/2025',
  },
  {
    id: WORKFLOW_RETRY_WITH_MORE_MEMORY,
    title: 'Retry Workflow Tasks with More Memory',
    description:
      'Opt-in to enable access to the Retry with More Memory workflow submission setting. This setting currently works best for Java tasks that are killed by the JVM when using too much memory, see the documentation for more details.',
    feedbackUrl: `mailto:dsp-analysis@broadinstitute.org?subject=${encodeURIComponent(
      'Retry with More Memory Feedback'
    )}`,
    documentationUrl:
      'https://support.terra.bio/hc/en-us/articles/39412460844699-Automatically-retrying-workflows-with-more-memory',
    lastUpdated: '8/8/2025',
  },
];

export default featurePreviewsConfig;
