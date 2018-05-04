import _ from 'lodash'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary } from 'src/components/common'
import { spinner } from 'src/components/icons'
import { validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Buckets } from 'src/libs/ajax'
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

const notebookNameInput = (props) => div({ style: { margin: '0.5rem 0 1rem' } }, [
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
    const { modalOpen, notebookName, notebookKernel, notebookFailure, creating, nameTouched } = this.state
    const { reloadList, namespace, bucketName } = this.props

    const nameErrors = validate.single(notebookName, notebookNameValidator)

    return h(Fragment, [
      buttonPrimary({
          onClick: () => this.setState({ modalOpen: true, notebookName: '', nameTouched: false, notebookKernel: null }),
          style: { marginLeft: '1rem', display: 'flex' },
          disabled: creating
        },
        creating ?
          [
            spinner({ size: '1em', style: { color: 'white', marginRight: '1em' } }),
            'Creating Notebook...'
          ] :
          'New Notebook'),
      Utils.cond(
        [
          notebookFailure,
          () => h(Modal, {
            title: 'Notebook Creation Failure',
            okButton: buttonPrimary({ onClick: () => this.setState({ notebookFailure: null }) },
              'Done'),
            showCancel: false
          }, notebookFailure)
        ],
        [
          modalOpen,
          () => h(Modal, {
            onDismiss: () => this.setState({ modalOpen: false }),
            title: 'Create New Notebook',
            okButton: buttonPrimary({
              disabled: nameErrors || !notebookKernel,
              onClick: () => {
                this.setState({ modalOpen: false, creating: true })
                Buckets.notebook(namespace, bucketName, notebookName).create(notebookKernel.data).then(
                  () => {
                    this.setState({ creating: false })
                    reloadList()
                  },
                  notebookFailure => this.setState({ notebookFailure, modalOpen: false })
                )
              }
            }, 'Create Notebook')
          }, [
            div({ style: Style.elements.sectionHeader }, 'Name'),
            notebookNameInput({
              errors: nameTouched ? nameErrors : null,
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
    const { newName, processing, failure, nameTouched } = this.state

    const nameErrors = validate.single(newName, notebookNameValidator)

    return h(Modal, {
        onDismiss: onDismiss,
        title: `${destroyOld ? 'Rename' : 'Duplicate' } "${printName}"`,
        okButton: buttonPrimary({
          disabled: nameErrors || processing,
          onClick: () => {
            this.setState({ processing: true })
            Buckets.notebook(namespace, bucketName, printName)[destroyOld ? 'rename' : 'copy'](newName).then(
              onSuccess,
              failure => this.setState({ failure })
            )
          }
        }, `${destroyOld ? 'Rename' : 'Duplicate' } Notebook`)
      },
      Utils.cond(
        [processing, () => [spinner()]],
        [failure, () => `Couldn't ${destroyOld ? 'rename' : 'copy' } notebook: ${failure}`],
        () => [
          div({ style: Style.elements.sectionHeader }, 'New Name'),
          notebookNameInput({
            errors: nameTouched ? nameErrors : null,
            inputProps: {
              value: newName,
              onChange: e => this.setState({ newName: e.target.value, nameTouched: true })
            }
          })
        ]
      )
    )
  }
}

export class NotebookDeleter extends Component {
  render() {
    const { printName, namespace, bucketName, onDismiss, onSuccess } = this.props
    const { processing, failure } = this.state

    return h(Modal, {
        onDismiss: onDismiss,
        title: `Delete "${printName}"`,
        okButton: buttonPrimary({
          disabled: processing,
          onClick: () => {
            this.setState({ processing: true })
            Buckets.notebook(namespace, bucketName, printName).delete().then(
              onSuccess,
              failure => this.setState({ failure })
            )
          }
        }, `Delete Notebook`)
      },
      Utils.cond(
        [processing, () => [spinner()]],
        [failure, () => `Couldn't delete notebook: ${failure}`],
        () => [
          div({ style: { fontSize: '1rem', flexGrow: 1 } },
            [
              `Are you sure you want to delete "${printName}"?`,
              div({ style: { fontWeight: 500, lineHeight: '2rem' } }, 'This cannot be undone.')
            ])
        ]
      )
    )
  }
}
