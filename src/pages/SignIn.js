import { Fragment } from 'react'
import { div, h, p } from 'react-hyperscript-helpers'
import { HeroWrapper, Link } from 'src/components/common'
import SignInButton from 'src/components/SignInButton'
import colors from 'src/libs/colors'
import { isAnvil, isBioDataCatalyst, isFirecloud } from 'src/libs/config'
import { getAppName } from 'src/libs/logos'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const styles = {
  warningNoticeContainer: {
    lineHeight: 1.5, marginTop: '2rem',
    paddingTop: '1rem', borderTop: Style.standardLine
  },
  warningNotice: {
    fontWeight: 500, textTransform: 'uppercase'
  }
}

const SignIn = () => {
  return h(HeroWrapper, { showMenu: false }, [
    div({ style: { maxWidth: 600 } }, [
      div({ style: { fontSize: 36, color: colors.dark(0.6) } }, ['New User?']),
      div({ style: { fontSize: 36, marginBottom: '2rem' } }, [`${getAppName()} requires a Google Account.`]),
      div({ style: { fontSize: 16, lineHeight: 1.5, marginBottom: '2rem' } }, [
        `${getAppName()} uses your Google account. Once you have signed in and completed the user profile registration step, you can start using ${getAppName()}.`
      ]),
      h(SignInButton),
      !isAnvil() && div({ style: styles.warningNoticeContainer }, [
        div({ style: styles.warningNotice }, ['Warning Notice']),
        p([`
            By continuing to log in, you acknowledge that you are accessing a US Government web site
            which may contain information that must be protected under the US Privacy Act or other
            sensitive information and is intended for Government authorized use only.
            `]),
        p([`
              Unauthorized attempts to upload information, change information, or use of this web site
              may result in disciplinary action, civil, and/or criminal penalties. Unauthorized users
              of this website should have no expectation of privacy regarding any communications or
              data processed by this website.'
            `]),
        p([`
              Anyone accessing this website expressly consents to monitoring of their actions and all
              communications or data transiting or stored on related to this website and is advised
              that if such monitoring reveals possible evidence of criminal activity, NIH may provide
              that evidence to law enforcement officials.
            `]),
        isFirecloud() && h(Fragment, [
          div({ style: { fontWeight: 500 } }, ['WARNING NOTICE (when accessing TCGA controlled data)']),
          p([
            'You are reminded that when accessing TCGA controlled access information you are bound by the dbGaP TCGA ',
            h(Link, {
              ...Utils.newTabLinkProps,
              href: 'https://www.cancer.gov/about-nci/organization/ccg/research/structural-genomics/tcga/history/policies/tcga-data-use-certification-agreement.pdf'
            }, ['DATA USE CERTIFICATION AGREEMENT (DUCA)'])
          ])
        ]),
        isBioDataCatalyst() && p([
          'This statement is provided pursuant to the Privacy Act of 1974 (5 U.S.C. §552a): The information requested on this form is authorized to be collected pursuant to ',
          h(Link, {
            ...Utils.newTabLinkProps,
            href: 'https://www.govinfo.gov/content/pkg/USCODE-2018-title42/html/USCODE-2018-title42-chap6A-subchapI-partA-sec217.htm'
          }, ['42 U.S.C. 217']),
          'a, 241, 281, 282, 284; 48 CFR Subpart 15.3; and Executive Order ',
          h(Link, {
            ...Utils.newTabLinkProps,
            href: 'https://www.cancer.gov/about-nci/organization/ccg/research/structural-genomics/tcga/history/policies/tcga-data-use-certification-agreement.pdf'
          }, ['DATA USE CERTIFICATION AGREEMENT (DUCA)'])
        ])
      ]),
      isAnvil() && div({ style: styles.warningNoticeContainer }, [
        div({ style: styles.warningNotice }, ['Warning Notice']),
        p([`
            You are accessing a web site created by the Genomic Data Science Analysis, Visualization,
            and Informatics Lab-space (AnVIL), funded by the National Human Genome Research Institute.
            `]),
        p([`
              Unauthorized attempts to upload information, change information, or use of this web site
              may result in disciplinary action, civil, and/or criminal penalties. Unauthorized users
              of this website should have no expectation of privacy regarding any communications or
              data processed by this website.
            `]),
        p([`
              By continuing to log in, anyone accessing this website expressly consents to monitoring
              of their actions and all communications or data transiting or stored on related to this
              website and is advised that if such monitoring reveals possible evidence of criminal activity,
              evidence may be provided to law enforcement officials.
            `])
      ])
    ])
  ])
}

export default SignIn
