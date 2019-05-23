import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Fragment, useState } from 'react'
import { a, b, div, h, span } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import { buttonPrimary, Clickable, LabeledCheckbox, MenuButton, spinnerOverlay } from 'src/components/common'
import { icon, profilePic } from 'src/components/icons'
import { TextArea } from 'src/components/input'
import Modal from 'src/components/Modal'
import SignInButton from 'src/components/SignInButton'
import headerLeftHexes from 'src/images/header-left-hexes.svg'
import headerRightHexes from 'src/images/header-right-hexes.svg'
import { Ajax, ajaxCaller } from 'src/libs/ajax'
import { refreshTerraProfile, signOut } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { getConfig, isFirecloud, isTerra } from 'src/libs/config'
import { reportError, withErrorReporting } from 'src/libs/error'
import { FormLabel } from 'src/libs/forms'
import { topBarLogo } from 'src/libs/logos'
import * as Nav from 'src/libs/nav'
import { authStore, contactUsActive, freeCreditsActive } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import { CookiesModal } from 'src/pages/SignIn'


const styles = {
  topBar: {
    flex: 'none', height: 66, paddingLeft: '1rem',
    display: 'flex', alignItems: 'center',
    borderBottom: `2px solid ${colors.primary(0.55)}`,
    zIndex: 2,
    boxShadow: '3px 0 13px 0 rgba(0,0,0,0.3)'
  },
  pageTitle: {
    color: isTerra() ? 'white' : colors.dark(), fontSize: 22, fontWeight: 500, textTransform: 'uppercase'
  },
  nav: {
    background: {
      position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
      overflow: 'auto', cursor: 'pointer',
      zIndex: 2
    },
    container: {
      paddingTop: 66,
      width: 290, color: 'white', position: 'absolute', cursor: 'default',
      backgroundColor: colors.dark(0.7), height: '100%',
      boxShadow: '3px 0 13px 0 rgba(0,0,0,0.3)',
      zIndex: 2,
      display: 'flex', flexDirection: 'column'
    },
    profile: active => ({
      backgroundColor: active ? colors.dark(0.1) : colors.dark(0.25),
      color: colors.dark(),
      borderBottom: active ? undefined : 'none'
    }),
    profileItem: active => ({
      ...styles.nav.profile(active),
      borderTop: `1px solid ${colors.dark()}`,
      padding: '0 3rem', height: 40,
      fontSize: 'unset',
      fontWeight: 500
    }),
    item: {
      display: 'flex', alignItems: 'center', flex: 'none',
      height: 70, padding: '0 28px',
      fontWeight: 600,
      borderBottom: `1px solid ${colors.dark(0.7)}`, color: 'white'
    },
    subItem: {
      display: 'flex', alignItems: 'center', flex: 'none',
      padding: '10px 28px', paddingLeft: 60,
      fontWeight: 600,
      color: 'white'
    },
    supportItem: {
      display: 'flex', alignItems: 'center', flex: 'none',
      padding: '15px 28px',
      fontWeight: 600, color: 'white'
    },
    icon: {
      marginRight: 12, flex: 'none'
    }
  }
}

const betaTag = b({
  style: {
    fontSize: 8, lineHeight: '9px',
    color: 'white', backgroundColor: colors.primary(0.75),
    padding: '3px 5px', verticalAlign: 'middle',
    borderRadius: 2
  }
}, 'BETA')

export default _.flow(
  ajaxCaller,
  Utils.connectAtom(authStore, 'authState')
)(class TopBar extends Component {
  static propTypes = {
    title: PropTypes.node,
    href: PropTypes.string, // link destination
    children: PropTypes.node
  }

  showNav() {
    this.setState({ navShown: true })
    document.body.classList.add('overlayOpen')
    if (document.body.scrollHeight > window.innerHeight) {
      document.body.classList.add('overHeight')
    }
  }

  hideNav() {
    this.setState({ navShown: false, userMenuOpen: false })
    document.body.classList.remove('overlayOpen', 'overHeight')
  }

  buildNav() {
    const { authState: { isSignedIn, profile } } = this.props
    const { trialState } = profile

    const librarySubItem = (linkName, iconName, label) => h(Clickable, {
      style: styles.nav.subItem,
      as: 'a',
      hover: { backgroundColor: colors.dark(0.55) },
      href: Nav.getLink(linkName),
      onClick: () => this.hideNav()
    }, [
      div({ style: styles.nav.icon }, [
        icon(iconName, {
          className: 'is-solid',
          size: 24
        })
      ]),
      label
    ])

    const enabledCredits = h(Clickable, {
      style: styles.nav.item,
      hover: { backgroundColor: colors.dark(0.55) },
      onClick: () => {
        this.hideNav()
        freeCreditsActive.set(true)
      }
    }, [
      div({ style: styles.nav.icon }, [
        icon('cloud', {
          className: 'is-solid',
          size: 20
        })
      ]),
      'Sign up for free credits'
    ])

    const enrolledCredits = h(Clickable, {
      style: styles.nav.item,
      as: 'a',
      hover: { backgroundColor: colors.dark(0.55) },
      href: 'https://software.broadinstitute.org/firecloud/documentation/freecredits',
      ...Utils.newTabLinkProps,
      onClick: () => this.hideNav()
    }, [
      div({ style: styles.nav.icon }, [
        icon('cloud', {
          className: 'is-solid',
          size: 20
        })
      ]),
      'Access free credits',
      icon('pop-out', {
        size: 20,
        style: { paddingLeft: '0.5rem' }
      })
    ])

    const terminatedCredits = h(Clickable, {
      style: styles.nav.item,
      hover: { backgroundColor: colors.dark(0.55) },
      onClick: () => this.setState({ finalizeTrial: true })
    }, [
      div({ style: styles.nav.icon }, [
        icon('cloud', {
          className: 'is-solid',
          size: 20
        })
      ]),
      'Your free trial has ended'
    ])

    return div({
      style: styles.nav.background,
      onClick: () => {
        this.hideNav()
      }
    }, [
      div({
        style: styles.nav.container,
        onClick: e => e.stopPropagation()
      }, [
        div({ style: { display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 } }, [
          isSignedIn ?
            this.buildUserSection() :
            div({
              style: { ...styles.nav.item, ...styles.nav.profile(false), justifyContent: 'center', height: 95 }
            }, [
              div([
                h(Clickable, {
                  style: {
                    color: colors.accent(),
                    marginLeft: '9rem'
                  },
                  onClick: () => this.setState({ openCookiesModal: true })
                }, ['Cookies policy']),
                h(SignInButton)
              ])
            ]),
          h(Clickable, {
            as: 'a',
            style: styles.nav.item,
            hover: { backgroundColor: colors.dark(0.55) },
            href: Nav.getLink('workspaces'),
            onClick: () => this.hideNav()
          }, [
            div({ style: styles.nav.icon }, [
              icon('grid-chart', { className: 'is-solid', size: 24 })
            ]),
            'Your Workspaces'
          ]),
          h(Clickable, {
            as: 'a',
            ...Utils.newTabLinkProps,
            style: styles.nav.item,
            hover: { backgroundColor: colors.dark(0.55) },
            href: getConfig().jobManagerUrlRoot,
            onClick: () => this.hideNav()
          }, [
            div({ style: styles.nav.icon }, [
              icon('layers', { className: 'is-solid', size: 24 })
            ]),
            'Your Jobs',
            icon('pop-out', {
              size: 12,
              style: { marginLeft: '0.5rem' }
            })
          ]),
          div({ style: { borderBottom: styles.nav.item.borderBottom, padding: '14px 0' } }, [
            div({ style: { ...styles.nav.subItem, paddingLeft: 28 } }, [
              div({ style: styles.nav.icon }, [
                icon('library', { className: 'is-solid', size: 24 })
              ]),
              'Library'
            ]),
            librarySubItem('library-datasets', 'data-cluster', 'Datasets'),
            librarySubItem('library-showcase', 'grid-chart', 'Showcase & Tutorials'),
            librarySubItem('library-code', 'tools', 'Code & Tools')
          ]),
          (trialState === 'Enabled') && enabledCredits,
          (trialState === 'Enrolled') && enrolledCredits,
          (trialState === 'Terminated') && terminatedCredits,
          h(Clickable, {
            style: { ...styles.nav.supportItem, marginTop: '15px' },
            hover: { backgroundColor: colors.dark(0.55) },
            onClick: () => contactUsActive.set(true)
          }, [
            div({ style: styles.nav.icon }, [
              icon('envelope', { className: 'is-solid', size: 20 })
            ]),
            'Contact Us'
          ]),
          h(Clickable, {
            style: styles.nav.supportItem,
            as: 'a',
            hover: { backgroundColor: colors.dark(0.55) },
            href: 'https://support.terra.bio/hc/en-us',
            ...Utils.newTabLinkProps,
            onClick: () => this.hideNav()
          }, [
            div({ style: styles.nav.icon }, [
              icon('help', {
                className: 'is-solid',
                size: 20
              })
            ]),
            'Learn about Terra',
            icon('pop-out', {
              size: 12,
              style: { marginLeft: '0.5rem' }
            })
          ]),
          h(Clickable, {
            style: styles.nav.supportItem,
            as: 'a',
            hover: { backgroundColor: colors.dark(0.55) },
            href: 'https://support.terra.bio/hc/en-us/community/topics/360000500452',
            ...Utils.newTabLinkProps,
            onClick: () => this.hideNav()
          }, [
            div({ style: styles.nav.icon }, [
              icon('bubble-exclamation', {
                className: 'is-solid',
                size: 20
              })
            ]),
            'Request a feature',
            icon('pop-out', {
              size: 12,
              style: { marginLeft: '0.5rem' }
            })
          ]),
          h(Clickable, {
            style: styles.nav.supportItem,
            as: 'a',
            hover: { backgroundColor: colors.dark(0.55) },
            href: 'https://support.terra.bio/hc/en-us/community/topics/360000500432',
            ...Utils.newTabLinkProps,
            onClick: () => this.hideNav()
          }, [
            div({ style: styles.nav.icon }, [
              icon('chat-bubble', {
                className: 'is-solid',
                size: 20
              })
            ]),
            'Community discussion',
            icon('pop-out', {
              size: 12,
              style: { marginLeft: '0.5rem' }
            })
          ]),
          isFirecloud() && h(Fragment, [
            h(Clickable, {
              style: styles.nav.supportItem,
              as: 'a',
              hover: { backgroundColor: colors.dark(0.55) },
              href: 'https://support.terra.bio/hc/en-us/articles/360022694271',
              ...Utils.newTabLinkProps,
              onClick: () => this.hideNav()
            }, [
              div({ style: styles.nav.icon }, [
                icon('help-info', { className: 'is-solid', size: 20 })
              ]),
              div([
                'What\'s different in',
                div([
                  'Terra?',
                  icon('pop-out', {
                    size: 12,
                    style: { marginLeft: '0.5rem', flexGrow: 1 }
                  })
                ])
              ])
            ]),
            h(Clickable, {
              style: styles.nav.supportItem,
              disabled: !isSignedIn,
              tooltip: isSignedIn ? undefined : 'Please sign in',
              hover: { backgroundColor: colors.dark(0.55) },
              onClick: () => this.setState({ openFirecloudModal: true })
            }, [
              div({ style: styles.nav.icon }, [
                icon('fcIconWhite', { className: 'is-solid', size: 20 })
              ]),
              'Use Classic FireCloud'
            ])
          ]),
          div({
            style: {
              ..._.omit('borderBottom', styles.nav.item),
              marginTop: 'auto',
              color: colors.dark(0.55),
              fontSize: 10
            }
          }, [
            'Built on: ',
            new Date(SATURN_BUILD_TIMESTAMP).toLocaleString()
          ])
        ])
      ])
    ])
  }

  buildUserSection() {
    const { authState: { profile: { firstName = 'Loading...', lastName = '' } } } = this.props
    const { userMenuOpen } = this.state

    return h(Collapse, {
      defaultHidden: true,
      showIcon: false,
      animate: true,
      expandTitle: true,
      style: styles.nav.profile(false),
      buttonStyle: { marginBottom: 0 },
      title: [
        h(Clickable, {
          style: { ...styles.nav.item, ...styles.nav.profile(userMenuOpen) },
          hover: styles.nav.profile(true),
          onClick: () => this.setState({ userMenuOpen: !userMenuOpen })
        }, [
          div({ style: styles.nav.icon }, [
            profilePic({ size: 32 })
          ]),
          div({ style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, [
            `${firstName} ${lastName}`
          ]),
          div({ style: { flexGrow: 1 } }),
          icon(`angle ${userMenuOpen ? 'up' : 'down'}`,
            { size: 18, style: { flex: 'none' } })
        ])
      ]
    }, [
      h(MenuButton, {
        as: 'a',
        href: Nav.getLink('profile'),
        style: styles.nav.profileItem(false),
        hover: styles.nav.profileItem(true),
        onClick: () => this.hideNav() // In case we're already there
      }, [
        icon('user', { style: styles.nav.icon }), 'Profile'
      ]),
      h(MenuButton, {
        as: 'a',
        href: Nav.getLink('groups'),
        style: styles.nav.profileItem(false),
        hover: styles.nav.profileItem(true),
        onClick: () => this.hideNav() // In case we're already there
      }, [
        icon('users', { style: styles.nav.icon }), 'Groups'
      ]),
      h(MenuButton, {
        as: 'a',
        href: Nav.getLink('billing'),
        style: styles.nav.profileItem(false),
        hover: styles.nav.profileItem(true),
        onClick: () => this.hideNav() // In case we're already there
      }, [
        icon('wallet', { style: styles.nav.icon }), 'Billing'
      ]),
      h(MenuButton, {
        onClick: signOut,
        style: styles.nav.profileItem(false),
        hover: styles.nav.profileItem(true)
      }, [
        icon('logout', { style: styles.nav.icon }), 'Sign Out'
      ])
    ])
  }

  render() {
    const { title, href, children, ajax: { User }, authState } = this.props
    const { navShown, finalizeTrial, openCookiesModal, openFirecloudModal } = this.state

    return h(Fragment, [
      navShown && this.buildNav(),
      div({
        style: {
          ...styles.topBar,
          background: isTerra() ?
            `81px url(${headerLeftHexes}) no-repeat, right url(${headerRightHexes}) no-repeat, ${colors.primary()}` :
            colors.secondary(0.15)
        }
      }, [
        icon('bars', {
          dir: navShown ? 'right' : undefined,
          size: 36,
          style: { marginRight: '2rem', color: isTerra() ? 'white' : colors.accent(), flex: 'none', cursor: 'pointer' },
          onClick: () => navShown ? this.hideNav() : this.showNav()
        }),
        a({
          style: { ...styles.pageTitle, display: 'flex', alignItems: 'center' },
          href: href || Nav.getLink('root')
        }, [
          topBarLogo(),
          div({}, [
            div({
              style: title ? { fontSize: '0.8rem', lineHeight: '19px' } : { fontSize: '1rem', fontWeight: 600 }
            }, [betaTag]),
            title
          ])
        ]),
        children,
        finalizeTrial && h(Modal, {
          title: 'Remove button',
          onDismiss: () => this.setState({ finalizeTrial: false }),
          okButton: buttonPrimary({
            onClick: async () => {
              try {
                await User.finalizeTrial()
                await refreshTerraProfile()
              } catch (error) {
                reportError('Error finalizing trial', error)
              } finally {
                this.setState({ finalizeTrial: false })
              }
            }
          }, ['Confirm'])
        }, ['Click confirm to remove button forever.']),
        openCookiesModal && h(CookiesModal, {
          onDismiss: () => this.setState({ openCookiesModal: false })
        }),
        openFirecloudModal && h(PreferFirecloudModal, {
          onDismiss: () => this.setState({ openFirecloudModal: false }),
          authState
        })
      ])
    ])
  }
})

const PreferFirecloudModal = ({ onDismiss }) => {
  const [emailAgreed, setEmailAgreed] = useState(true)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { profile: { email, firstName, lastName } } = Utils.useAtom(authStore)
  const currUrl = window.location.href

  const returnToLegacyFC = _.flow(
    withErrorReporting('Error opting out of Terra'),
    Utils.withBusyState(setSubmitting)
  )(async () => {
    await Ajax().User.profile.preferLegacyFirecloud()
    if (emailAgreed === true || reason.length !== 0) {
      await Ajax().User.createSupportRequest({
        name: `${firstName} ${lastName}`,
        email,
        description: reason,
        subject: 'Opt out of Terra',
        type: 'survey',
        attachmentToken: '',
        emailAgreed,
        currUrl
      })
    }
    onDismiss()
    window.location.assign(getConfig().firecloudUrlRoot)
  })

  return h(Modal, {
    onDismiss,
    title: 'Return to classic FireCloud',
    okButton: returnToLegacyFC
  }, [
    'Are you sure you would prefer the previous FireCloud interface?',
    h(FormLabel, ['Please tell us why']),
    h(TextArea, {
      style: { height: 100, marginBottom: '0.5rem' },
      placeholder: 'Enter your reason',
      value: reason,
      onChange: setReason
    }),
    h(LabeledCheckbox, {
      checked: emailAgreed,
      onChange: setEmailAgreed
    }, [span({ style: { marginLeft: '0.5rem' } }, ['You can follow up with me by email.'])]),
    submitting && spinnerOverlay
  ])
}
