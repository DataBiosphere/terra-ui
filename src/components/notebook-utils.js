import Modal from 'src/components/Modal'
import { Component, Fragment, Select } from 'src/libs/wrapped-components'
import { div, hh } from 'react-hyperscript-helpers/lib/index'
import { spinner } from 'src/components/icons'
import { buttonPrimary, textInput } from 'src/components/common'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import _ from 'lodash'
import { Buckets } from 'src/libs/ajax'


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


export const NotebookCreator = hh(class NotebookCreator extends Component {
  render() {
    const { modalOpen, notebookName, notebookKernel, notebookFailure, creating } = this.state
    const { reloadList, bucketName } = this.props

    return Fragment([
      buttonPrimary({
          onClick: () => this.setState(
            { modalOpen: true, notebookName: '', notebookKernel: null }),
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
          () => Modal({
            title: 'Notebook Creation Failure',
            okButton: buttonPrimary({ onClick: () => this.setState({ notebookFailure: null }) },
              'Done'),
            showCancel: false
          }, notebookFailure)
        ],
        [
          modalOpen,
          () => Modal({
            onDismiss: () => this.setState({ modalOpen: false }),
            title: 'Create New Notebook',
            okButton: buttonPrimary({
              disabled: !(notebookName && notebookKernel),
              onClick: () => {
                this.setState({ modalOpen: false, creating: true })
                Buckets.createNotebook(bucketName, notebookName, notebookKernel.data,
                  () => {
                    this.setState({ creating: false })
                    reloadList()
                  },
                  notebookFailure => this.setState({ notebookFailure, modalOpen: false }))
              }
            }, 'Create Notebook')
          }, [
            div({ style: Style.elements.sectionHeader }, 'Name'),
            textInput({
              style: { margin: '0.5rem 0 1rem' },
              autoFocus: true,
              placeholder: 'Enter a name',
              value: notebookName,
              onChange: e => this.setState({ notebookName: e.target.value })
            }),
            div({ style: Style.elements.sectionHeader }, 'Kernel'),
            Select({
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
})

export const NotebookRenamer = hh(class NotebookRenamer extends Component {
  render() {
    const { name, printName, bucketName, onDismiss } = this.props
    const { newNotebookName } = this.state

    return Modal({
      onDismiss: onDismiss,
      title: `Rename ${printName}`,
      okButton: buttonPrimary({
        disabled: !newNotebookName,
        onClick: () => {
          this.setState({ processing: true })
          Buckets.renameNotebook(bucketName, name, newNotebookName,
            () => {
              this.setState({ modalOpen: false })
              this.getNotebooks()
            },
            notebookFailure => this.setState({ notebookFailure, modalOpen: false }))
        }
      }, 'Rename Notebook')
    }, [
      div({ style: Style.elements.sectionHeader }, 'New Name'),
      textInput({
        style: { margin: '0.5rem 0 1rem' },
        autoFocus: true,
        placeholder: 'Enter a name',
        value: newNotebookName,
        onChange: e => this.setState({ newNotebookName: e.target.value })
      })
    ])
  }
})
