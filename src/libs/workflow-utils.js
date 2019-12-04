import validate from 'validate.js'


export const validateWorkflowName = (workflowName, selectedWorkspace) => {
  return validate({ workflowName, selectedWorkspace }, {
    selectedWorkspace: { presence: true },
    workflowName: {
      presence: { allowEmpty: false },
      format: {
        pattern: /^[A-Za-z0-9_\-.]*$/,
        message: 'can only contain letters, numbers, underscores, dashes, and periods'
      }
    }
  })
}
