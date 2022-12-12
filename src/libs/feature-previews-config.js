const featurePreviewsConfig = [
  {
    id: 'data-table-versioning',
    title: 'Data Table Versioning',
    description: 'Enabling this feature will allow you to save uniquely named versions of data tables. These saved versions will appear in the Data tab and can be restored at any time.',
    groups: ['preview-data-versioning-and-provenance'],
    feedbackUrl: `mailto:dsp-sue@broadinstitute.org?subject=${encodeURIComponent('Feedback on data table versioning')}`
  },
  {
    id: 'data-table-provenance',
    title: 'Data Table Provenance',
    description: 'Enabling this feature will allow you to view information about the workflow that generated data table columns and files.',
    groups: ['preview-data-versioning-and-provenance'],
    feedbackUrl: `mailto:dsp-sue@broadinstitute.org?subject=${encodeURIComponent('Feedback on data table provenance')}`
  },
  {
    id: 'workspace-data-service',
    title: 'Workspace Data Service (WDS) on Azure',
    description: 'Enabling this feature will enable WDS-powered data tables.',
    groups: ['preview-wds-on-azure'],
    feedbackUrl: `mailto:dsp-analysis-journeys@broadinstitute.org?subject=${encodeURIComponent('Feedback on WDS UI')}`
  },
  {
    id: 'jupyterlab-gcp',
    title: 'JupyterLab on GCP',
    description: 'Enabling this feature will allow you to launch notebooks using JupyterLab in GCP workspaces.',
    groups: ['preview-jupyterlab-gcp'],
    feedbackUrl: `mailto:dsp-sue@broadinstitute.org?subject=${encodeURIComponent('Feedback on JupyterLab (GCP)')}`
  },
  {
    id: 'workspace-files',
    title: 'Workspace Files Browser',
    description: 'Enabling this feature will allow you to use the new workspace files browser.',
    groups: ['preview-workspace-files'],
    feedbackUrl: `mailto:dsp-sue@broadinstitute.org?subject=${encodeURIComponent('Feedback on workspace files browser')}`
  }
]

export default featurePreviewsConfig
