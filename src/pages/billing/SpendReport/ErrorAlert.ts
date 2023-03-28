import _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'


export const ErrorAlert = ({ errorMessage }) => {
  const error: any | undefined = Utils.maybeParseJSON(errorMessage)
  return div({
    style: {
      backgroundColor: colors.danger(0.15), borderRadius: '4px',
      boxShadow: '0 0 4px 0 rgba(0,0,0,0.5)', display: 'flex',
      padding: '1rem', margin: '1rem 0 0'
    }
  }, [
    div({ style: { display: 'flex' } },
      [
        div({ style: { margin: '0.3rem' } }, [
          icon('error-standard', {
            // @ts-ignore
            'aria-hidden': false, 'aria-label': 'error notification', size: 30,
            style: { color: colors.danger(), flexShrink: 0, marginRight: '0.3rem' }
          })
        ]),
        Utils.cond(
          [_.isString(errorMessage), () => div({ style: { display: 'flex', flexDirection: 'column', justifyContent: 'center' } },
            [
              div({ style: { fontWeight: 'bold', marginLeft: '0.2rem' }, role: 'alert' },
                // @ts-ignore
                _.upperFirst(error.message)),
              h(Collapse, { title: 'Full Error Detail', style: { marginTop: '0.5rem' } },
                [
                  div({
                    style: {
                      padding: '0.5rem', marginTop: '0.5rem', backgroundColor: colors.light(),
                      whiteSpace: 'pre-wrap', overflow: 'auto', overflowWrap: 'break-word',
                      fontFamily: 'Menlo, monospace',
                      maxHeight: 400
                    }
                  }, [JSON.stringify(error, null, 2)])
                ])
            ])],
          () => div({ style: { display: 'flex', alignItems: 'center' }, role: 'alert' }, errorMessage.toString()))
      ])
  ])
}
