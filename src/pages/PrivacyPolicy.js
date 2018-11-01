import { div, h4, p } from 'react-hyperscript-helpers'
import { link } from 'src/components/common'
import * as Nav from 'src/libs/nav'


const PrivacyPolicy = () => {
  return div({ style: { paddingLeft: '1rem', paddingRight: '1rem' } }, [
    h4('Terra Privacy Policy'),
    p([
      'The following Privacy Policy discloses our information gathering and dissemination ',
      'practices for the Broad Institute Terra application accessed via this website. ',
      'By using Terra, you agree to the collection and use of information in accordance with ',
      'this policy. This Privacy Policy is effective as of 1-19-2017.'
    ]),
    h4('Information Gathering'),
    p([
      'The Broad Institute Terra receives and stores information related to users’ Google ',
      'profiles, including names, email addresses, user IDs, and OAuth tokens. This information ',
      'is gathered as part of the standard Google sign-in process.'
    ]),
    p([
      'We also collect information that your browser sends whenever you visit the Terra ',
      'website (“Log Data”). This Log Data may include information such as your computer’s ',
      'Internet Protocol (“IP”) address, browser type, browser version, which pages of the ',
      'Terra Portal that you visit, the time and date of your visit, the time spent on ',
      'individual pages, and other statistics. This information may include any search terms ',
      'that you enter on the Terra (e.g., dataset name, method name, tag labels). We do not ',
      'link IP addresses to any personally identifying information. User sessions will be ',
      'tracked, but users will remain anonymous.'
    ]),
    p([
      'In addition, we use web tools such as Google Analytics that collect, monitor, and analyze ',
      'the Log Data. User information (i.e., name and email address) is not included in our ',
      'Google Analytics tracking, but can be internally linked within the Terra development ',
      'team.'
    ]),
    h4('Use of Information'),
    p([
      'Terra uses the information gathered above to enable integration with Google-based ',
      'services that require a Google account, such as Google Cloud Storage Platform. We may ',
      'also use this information to provide you with the services on Terra, improve Terra, and ',
      'to communicate with you (e.g., about new feature announcements, unplanned site ',
      'maintenance, and general notices). Web server logs are retained on a temporary basis and ',
      'then deleted completely from our systems. User information is stored in a ',
      'password-protected database, and OAuth tokens are only stored for the length of an active ',
      'session, are encrypted at rest, and are deleted upon sign out.'
    ]),
    p([
      'At no time do we disclose any user information to third parties.'
    ]),
    h4('Publicly Uploaded Information'),
    p([
      'Some features of Terra are public facing (e.g, publishing a workspace in the Data ',
      'Library) and allow you to upload information (such as new studies) that you may choose to ',
      'make publicly available. If you choose to upload content is public-facing, third parties ',
      'may access and use it. We do not sell any information that you provide to Terra; it ',
      'is yours. However, any information that you make publicly available may be accessed and ',
      'used by third parties, such as research organizations or commercial third parties.'
    ]),
    h4('Security'),
    p([
      'This site has security measures in place to prevent the loss, misuse, or alteration of ',
      'the information under our control. It is compliant with NIST-800-53 and has been audited ',
      'as per FISMA Moderate. The Broad Institute, however, is not liable for the loss, misuse, ',
      'or alteration of information on this site by any third party.'
    ]),
    h4('Changes'),
    p([
      'Although most changes are likely to be minor, we may change our Privacy Policy from time ',
      'to time. We will notify you of material changes to this Privacy Policy through the Terra ',
      'website at least 30 days before the change takes effect by posting a notice on our home ',
      'page or by sending an email to the email address associated with your user account. For ',
      'changes to this Privacy Policy that do not affect your rights, we encourage you to check ',
      'this page frequently.'
    ]),
    h4('Third Party Sites'),
    p([
      'Some Terra pages may link to third party websites or services that are not maintained ',
      'by the Broad Institute. The Broad Institute is not responsible for the privacy practices ',
      'or the content of any such third party websites or services.'
    ]),
    h4('Contacting the Terra team'),
    p([
      'If you have any questions about this privacy statement, the practices of this site, or ',
      'your dealings with this site, you can contact us through our ',
      link({ href: 'http://gatkforums.broadinstitute.org/firecloud' }, 'help forum')
    ])
  ])
}

export const addNavPaths = () => {
  Nav.defPath('privacy', {
    path: '/privacy',
    component: PrivacyPolicy,
    public: true,
    title: 'Privacy Policy'
  })
}
