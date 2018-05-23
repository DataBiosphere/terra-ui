import { Component } from 'react'
import { div, h4, hr, p } from 'react-hyperscript-helpers'
import { link } from 'src/components/common'


export default class SignIn extends Component {
  componentDidMount() {
    window.gapi.signin2.render('signInButton', { scope: 'openid profile email' })
  }

  render() {
    return div({ style: { paddingLeft: '1rem', paddingRight: '1rem' } }, [
      div({ id: 'signInButton' }),
      h4('WARNING NOTICE'),
      p([
        'You are accessing a US Government web site which may contain information that must be ',
        'protected under the US Privacy Act or other sensitive information and is intended for ',
        'Government authorized use only.'
      ]),
      p([
        'Unauthorized attempts to upload information, change information, or use of this web site ',
        'may result in disciplinary action, civil, and/or criminal penalties. Unauthorized users ',
        'of this website should have no expectation of privacy regarding any communications or ',
        'data processed by this website.'
      ]),
      p([
        'Anyone accessing this website expressly consents to monitoring of their actions and all ',
        'communications or data transiting or stored on related to this website and is advised ',
        'that if such monitoring reveals possible evidence of criminal activity, NIH may provide ',
        'that evidence to law enforcement officials.'
      ]),
      h4('WARNING NOTICE (when accessing TCGA controlled data)'),
      p([
        'You are reminded that when accessing TCGA controlled access information you are bound by ',
        'the dbGaP TCGA ',
        link({ target: '_blank', href: 'http://cancergenome.nih.gov/pdfs/Data_Use_Certv082014' }, [
          'DATA USE CERTIFICATION AGREEMENT (DUCA)'
        ])
      ]),
      hr(),
      p([
        'Copyright © 2018, Broad Institute, Inc., Verily Life Sciences LLC'
      ])
    ])
  }
}
