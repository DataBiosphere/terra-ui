import { Fragment } from 'react'
import { div, h, p } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { HeroWrapper } from 'src/components/HeroWrapper'
import SignInButton from 'src/components/SignInButton'
import { getEnabledBrand, isAnvil, isBioDataCatalyst, isElwazi, isFirecloud } from 'src/libs/brand-utils'
import colors from 'src/libs/colors'
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
  const brand = getEnabledBrand()

  return h(HeroWrapper, { showMenu: false, showDocLink: true }, [
    div({ style: { maxWidth: 600 } }, [
      div({ style: { fontSize: 36, color: colors.dark(0.6) } }, ['New User?']),
      div({ style: { fontSize: 36, marginBottom: '2rem' } }, [`${brand.name} requires a Google Account.`]),
      div({ style: { fontSize: 16, lineHeight: 1.5, marginBottom: '2rem' } }, [
        `Once you have signed in and completed the user profile registration step, you can start using ${brand.signInName}.`
      ]),
      h(SignInButton),
      !isAnvil() && !isElwazi() && div({ style: styles.warningNoticeContainer }, [
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
            href: 'https://www.federalregister.gov/documents/2008/11/20/E8-27771/amendments-to-executive-order-9397-relating-to-federal-agency-use-of-social-security-numbers'
          }, ['13478']),
          `. Completing the form is voluntary, however, declining to provide any or all of the requested information may result in denial of access to controlled data.
           The principal purpose for which the information will be used is to authenticate users who request access to controlled access data. The information will be
           used to contact you in response to requests you have specifically made on this Web site. Your personal information may also be used to audit your activity
           on the system in order to ensure compliance with NIH policies. The information you provide will be included in a Privacy Act system of Records, and will be
           used and may be disclosed for the purposes and routine uses described and published in the following System of Records Notice (SORN):
           09-90-1401, Records About Restricted Dataset Requesters, HHS/OS/Other `,
          h(Link, {
            ...Utils.newTabLinkProps,
            href: 'https://www.federalregister.gov/documents/2018/03/14/2018-05176/privacy-act-of-1974-system-of-records'
          }, ['https://www.federalregister.gov/documents/2018/03/14/2018-05176/privacy-act-of-1974-system-of-records'])
        ])
      ]),
      (isAnvil() || isElwazi()) && div({ style: styles.warningNoticeContainer }, [
        div({ style: styles.warningNotice }, ['Warning Notice']),
        isAnvil() && p([`
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
