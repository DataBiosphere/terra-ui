import _ from 'lodash/fp'
import { Fragment } from 'react'
import { a, div, h } from 'react-hyperscript-helpers'
import { pure } from 'recompose'
import { buttonPrimary, Clickable, PageBox, search, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import TopBar from 'src/components/TopBar'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Forms from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'


const billingProjectNameValidator = existing => ({
  presence: { allowEmpty: false },
  length: { minimum: 6, maximum: 30 },
  format: {
    pattern: /^[a-z]([a-z0-9-])*$/,
    message: 'can only contain lowercase letters, numbers, and hyphens, and must start with a letter.'
  },
  exclusion: {
    within: existing,
    message: 'already exists'
  }
})

const NewBillingProjectModal = ajaxCaller(class NewBillingProjectModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      billingProjectName: '',
      billingProjectNameTouched: false
    }
  }

  render() {
    const { onDismiss, existingBillingProjects } = this.props
    const { billingProjectName, billingProjectNameTouched, submitting } = this.state
    const errors = validate({ billingProjectName }, { billingProjectName: billingProjectNameValidator(existingBillingProjects) })

    return h(Modal, {
      onDismiss,
      title: 'Create New Billing Project',
      okButton: buttonPrimary({
        disabled: errors,
        onClick: () => this.submit()
      }, ['Create Billing Project'])
    }, [
      Forms.requiredFormLabel('Enter a unique name', div({ style: { fontWeight: 400 } }, 'This cannot be changed')),
      validatedInput({
        inputProps: {
          autoFocus: true,
          value: billingProjectName,
          onChange: e => this.setState({ billingProjectName: e.target.value, billingProjectNameTouched: true })
        },
        error: billingProjectNameTouched && Utils.summarizeErrors(errors && errors.billingProjectName)
      }),
      !(billingProjectNameTouched && errors) && Forms.formHint('Only letters etc etc'),
      submitting && spinnerOverlay
    ])
  }

  async submit() {
    const { onSuccess, ajax: { Billing } } = this.props
    const { billingProjectName } = this.state

    try {
      this.setState({ submitting: true })
      await Billing.listProjects(billingProjectName).create()
      onSuccess()
    } catch (error) {
      this.setState({ submitting: false })
      reportError('Error creating billing project', error)
    }
  }
})

const ProjectCard = pure(({ project: { projectName, creationStatus, role } }) => {
  const isOwner = !!_.includes('Owner', role)
  const projectReady = creationStatus === 'Ready'

  return div({ style: Style.cardList.longCard }, [
    div({ style: { flex: 'none' } }, [
      icon(projectReady ? 'check' : 'bars', {
        style: {
          color: projectReady ? colors.green[0] : undefined,
          marginRight: '1rem'
        }
      }),
      creationStatus
    ]),
    div({ style: { flex: 1 } }, [
      a({
        href: isOwner ? Nav.getLink('project', { projectName }) : undefined,
        style: {
          ...Style.cardList.longTitle,
          marginLeft: '2rem', marginRight: '1rem',
          color: isOwner ? colors.green[0] : undefined
        }
      }, [projectName])
    ]),
    div({ style: { width: 100 } }, [isOwner ? 'Owner' : 'Member'])
  ])
})

const NewBillingProjectCard = pure(({ onClick }) => {
  return h(Clickable, {
    style: Style.cardList.shortCreateCard,
    onClick
  }, [
    div(['Create a']),
    div(['New Project']),
    icon('plus-circle', { style: { marginTop: '0.5rem' }, size: 21 })
  ])
})

export const BillingList = ajaxCaller(class BillingList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      filter: '',
      billingProjects: null,
      creatingBillingProject: false,
      updating: false,
      ...StateHistory.get()
    }
  }

  async refresh() {
    const { ajax: { Billing } } = this.props

    try {
      this.setState({ isDataLoaded: false, creatingBillingProject: false, updating: false })
      const rawBillingProjects = await Billing.listProjects()
      const billingProjects = _.flow(
        _.groupBy('projectName'),
        _.map(gs => ({ ...gs[0], role: _.map('role', gs) })),
        _.sortBy('projectName')
      )(rawBillingProjects)
      this.setState({ billingProjects, isDataLoaded: true })
    } catch (error) {
      reportError('Error loading billing projects list', error)
    }
  }

  componentDidMount() {
    this.refresh()
  }

  render() {
    const { billingProjects, isDataLoaded, filter, creatingBillingProject, updating } = this.state
    return h(Fragment, [
      h(TopBar, { title: 'Billing' }, [
        search({
          wrapperProps: { style: { marginLeft: '2rem', flexGrow: 1, maxWidth: 500 } },
          inputProps: {
            placeholder: 'SEARCH BILLING PROJECTS',
            onChange: e => this.setState({ filter: e.target.value }),
            value: filter
          }
        })
      ]),
      h(PageBox, [
        div({ style: Style.cardList.toolbarContainer }, [
          div({ style: { ...Style.elements.sectionHeader, textTransform: 'uppercase' } }, ['Billing Projects Management']) //Billing Projects? Billing Management? Billing Project Management?
        ]),
        div({ style: Style.cardList.cardContainer }, [
          h(NewBillingProjectCard, {
            onClick: () => this.setState({ creatingBillingProject: true })
          }),
          div({ style: { flexGrow: 1 } }, [
            _.flow(
              _.filter(({ projectName }) => Utils.textMatch(filter, projectName)),
              _.map(project => {
                return h(ProjectCard, {
                  project, key: `${project.projectName}`
                })
              })
            )(billingProjects)
          ]),
          !isDataLoaded && spinnerOverlay
        ]),
        creatingBillingProject && h(NewBillingProjectModal, {
          existingBillingProjects: _.map('billingProjectName', billingProjects),
          onDismiss: () => this.setState({ creatingBillingProject: false }),
          onSuccess: () => this.refresh()
        })
      ]),
      updating && spinnerOverlay
    ])
  }

  componentDidUpdate() {
    StateHistory.update(_.pick(
      ['billingProjects', 'filter'],
      this.state)
    )
  }
})


export const addNavPaths = () => {
  Nav.defPath('billing', {
    path: '/billing',
    component: BillingList,
    title: 'Billing Management'
  })
}
