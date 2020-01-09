import validate from 'validate.js'


export const validateWorkflowNameInWorkSpace = (workflowName, selectedWorkspace) => {
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


export const validateWorkflowName = workflowName => {
  return validate({ workflowName }, {
    workflowName: {
      presence: { allowEmpty: false },
      format: {
        pattern: /^[A-Za-z0-9_\-.]*$/,
        message: 'can only contain letters, numbers, underscores, dashes, and periods'
      }
    }
  })
}
