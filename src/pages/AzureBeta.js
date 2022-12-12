import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary } from 'src/components/common'
import { icon } from 'src/components/icons'
import { ReactComponent as AzureLogo } from 'src/images/azure.svg'
import planet from 'src/images/register-planet.svg'
import { brands } from 'src/libs/brands'
import colors from 'src/libs/colors'
import { terraLogoMaker } from 'src/libs/logos'


const AzureBeta = () => {
  return div({
    role: 'main',
    style: {
      flexGrow: 1,
      padding: '5rem',
      backgroundImage: `url(${planet})`,
      backgroundRepeat: 'no-repeat', backgroundSize: '750px', backgroundPosition: 'right 0px bottom -600px'
    }
  }, [
    div({ style: { display: 'flex', alignItems: 'center' } }, [
      terraLogoMaker(brands.terra.logos.color, { height: 100, marginRight: 20 }),
      div({ style: { borderLeft: `1px solid ${colors.dark()}` } }, [
        h(AzureLogo, { title: 'Microsoft Azure', role: 'img', style: { height: 80, marginLeft: '1rem' } })
      ]),
    ]),
    div({
      style: {
        marginTop: '4rem', color: colors.dark(0.6),
        fontSize: '1.5rem', fontWeight: 500
      }
    }, [
      icon('warning-standard', { style: { color: colors.warning(), height: '1.5rem', width: '1.5rem', marginRight: '0.5rem', marginTop: '0.25rem' } }),
      'Beta Test Environment'
    ]),
    div({ style: { marginTop: '3rem', display: 'flex' } },
      'This is a beta version of the Terra on Azure platform.',
    ),
    div({ style: { marginTop: '3rem', display: 'flex' } },
      'The official release is expected to come soon in 2023.',
    ),
    div({ style: { marginTop: '3rem', display: 'flex' } },
      'If you are not in the beta test program, please log in using Google.',
    ),
    div({ style: { marginTop: '3rem' } }, [
      h(ButtonPrimary,
        'Proceed to beta environment'
      ),
      h(ButtonSecondary, { style: { marginLeft: '1rem' } }, 'Cancel')
    ])
  ])
}
export default AzureBeta

export const navPaths = [
  {
    name: 'azure-beta',
    path: '/azure-beta',
    component: AzureBeta,
    public: true,
    title: 'Terra on Azure Beta'
  }
]
