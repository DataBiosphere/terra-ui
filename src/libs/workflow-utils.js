import validate from 'validate.js'


const workflowNameValidation = () => {
  return ({
    presence: { allowEmpty: false },
    format: {
      pattern: /^[A-Za-z0-9_\-.]*$/,
      message: 'can only contain letters, numbers, underscores, dashes, and periods'
    }
  })
}

export const validateWorkflowNameWithWorkSpace = (workflowName, selectedWorkspace) => {
  return validate({ workflowName, selectedWorkspace }, {
    selectedWorkspace: { presence: true },
    workflowName: workflowNameValidation()
  })
}

export const validateWorkflowName = workflowName => {
  return validate({ workflowName }, {
    workflowName: workflowNameValidation()
  })
}
