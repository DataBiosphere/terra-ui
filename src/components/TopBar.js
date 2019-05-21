import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { useState } from 'react'
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
import { FormLabel } from 'src/libs/forms'
import { menuOpenLogo, topBarLogo } from 'src/libs/logos'
import colors from 'src/libs/colors'
import { getConfig, isFirecloud } from 'src/libs/config'
import { reportError, withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { authStore, contactUsActive, freeCreditsActive } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import { CookiesModal } from 'src/pages/SignIn'


const styles = {
  topBar: {
    flex: 'none', height: 66, paddingLeft: '1rem',
    display: 'flex', alignItems: 'center',
    borderBottom: `2px solid ${colors.lightGreen[0]}`,
    zIndex: 2
  },
  pageTitle: {
    color: 'white', fontSize: 22, fontWeight: 500, textTransform: 'uppercase'
  },
  nav: {
    background: {
      position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
      overflow: 'auto', cursor: 'pointer'
    },
    container: {
      width: 290, color: 'white', position: 'absolute', cursor: 'default',
      backgroundColor: colors.gray[2], height: '100%',
      boxShadow: '3px 0 13px 0 rgba(0,0,0,0.3)',
      display: 'flex', flexDirection: 'column'
    },
    item: {
      display: 'flex', alignItems: 'center', flex: 'none',
      height: 70, padding: '0 28px',
      fontWeight: 600,
      borderTop: `1px solid ${colors.gray[3]}`, color: 'white'
    },
    dropDownItem: {
      backgroundColor: colors.gray[2],
      color: 'white',
      borderBottom: 'none',
      padding: '0 3rem', height: 40,
      fontSize: 'unset',
      fontWeight: 500
    },
    icon: {
      marginRight: 12, flex: 'none'
    }
  }
}

const betaTag = b({
  style: {
    fontSize: 8, lineHeight: '9px',
    color: 'white', backgroundColor: colors.lightGreen[0],
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
    this.setState({ navShown: false, openUserMenu: false, openLibraryMenu: false, openSupportMenu: false })
    document.body.classList.remove('overlayOpen', 'overHeight')
  }

  buildNav() {
    const { authState: { isSignedIn, profile,  profile: { firstName = 'Loading...', lastName = '' }  } } = this.props
    const { trialState } = profile
    const { openLibraryMenu, openSupportMenu, openUserMenu } = this.state

    const dropDownSubItem = (linkToPage, title, onClick, props) => h(MenuButton, {
      as: 'a',
      href: linkToPage,
      style: styles.nav.dropDownItem,
      hover: {
        ...styles.nav.dropDownItem,
        backgroundColor: colors.gray[3]
      },
      onClick,
      ...props
    }, [title])

    const enabledCredits = h(Clickable, {
      style: styles.nav.item,
      hover: { backgroundColor: colors.gray[3] },
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
      hover: { backgroundColor: colors.gray[3] },
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
      hover: { backgroundColor: colors.gray[3] },
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
        div({
          style: {
            ...styles.topBar,
            background: `81px url(${headerLeftHexes}) no-repeat ${colors.green[1]}`
          }
        }, [
          icon('bars', {
            dir: 'right',
            size: 36,
            style: { marginRight: '2rem', color: 'white', cursor: 'pointer' },
            onClick: () => this.hideNav()
          }),
          a({
            style: {
              ...styles.pageTitle,
              textAlign: 'center', display: 'flex', alignItems: 'center'
            },
            href: Nav.getLink('root'),
            onClick: () => this.hideNav()
          }, [menuOpenLogo(), betaTag])
        ]),
        div({ style: { display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 } }, [
          isSignedIn ?
            this.buildDropDownSection(undefined, `${firstName} ${lastName}`, () => this.setState({ openUserMenu: !openUserMenu }), openUserMenu,
              [
                dropDownSubItem(Nav.getLink('profile'), 'Profile', () => this.hideNav()),
                dropDownSubItem(Nav.getLink('groups'), 'Groups', () => this.hideNav()),
                dropDownSubItem(Nav.getLink('billing'), 'Billing', () => this.hideNav()),
                dropDownSubItem(undefined, 'Sign Out', signOut)
              ]) :
            div({
              style: {
                ...styles.nav.item,
                justifyContent: 'center',
                height: 95
              }
            }, [
              div([
                h(Clickable, {
                  style: { marginLeft: '9rem' },
                  hover: { textDecoration: 'underline' },
                  onClick: () => this.setState({ openCookiesModal: true })
                }, ['Cookies policy']),
                h(SignInButton)
              ])
            ]),
          h(Clickable, {
            as: 'a',
            style: styles.nav.item,
            hover: { backgroundColor: colors.gray[3] },
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
            style: { ...styles.nav.item, borderBottom: `1px solid ${colors.gray[3]}` },
            hover: { backgroundColor: colors.gray[3] },
            href: getConfig().jobManagerUrlRoot,
            onClick: () => this.hideNav()
          }, [
            div({ style: styles.nav.icon }, [
              icon('layers', { className: 'is-solid', size: 24 })
            ]),
            'Job Manager'
          ]),
          div({ style: { margin: '5rem' } }),
          this.buildDropDownSection(
            'library', 'Terra Library', () => this.setState({ openLibraryMenu: !openLibraryMenu }), openLibraryMenu, [
              dropDownSubItem(Nav.getLink('library-datasets'), 'Data', () => this.hideNav()),
              dropDownSubItem(Nav.getLink('library-showcase'), 'Showcase', () => this.hideNav()),
              dropDownSubItem(Nav.getLink('library-code'), 'Tools', () => this.hideNav())
            ]),
          (trialState === 'Enabled') && enabledCredits,
          (trialState === 'Enrolled') && enrolledCredits,
          (trialState === 'Terminated') && terminatedCredits,
          this.buildDropDownSection(
            'help', 'Terra Support', () => this.setState({ openSupportMenu: !openSupportMenu }), openSupportMenu, [
              dropDownSubItem('https://support.terra.bio/hc/en-us', 'How-to Guides', () => this.hideNav(), Utils.newTabLinkProps),
              dropDownSubItem('https://support.terra.bio/hc/en-us/community/topics/360000500452-Feature-Requests', 'Request a Feature',
                () => this.hideNav(), Utils.newTabLinkProps),
              dropDownSubItem('https://support.terra.bio/hc/en-us/community/topics/360000500432-General-Discussion', 'Community Forum',
                () => this.hideNav(), Utils.newTabLinkProps),
              isFirecloud() && dropDownSubItem('https://support.terra.bio/hc/en-us/articles/360022694271-Side-by-side-comparison-with-Terra', 'What\'s different in Terra?', () => this.hideNav(), Utils.newTabLinkProps),
              dropDownSubItem(undefined, 'Contact Us', () => contactUsActive.set(true))
            ]
          ),
          isFirecloud() && h(Clickable, {
            style: styles.nav.item,
            disabled: !isSignedIn,
            tooltip: isSignedIn ? undefined : 'Please sign in',
            hover: { backgroundColor: colors.gray[3] },
            onClick: () => this.setState({ openFirecloudModal: true })
          }, [
            div({ style: styles.nav.icon }, [
              icon('fcIconWhite', { className: 'is-solid', size: 20 })
            ]),
            'Use Classic FireCloud'
          ]),
          div({
            style: {
              ..._.omit('borderTop', styles.nav.item),
              marginTop: 'auto',
              color: colors.gray[3],
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

  buildDropDownSection(titleIcon, title, onClick, menuOpen, subItems) {
    return h(Collapse, {
      defaultHidden: true,
      showIcon: false,
      animate: true,
      expandTitle: true,
      buttonStyle: { marginBottom: 0 },
      title: [
        h(Clickable, {
          style: styles.nav.item,
          hover: { backgroundColor: colors.gray[3] },
          onClick
        }, [
          div({ style: styles.nav.icon }, [
            (titleIcon === undefined) ? profilePic({ size: 32 }) : icon(titleIcon, {
              className: 'is-solid',
              size: 24
            })
          ]),
          div({
            style: {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }
          }, [title]),
          div({ style: { flexGrow: 1 } }),
          icon(`angle ${menuOpen ? 'up' : 'down'}`,
            {
              size: 18,
              style: { flex: 'none' }
            })
        ])
      ]
    }, subItems)
  }

  render() {
    const { title, href, children, ajax: { User }, authState } = this.props
    const { navShown, finalizeTrial, openCookiesModal, openFirecloudModal } = this.state

    return div({
      style: {
        ...styles.topBar,
        background: `81px url(${headerLeftHexes}) no-repeat,
    right url(${headerRightHexes}) no-repeat, ${colors.green[1]}`
      }
    }, [
      icon('bars', {
        size: 36,
        style: { marginRight: '2rem', color: 'white', flex: 'none', cursor: 'pointer' },
        onClick: () => this.showNav()
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
      navShown && this.buildNav(),
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
