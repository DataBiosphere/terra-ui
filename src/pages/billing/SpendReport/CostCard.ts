import { div, span } from 'react-hyperscript-helpers'
import colors from 'src/libs/colors'
import * as Style from 'src/libs/style'


interface CostCardProps {
  title: string
  amount: string
  isProjectCostReady: boolean
  showAsterisk: boolean
  key: string
}

export const CostCard = (props: CostCardProps) => {
  return div({
    key: props.key,
    style: {
      ...Style.elements.card.container,
      backgroundColor: 'white',
      padding: undefined,
      boxShadow: undefined,
      gridRowStart: '2'
    }
  }, [
    div(
      {
        style: { flex: 'none', padding: '0.625rem 1.25rem' },
        'aria-live': props.isProjectCostReady ? 'polite' : 'off',
        'aria-atomic': true
      },
      [
        div({ style: { fontSize: 16, color: colors.accent(), margin: '0.25rem 0.0rem', fontWeight: 'normal' } }, [props.title]),
        div({ style: { fontSize: 32, height: 40, fontWeight: 'bold', gridRowStart: '2' } }, [
          props.amount,
          (!!props.showAsterisk && props.isProjectCostReady) ? span(
            {
              style: { fontSize: 16, fontWeight: 'normal', verticalAlign: 'super' },
              'aria-hidden': true
            },
            ['*']
          ) : null
        ])
      ]
    )
  ])
}
