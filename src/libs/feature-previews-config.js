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
    id: 'workspace-files',
    title: 'Workspace Files Browser',
    description: 'Enabling this feature will allow you to use the new workspace files browser.',
    groups: ['preview-workspace-files'],
    feedbackUrl: `mailto:dsp-sue@broadinstitute.org?subject=${encodeURIComponent('Feedback on workspace files browser')}`
  }
]

export default featurePreviewsConfig
