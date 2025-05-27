export const JUPYTERLAB_GCP_FEATURE_ID = 'jupyterlab-gcp';
export const ENABLE_JUPYTERLAB_ID = 'enableJupyterLabGCP';
export const COHORT_BUILDER_CARD = 'cohortBuilderCard';

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
];

export default featurePreviewsConfig;
