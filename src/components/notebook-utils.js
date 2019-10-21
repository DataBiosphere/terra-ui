import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component, Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer, Select, spinnerOverlay } from 'src/components/common'
import { centeredSpinner } from 'src/components/icons'
import { ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax, ajaxCaller } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import validate from 'validate.js'


export const notebookLockHash = async (bucketName, email) => {
  const msgUint8 = new TextEncoder().encode(`${bucketName}:${email}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = new Uint8Array(hashBuffer)
  return _.flow(
    _.map(v => v.toString(16).padStart(2, '0')),
    _.join('')
  )(hashArray)
}

export const findPotentialNotebookLockers = async ({ canShare, namespace, wsName, bucketName }) => {
  if (canShare) {
    const { acl } = await Ajax().Workspaces.workspace(namespace, wsName).getAcl()
    const potentialLockers = _.flow(
      _.toPairs,
      _.map(([email, data]) => ({ email, ...data })),
      _.filter(({ accessLevel }) => Utils.hasAccessLevel('WRITER', accessLevel))
    )(acl)
    const lockHolderPromises = _.map(async ({ email }) => ({ [await notebookLockHash(bucketName, email)]: email }), potentialLockers)
    return _.mergeAll(await Promise.all(lockHolderPromises))
  } else {
    return {}
  }
}

export const notebookNameValidator = existing => ({
  presence: { allowEmpty: false },
  format: {
    pattern: /^[^@#$%*+=?,[\]:;/\\]*$/,
    message: 'can\'t contain these characters: @ # $ % * + = ? , [ ] : ; / \\ '
  },
  exclusion: {
    within: existing,
    message: 'already exists'
  }
})

export const notebookNameInput = props => h(ValidatedInput, _.merge({
  inputProps: {
    autoFocus: true,
    placeholder: 'Enter a name'
  }
}, props))


const baseNotebook = {
  cells: [
    { cell_type: 'code', execution_count: null, metadata: {}, outputs: [], source: [] }
  ], nbformat: 4, nbformat_minor: 2
}

const notebookData = {
  python2: _.merge({
    metadata: {
      kernelspec: { display_name: 'Python 2', language: 'python', name: 'python2' }
    }
  }, baseNotebook),
  python3: _.merge({
    metadata: {
      kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' }
    }
  }, baseNotebook),
  r: _.merge({
    metadata: {
      kernelspec: { display_name: 'R', language: 'R', name: 'ir' },
      language_info: {
        codemirror_mode: 'r', file_extension: '.r', mimetype: 'text/x-r-source', name: 'R',
        pygments_lexer: 'r', version: '3.3.3'
      }
    }
  }, baseNotebook)
}


export const NotebookCreator = class NotebookCreator extends Component {
  static propTypes = {
    reloadList: PropTypes.func.isRequired,
    onDismiss: PropTypes.func.isRequired,
    namespace: PropTypes.string.isRequired,
    bucketName: PropTypes.string.isRequired,
    existingNames: PropTypes.arrayOf(PropTypes.string).isRequired
  }

  constructor(props) {
    super(props)
    this.state = { notebookName: '' }
  }

  render() {
    const { notebookName, notebookKernel, creating, nameTouched } = this.state
    const { reloadList, onDismiss, namespace, bucketName, existingNames } = this.props

    const errors = validate(
      { notebookName, notebookKernel },
      {
        notebookName: notebookNameValidator(existingNames),
        notebookKernel: { presence: { allowEmpty: false } }
      },
      { prettify: v => ({ notebookName: 'Name', notebookKernel: 'Language' }[v] || validate.prettify(v)) }
    )

    return h(Modal, {
      onDismiss,
      title: 'Create New Notebook',
      okButton: h(ButtonPrimary, {
        disabled: creating || errors,
        tooltip: Utils.summarizeErrors(errors),
        onClick: async () => {
          this.setState({ creating: true })
          try {
            await Ajax().Buckets.notebook(namespace, bucketName, notebookName).create(notebookData[notebookKernel])
            reloadList()
            onDismiss()
          } catch (error) {
            await reportError('Error creating notebook', error)
            onDismiss()
          }
        }
      }, 'Create Notebook')
    }, [
      h(IdContainer, [id => h(Fragment, [
        h(FormLabel, { htmlFor: id, required: true }, ['Name']),
        notebookNameInput({
          error: Utils.summarizeErrors(nameTouched && errors && errors.notebookName),
          inputProps: {
            id, value: notebookName,
            onChange: v => this.setState({ notebookName: v, nameTouched: true })
          }
        })
      ])]),
      h(IdContainer, [id => h(Fragment, [
        h(FormLabel, { htmlFor: id, required: true }, ['Language']),
        h(Select, {
          id, isSearchable: false,
          placeholder: 'Select a language',
          getOptionLabel: ({ value }) => _.startCase(value),
          value: notebookKernel,
          onChange: ({ value: notebookKernel }) => this.setState({ notebookKernel }),
          options: ['python2', 'python3', 'r']
        })
      ])]),
      creating && spinnerOverlay
    ])
  }
}

export const NotebookDuplicator = ajaxCaller(class NotebookDuplicator extends Component {
  static propTypes = {
    destroyOld: PropTypes.bool,
    fromLauncher: PropTypes.bool,
    wsName: PropTypes.string,
    printName: PropTypes.string.isRequired,
    namespace: PropTypes.string.isRequired,
    bucketName: PropTypes.string.isRequired,
    onDismiss: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired
  }

  static defaultProps = {
    destroyOld: false,
    fromLauncher: false
  }

  constructor(props) {
    super(props)
    this.state = { newName: '', existingNames: [] }
  }

  async componentDidMount() {
    const { ajax: { Buckets }, namespace, bucketName } = this.props
    const existingNotebooks = await Buckets.listNotebooks(namespace, bucketName)
    const existingNames = _.map(({ name }) => name.slice(10, -6), existingNotebooks)
    this.setState({ existingNames })
  }

  render() {
    const { destroyOld, fromLauncher, printName, wsName, namespace, bucketName, onDismiss, onSuccess } = this.props
    const { newName, processing, nameTouched, existingNames } = this.state

    const errors = validate(
      { newName },
      { newName: notebookNameValidator(existingNames) },
      { prettify: v => ({ newName: 'Name' }[v] || validate.prettify(v)) }
    )

    return h(Modal, {
      onDismiss,
      title: `${destroyOld ? 'Rename' : 'Copy'} "${printName}"`,
      okButton: h(ButtonPrimary, {
        disabled: errors || processing,
        tooltip: Utils.summarizeErrors(errors),
        onClick: async () => {
          try {
            this.setState({ processing: true })
            await (destroyOld ?
              Ajax().Buckets.notebook(namespace, bucketName, printName).rename(newName) :
              Ajax().Buckets.notebook(namespace, bucketName, printName).copy(newName, bucketName, !destroyOld))
            onSuccess()
            if (fromLauncher) {
              Nav.goToPath('workspace-notebook-launch', {
                namespace, name: wsName, notebookName: newName + '.ipynb'
              })
            }
          } catch (error) {
            reportError(`Error ${destroyOld ? 'renaming' : 'copying'} notebook`, error)
          }
        }
      }, `${destroyOld ? 'Rename' : 'Copy'} Notebook`)
    },
    Utils.cond(
      [processing, () => [centeredSpinner()]],
      () => [
        h(IdContainer, [id => h(Fragment, [
          h(FormLabel, { htmlFor: id, required: true }, ['New Name']),
          notebookNameInput({
            error: Utils.summarizeErrors(nameTouched && errors && errors.newName),
            inputProps: {
              id, value: newName,
              onChange: v => this.setState({ newName: v, nameTouched: true })
            }
          })
        ])])
      ]
    ))
  }
})

export const NotebookDeleter = class NotebookDeleter extends Component {
  static propTypes = {
    printName: PropTypes.string.isRequired,
    namespace: PropTypes.string.isRequired,
    bucketName: PropTypes.string.isRequired,
    onDismiss: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    this.state = { processing: false }
  }

  render() {
    const { printName, namespace, bucketName, onDismiss, onSuccess } = this.props
    const { processing } = this.state

    return h(Modal, {
      onDismiss,
      title: `Delete "${printName}"`,
      okButton: h(ButtonPrimary, {
        disabled: processing,
        onClick: () => {
          this.setState({ processing: true })
          Ajax().Buckets.notebook(namespace, bucketName, printName).delete().then(
            onSuccess,
            error => reportError('Error deleting notebook', error)
          )
        }
      }, 'Delete Notebook')
    },
    Utils.cond(
      [processing, () => [centeredSpinner()]],
      () => [
        div({ style: { fontSize: '1rem', flexGrow: 1 } },
          [
            `Are you sure you want to delete "${printName}"?`,
            div({ style: { fontWeight: 500, lineHeight: '2rem' } }, 'This cannot be undone.')
          ]
        )
      ]
    ))
  }
}
