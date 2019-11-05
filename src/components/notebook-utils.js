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
    message: h(Fragment, [
      div('Name can\'t contain these characters:'),
      div({ style: { margin: '0.5rem 1rem' } }, '@ # $ % * + = ? , [ ] : ; / \\ ')
    ])
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
    onSuccess: PropTypes.func.isRequired,
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
    const { reloadList, onSuccess, onDismiss, namespace, bucketName, existingNames } = this.props

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
            onSuccess(notebookName)
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

// In Python notebook, use ' instead of " in code cells, to avoid formatting problems.
// Changes from raw .ipynb:
// - In notebook cells, change \n to \\n
//   (This must be done manually because there is no way to distinguish
//   between a line break and the "\n" character.)
export const cohortNotebook = cohortName => `
{
 "cells": [
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "COHORT = '${cohortName}'"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Setup - Run following cell, restart kernel, comment following cell"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# This only needs to be run once. Feel free to comment after first run\\n",
    "# Delete this cell after https://broadworkbench.atlassian.net/browse/IA-1402 is fixed.\\n",
    "!pip2.7 install --upgrade pandas-gbq\\n",
    "!pip3 install --upgrade pandas-gbq"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "import firecloud.api as fapi\\n",
    "import matplotlib.pyplot as plt\\n",
    "from pandas.api.types import is_numeric_dtype\\n",
    "import pandas as pd\\n",
    "import pandas_gbq\\n",
    "\\n",
    "import os\\n",
    "WS_NAMESPACE = os.environ['WORKSPACE_NAMESPACE']\\n",
    "WS_NAME = os.environ['WORKSPACE_NAME']"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Get cohort SQL query"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {
    "scrolled": true
   },
   "outputs": [],
   "source": [
    "cohort_query = fapi.get_entity(WS_NAMESPACE, WS_NAME, 'cohort', COHORT).json()['attributes']['query']\\n",
    "cohort_query"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Create pandas dataframe of cohort participant ids"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "cohort_participant_ids = pd.read_gbq(cohort_query, dialect='standard')\\n",
    "cohort_participant_ids.head()"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# See what tables are available to join against"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "dataset_name = fapi.get_entity(WS_NAMESPACE, WS_NAME, 'cohort', COHORT).json()['attributes']['dataset_name']\\n",
    "bigquery_table_entities_all_datasets = fapi.get_entities(WS_NAMESPACE, WS_NAME, 'BigQuery_table').json()\\n",
    "bigquery_table_entities = list(filter(lambda entity: entity['attributes']['dataset_name'] == dataset_name, bigquery_table_entities_all_datasets))\\n",
    "bigquery_tables = list(map(lambda entity: entity['attributes']['table_name'], bigquery_table_entities))\\n",
    "bigquery_tables"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Join cohort participant ids against first table"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "table = pd.read_gbq('SELECT * FROM \`{}\`'.format(bigquery_tables[0]), dialect='standard')\\n",
    "print('table has %d rows' % len(table.index))\\n",
    "\\n",
    "cohort = cohort_participant_ids.join(table, lsuffix='_L', rsuffix='_R')\\n",
    "print('cohort has %d rows' % len(cohort.index))\\n",
    "\\n",
    "cohort.head()"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Visualization of cohort first column"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "plt.rcParams.update({'font.size': 14})\\n",
    "\\n",
    "# Drop columns with 'ID' or 'id'\\n",
    "cohort_to_plot = cohort[cohort.columns.drop(list(cohort.filter(regex='id|ID')))]\\n",
    "cohort_first_column = cohort_to_plot[cohort_to_plot.columns[0]]\\n",
    "\\n",
    "title = '{} for cohort {}'.format(cohort_first_column.name, COHORT)\\n",
    "if is_numeric_dtype(cohort_first_column):\\n",
    "    cohort_first_column.plot(kind='hist', title=title)\\n",
    "else:\\n",
    "    cohort_first_column.value_counts().plot(kind='bar', title=title)"
   ]
  },
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Provenance"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "from datetime import datetime\\n",
    "from pytz import timezone\\n",
    "\\n",
    "zone = timezone('US/Eastern')\\n",
    "# zone = timezone('US/Pacific')\\n",
    "print(datetime.now(zone).strftime('%Y-%m-%d %H:%M:%S'))"
   ]
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 2",
   "language": "python",
   "name": "python2"
  },
  "language_info": {
   "codemirror_mode": {
    "name": "ipython",
    "version": 2
   },
   "file_extension": ".py",
   "mimetype": "text/x-python",
   "name": "python",
   "nbconvert_exporter": "python",
   "pygments_lexer": "ipython2",
   "version": "2.7.13"
  },
  "toc": {
   "base_numbering": 1,
   "nav_menu": {},
   "number_sections": true,
   "sideBar": true,
   "skip_h1_title": false,
   "title_cell": "Table of Contents",
   "title_sidebar": "Contents",
   "toc_cell": false,
   "toc_position": {},
   "toc_section_display": true,
   "toc_window_display": false
  }
 },
 "nbformat": 4,
 "nbformat_minor": 2
}
`
