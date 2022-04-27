import { div, h, p, strong } from 'react-hyperscript-helpers'
import { ButtonPrimary } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { libraryTopMatter } from 'src/components/library-common'
import { staticStorageSlot } from 'src/libs/browser-storage'
import colors from 'src/libs/colors'
import { useStore } from 'src/libs/react-utils'
import { authStore } from 'src/libs/state'


export const acknowledgmentStore = staticStorageSlot(localStorage, 'gp-data-selector-poc-acknowledgment')

const GPDataSelector = () => {
  // State
  // const [loading, setLoading] = useState(false)
  const acknowledged = useStore(acknowledgmentStore) || {}
  const { user: { id } } = useStore(authStore)

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter('gp data selector'),
    !acknowledged[id] && div({
      // TODO: Factor out acknowledgement styling
      style: {
        border: `2px solid ${colors.accent()}`, borderRadius: 3,
        backgroundColor: colors.light(),
        padding: '1px 20px', margin: '10px 1000px 10px 30px',
        fontSize: '0.9rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }
    }, [
      div({ style: { lineHeight: '0.5rem' } }, [
        p(['The data displayed on this page is solely for proof-of-concept testing of GP Data Selector.']),
        p([strong('Not for research purposes.')])
      ]),
      h(ButtonPrimary, {
        style: { minWidth: 88, minHeight: 40 },
        onClick: () => acknowledgmentStore.set({ [id]: true })
      }, ['OK'])
    ])
    // loading && spinnerOverlay
  ])
}

export const navPaths = [
  {
    name: 'library-gp-selector',
    path: '/library/gp-selector',
    component: GPDataSelector,
    title: 'GP Data Selector',
    public: false
  }
]
