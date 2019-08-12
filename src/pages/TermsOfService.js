import { Component } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { backgroundLogo, ButtonPrimary, ButtonSecondary } from 'src/components/common'
import { Markdown } from 'src/components/Markdown'
import { Ajax } from 'src/libs/ajax'
import { signOut } from 'src/libs/auth'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import { authStore } from 'src/libs/state'
import * as Style from 'src/libs/style'

// When updating the TOS, make sure you:
// 1. update the TOS version number in the Ajax call
// 2. update the dev and prod datastores to have a TOS of that version number
const termsOfService = `
Your access to systems and networks owned by Broad Institute is governed by, and subject to the
following terms and conditions, as well as all Federal laws, including, but not limited to,
the Privacy Act, 5 U.S.C. 552a, if the applicable Broad Institute system maintains individual
Privacy Act information. Your access to Broad Institute systems constitutes your consent to the
retrieval and disclosure of the information within the scope of your authorized access, subject to
the Privacy Act, and applicable State and Federal laws.

#### Cookies
Terra uses cookies to enable sign on and other essential features when signed in, and to provide
statistics to our development team regarding how the site is used. For more information, see our
privacy policy. Privacy policy, including privacy policy of uploaded data, is [here](/#privacy).
You agree to read and consider before uploading data.

#### Modification of the Agreement

The Broad Institute maintains the right to modify the Terms of Service, and may do so by posting
notice of such modifications on this page. Any modification made is effective immediately upon
posting the modification (unless otherwise stated). You should visit this page periodically to
review the current Terms of Service.

#### Conduct

You agree to access and use Terra for lawful purposes only. You are solely responsible for the
knowledge of and adherence to any and all laws, statutes, rules, and regulations pertaining to your
use of Terra.

#### By accessing and using Terra, you agree that you must:

* Conduct only authorized business on the system.
* Access Terra using only your own individual account. Group or shared accounts are NOT permitted.
* Maintain the confidentiality of your authentication credentials such as your password.
  Do not reveal your authentication credentials to anyone; a Broad Institute employee should never
  ask you to reveal them.
* Report all security incidents or suspected incidents (e.g., lost passwords, improper or
  suspicious acts) related to Broad Institute systems and networks to the Broad Institute Operations
  Center [infosec@broadinstitute.org](mailto:infosec@broadinstitute.org).
* Follow proper logon/logoff procedures. You must manually logon to your session; do not
  store you password locally on your system or utilize any automated logon capabilities. You must
  promptly logoff when session access is no longer needed. If a logoff function is unavailable, you
  must close your browser. Never leave your computer unattended while logged into the system.
* Ensure that Web browsers use Secure Socket Layer (SSL) version 3.0 (or higher) and Transport
  Layer Security (TLS) 1.0 (or higher). SSL and TLS must use a minimum of 256-bit, encryption.
* Safeguard system resources against waste, loss, abuse, unauthorized use or disclosure, and
  misappropriation.
* Contact the Broad Institute Chief Information Security Officer or the Broad Institute
  Operations Center ([infosec@broadinstitute.org](mailto:infosec@broadinstitute.org)) if you do not
  understand any of these rules.

#### By accessing and using Terra, you agree that you must NOT:

* Use Terra to commit a criminal offense, or to encourage others to conduct acts that would
  constitute a criminal offense or give rise to civil liability.
* Process U.S. classified national security information on the system.
* Browse, search or reveal any protected data by Broad Institute except in accordance with that
  which is required to perform your legitimate tasks or assigned duties.
* Retrieve protected data or information, or in any other way disclose information, for someone who does not have
  authority to access that information.
* Establish any unauthorized interfaces between systems, networks, and applications owned
  by Broad Institute.
* Upload any content that contains a software virus, such as a Trojan Horse or any other computer
  codes, files, or programs that may alter, damage, or interrupt the daily function of Terra and
  its users.
* Post any material that infringes or violates the academic/intellectual rights of others.
* View or use TCGA controlled access data hosted on Terra unless you are authorized through dbGaP.
* Share or distribute TCGA controlled access data hosted on Terra with other users unless they
  have dbGaP authorization.

#### Registration

You must sign up to Terra under a Google-managed identity. Both private Gmail accounts and
institutional Google Apps accounts are allowed. For increased security when using Terra, we
recommend enabling 2-Step verification for your Google-managed identity.

#### Restrictions on the Use of Shared and Group Accounts

You cannot access Terra using group or shared accounts. The credentials used for authenticating
to Terra must belong to a single individual.

#### Restrictions on the Use of Tutorial Workspaces

Terra provides tutorial workspaces preloaded with best practice analysis pipelines and example
data from TCGA. These workspaces are intended for tutorial purposes only, not for computing on
personal data.

You must not upload your own data sets to these workspaces, nor should you add workflows (Method
Configs). If you do not follow these guidelines, your Terra/Firecloud account may be deactivated.

#### Accessing a Government Website

Upon logging on to Terra, a notification message informs you that you are entering a U.S.
Government website. Please review and adhere to the content in this message.

Terra usage may be monitored, recorded, and subject to audit, and use of Terra indicates
consent to monitoring and recording.

Unauthorized use of Terra is prohibited and subject to criminal and civil penalties.

#### Access Levels

Your level of access to systems and networks owned by Broad Institute is limited to ensure your
access is no more than necessary to perform your legitimate tasks or assigned duties. If you believe
you are being granted access that you should not have, you must immediately notify the Broad
Institute Operations Center [infosec@broadinstitute.org](mailto:infosec@broadinstitute.org).

#### Restricted Use of TCGA Controlled-Access Data

To access TCGA controlled access data, you must first request to link your Terra account to the
eRA Commons or NIH identity under which you are granted dbGaP authorized access. If you have dbGaP
authorized access, Terra permits read access to the TCGA controlled-access data files.

If the NIH or eRA commons identity authentication fails or the authenticated identity no longer
appears in the NIH-provided whitelist, you can no longer access TCGA controlled access data files.
It is your responsibility to delete any TCGA controlled-access data in your personal workspaces if
you lose dbGaP authorized access. You must also refrain from distributing TCGA controlled access
data to users unless they have dbGaP authorized access.

#### Termination of Use

We may in our sole discretion suspend/terminate your access to Terra without notification for
violation of the Terms of Service, or for other conduct that we deem harmful/unlawful to others. We
may also periodically review accounts for which a user has not logged on.

#### External Links

Terra may provide links that are maintained or controlled by external organizations. The listing
of links are not an endorsement of information, products, or services, and do not imply a direct
association between the Broad Institute and the operators of the outside resource links.

#### Content

By accessing Terra, you expressly consent to monitoring of your actions and all content or data
transiting or stored therein. We reserve the right to delete, move, or edit any data, which we
consider to be unacceptable or inappropriate whether for legal or other reasons.

#### Disclaimer of Warranty

You expressly understand and agree that your use of Terra, or any material available through it,
is at your own risk. Neither the Broad Institute nor its employees warrant that Terra will be
uninterrupted, problem-free, free of omissions, or error-free; nor do they make any warranty as to
the results that may be obtained from Terra.

#### Limitation of Liability

In no event will the Broad Institute or its employees be liable for the incidental, indirect,
special, punitive, exemplary, or consequential damages, arising out of your use of or inability to
use Terra, including without limitation, loss of revenue or anticipated profits, loss of
goodwill, loss of data, computer failure or malfunction, or any and all other damages.

#### HIPAA, Protected Health Information, and the Clinical Compliance Features

Terra is not a Covered Entity as that term is defined in the Health Insurance Portability
and Accountability Act of 1996, as amended, and its related regulations (collectively, "HIPAA").
On occasion, Terra may agree in writing with a user to perform services for the user in the
storing PHI. We recommend that such users enter into a formal agreement with Terra/Firecloud.

Terra does offer clinical compliance features as part of its service ("Compliance Features")
for users who wish to upload, store, or otherwise transfer PHI, as well as users who are using the Site
in connection with their clinical operations. Users who desire to upload, store, or otherwise transfer
PHI using the Site must implement all of the required Clinical Features and must enter a formal agreement
with Terra/Firecloud stating that. The uploading, storing, or transferring of PHI using the Site by users
that have not implemented the Clinical Features is strictly prohibited. You agree that, unless you have
implemented the Clinical Features, you will not upload, store, or otherwise transfer PHI using the Site.

You acknowledge that this may require you, in some instances, to anonymize sequence data prior to
uploading it to the Site. You further agree to indemnify and hold harmless Terra of and from
any and all claims, demands, losses, causes of action, damage, lawsuits, judgments, including attorneys'
fees and costs, arising out of or relating to your uploading, storing, or transferring of PHI without
having fully implemented the Clinical Features.
`

const styles = {
  page: {
    padding: '1rem', minHeight: '100%',
    display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  box: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 5, width: 800, padding: '2rem', boxShadow: Style.standardShadow
  }
}

const termsTitle = div({ style: { color: colors.dark(), fontWeight: 600 } }, [
  span({ style: { fontSize: 36 } }, ['TERRA ']), span({ style: { fontSize: 24 } }, ['Terms of Service'])
])

const TOSMarkdown = div({
  style: { maxHeight: 400, overflowY: 'auto', lineHeight: 1.5, marginTop: '1rem', paddingRight: '1rem' }
}, [
  h(Markdown, {
    renderers: {
      heading: (text, level) => {
        return `<h${level} style="color: ${colors.dark()}; margin-bottom: 0">${text}</h${level}>`
      },
      paragraph: text => {
        return `<p style="margin-top: 0">${text}</p>`
      }
    }
  }, [termsOfService])
])

export default class TermsOfService extends Component {
  constructor(props) {
    super(props)
    this.state = { busy: false }
  }

  async accept() {
    try {
      this.setState({ busy: true })
      await Ajax().User.acceptTos()
      authStore.update(state => ({ ...state, acceptedTos: true }))
    } catch (error) {
      reportError('Error accepting TOS', error)
    } finally {
      this.setState({ busy: false })
    }
  }

  render() {
    const { busy } = this.state
    return div({ role: 'main', style: styles.page }, [
      backgroundLogo,
      div({ style: styles.box }, [
        termsTitle,
        TOSMarkdown,
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' } }, [
          h(ButtonSecondary, { style: { marginRight: '1rem' }, onClick: signOut }, 'Cancel'),
          h(ButtonPrimary, { onClick: () => this.accept(), disabled: busy }, ['Accept'])
        ])
      ])
    ])
  }
}

class TermsOfServicePage extends Component {
  render() {
    return div({ style: styles.page }, [
      backgroundLogo,
      div({ style: styles.box }, [
        termsTitle,
        TOSMarkdown
      ])
    ])
  }
}

export const navPaths = [
  {
    name: 'terms-of-service',
    path: '/terms-of-service',
    component: TermsOfServicePage,
    public: true,
    title: 'Terms of Service'
  }
]
