import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary } from 'src/components/common'
import { centeredSpinner } from 'src/components/icons'
import { validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Buckets } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component, Select } from 'src/libs/wrapped-components'
import validate from 'validate.js'


const notebookNameValidator = {
  presence: { allowEmpty: false },
  format: {
    pattern: /^[^#[\]*?]*$/,
    message: 'can\'t contain any of these characters: "#[]*?"'
  }
}

const creatorConstraints = {
  notebookName: notebookNameValidator,
  notebookKernel: { presence: { allowEmpty: false } }
}

const duplicatorConstraints = {
  newName: notebookNameValidator
}

const notebookNameInput = props => div({ style: { margin: '0.5rem 0 1rem' } }, [
  validatedInput(_.merge({
    name: 'notebook name',
    inputProps: {
      autoFocus: true,
      placeholder: 'Enter a name'
    }
  }, props))
])


const baseNotebook = {
  'cells': [
    { 'cell_type': 'code', 'execution_count': null, 'metadata': {}, 'outputs': [], 'source': [] }
  ], 'nbformat': 4, 'nbformat_minor': 2
}

const python2Notebook = _.merge({
  'metadata': {
    'kernelspec': { 'display_name': 'Python 2', 'language': 'python', 'name': 'python2' }
  }
}, baseNotebook)

const python3Notebook = _.merge({
  'metadata': {
    'kernelspec': { 'display_name': 'Python 3', 'language': 'python', 'name': 'python3' }
  }
}, baseNotebook)

const rNotebook = _.merge({
  'metadata': {
    'kernelspec': { 'display_name': 'R', 'language': 'R', 'name': 'ir' },
    'language_info': {
      'codemirror_mode': 'r', 'file_extension': '.r', 'mimetype': 'text/x-r-source', 'name': 'R',
      'pygments_lexer': 'r', 'version': '3.3.3'
    }
  }
}, baseNotebook)


export class NotebookCreator extends Component {
  render() {
    const { modalOpen, notebookName, notebookKernel, creating, nameTouched } = this.state
    const { reloadList, namespace, bucketName } = this.props

    const errors = validate({ notebookName, notebookKernel }, creatorConstraints, { fullMessages: false })

    return h(Fragment, [
      buttonPrimary({
        onClick: () => this.setState({ modalOpen: true, notebookName: '', nameTouched: false, notebookKernel: null }),
        style: { marginLeft: '1rem', display: 'flex' },
        disabled: creating
      },
      creating ?
        [
          centeredSpinner({ size: '1em', style: { color: 'white', marginRight: '1em' } }),
          'Creating Notebook...'
        ] :
        'New Notebook'),
      Utils.cond(
        [
          modalOpen,
          () => h(Modal, {
            onDismiss: () => this.setState({ modalOpen: false }),
            title: 'Create New Notebook',
            okButton: buttonPrimary({
              disabled: errors,
              onClick: () => {
                this.setState({ modalOpen: false, creating: true })
                Buckets.notebook(namespace, bucketName, notebookName).create(notebookKernel.data).then(
                  () => {
                    this.setState({ creating: false })
                    reloadList()
                  },
                  error => {
                    this.setState({ creating: false })
                    reportError('Error creating notebook', error)
                  }
                )
              }
            }, 'Create Notebook')
          }, [
            div({ style: Style.elements.sectionHeader }, 'Name'),
            notebookNameInput({
              errors: nameTouched && errors && errors.notebookName,
              inputProps: {
                value: notebookName,
                onChange: e => this.setState({ notebookName: e.target.value, nameTouched: true })
              }
            }),
            div({ style: Style.elements.sectionHeader }, 'Kernel'),
            h(Select, {
              clearable: false,
              searchable: false,
              wrapperStyle: { marginTop: '0.5rem' },
              placeholder: 'Select a kernel',
              value: notebookKernel,
              onChange: notebookKernel => this.setState({ notebookKernel }),
              options: [
                {
                  value: 'python2',
                  label: 'Python 2',
                  data: python2Notebook
                },
                {
                  value: 'python3',
                  label: 'Python 3',
                  data: python3Notebook
                },
                {
                  value: 'r',
                  label: 'R',
                  data: rNotebook
                }
              ]
            })
          ])
        ],
        () => null
      )
    ])
  }
}

export class NotebookDuplicator extends Component {
  render() {
    const { destroyOld, printName, namespace, bucketName, onDismiss, onSuccess } = this.props
    const { newName, processing, nameTouched } = this.state

    const errors = validate({ newName }, duplicatorConstraints, { fullMessages: false })

    return h(Modal, {
      onDismiss: onDismiss,
      title: `${destroyOld ? 'Rename' : 'Duplicate'} "${printName}"`,
      okButton: buttonPrimary({
        disabled: errors || processing,
        onClick: () => {
          this.setState({ processing: true })
          Buckets.notebook(namespace, bucketName, printName)[destroyOld ? 'rename' : 'copy'](newName).then(
            onSuccess,
            error => reportError(`Error ${destroyOld ? 'renaming' : 'copying'} notebook`, error)
          )
        }
      }, `${destroyOld ? 'Rename' : 'Duplicate'} Notebook`)
    },
    Utils.cond(
      [processing, () => [centeredSpinner()]],
      () => [
        div({ style: Style.elements.sectionHeader }, 'New Name'),
        notebookNameInput({
          errors: nameTouched && errors && errors.newName,
          inputProps: {
            value: newName,
            onChange: e => this.setState({ newName: e.target.value, nameTouched: true })
          }
        })
      ]
    ))
  }
}

export class NotebookDeleter extends Component {
  render() {
    const { printName, namespace, bucketName, onDismiss, onSuccess } = this.props
    const { processing } = this.state

    return h(Modal, {
      onDismiss: onDismiss,
      title: `Delete "${printName}"`,
      okButton: buttonPrimary({
        disabled: processing,
        onClick: () => {
          this.setState({ processing: true })
          Buckets.notebook(namespace, bucketName, printName).delete().then(
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
