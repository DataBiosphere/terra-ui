import _ from 'lodash/fp'
import { div, h, h1 } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { buttonPrimary, buttonSecondary, Checkbox, link, search } from 'src/components/common'
import { icon } from 'src/components/icons'
import { textInput, validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import PopupTrigger from 'src/components/PopupTrigger'
import { FlexTable, GridTable, HeaderCell, TextCell } from 'src/components/table'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'


const styles = {
  container: {
    marginTop: '1rem',
    marginBottom: '1rem',
    backgroundColor: 'white',
    padding: '1rem'
  }
}

class StyleGuide extends Component {
  render() {
    const { validatedInputValue, validatedInputTouched } = this.state
    const errors = validate({ validatedInputValue }, { validatedInputValue: { email: true } })
    return div({ style: { paddingLeft: '1rem', paddingRight: '1rem' } }, [
      h1('Style guide'),
      div({ style: styles.container }, [
        div({ style: { display: 'flex', flexWrap: 'wrap' } }, [
          _.map(([k, v]) =>
            div({
              key: k,
              style: {
                backgroundColor: v,
                width: 150, height: 50,
                display: 'flex', justifyContent: 'center', alignItems: 'center'
              }
            }, [
              div({ style: { backgroundColor: 'white', padding: 2 } }, k)
            ]),
          _.toPairs(Style.colors))
        ])
      ]),
      div({ style: styles.container }, [
        buttonPrimary({}, 'Primary button')
      ]),
      div({ style: styles.container }, [
        buttonPrimary({ disabled: true }, 'Disabled button')
      ]),
      div({ style: styles.container }, [
        buttonSecondary({}, 'Secondary button')
      ]),
      div({ style: styles.container }, [
        buttonSecondary({ disabled: true }, 'Disabled secondary')
      ]),
      div({ style: styles.container }, [
        link({}, 'Link')
      ]),
      div({ style: styles.container }, [
        search({ inputProps: { placeholder: 'Search' } })
      ]),
      div({ style: styles.container }, [
        textInput({ placeholder: 'Text box' })
      ]),
      div({ style: styles.container }, [
        validatedInput({
          inputProps: {
            placeholder: 'ValidatedInput wants an email',
            value: validatedInputValue,
            onChange: e => this.setState({ validatedInputValue: e.target.value, validatedInputTouched: true })
          },
          error: validatedInputTouched && Utils.summarizeErrors(errors && errors.validatedInputValue)
        })
      ]),
      div({ style: styles.container }, [
        icon('pencil')
      ]),
      div({ style: styles.container }, [
        h(Checkbox, { checked: false }),
        h(Checkbox, { checked: true }),
        h(Checkbox, { checked: false, disabled: true })
      ]),
      div({ style: { ...styles.container, height: 300 } }, [
        h(AutoSizer, [
          ({ width, height }) => {
            return h(FlexTable, {
              width, height,
              rowCount: 100,
              hoverHighlight: true,
              columns: [
                {
                  size: { basis: 100, grow: 0 },
                  headerRenderer: () => h(HeaderCell, ['ID']),
                  cellRenderer: ({ rowIndex }) => `id-${rowIndex}`
                },
                {
                  size: { basis: 150, grow: 0 },
                  headerRenderer: () => h(HeaderCell, ['Name']),
                  cellRenderer: ({ rowIndex }) => {
                    return h(TextCell, `name-${rowIndex} with long text`)
                  }
                },
                {
                  size: { basis: 150 },
                  headerRenderer: () => h(HeaderCell, ['Details']),
                  cellRenderer: ({ rowIndex }) => {
                    return textInput({ readOnly: true, value: `details-${rowIndex}` })
                  }
                }
              ]
            })
          }
        ])
      ]),
      div({ style: { ...styles.container, height: 300 } }, [
        h(AutoSizer, [
          ({ width, height }) => {
            return h(GridTable, {
              width, height,
              rowCount: 100,
              columns: [
                ..._.map(n => ({
                  width: 150,
                  headerRenderer: () => h(HeaderCell, [`header-${n}`]),
                  cellRenderer: ({ rowIndex }) => `data-${rowIndex}-${n}`
                }), _.range(0, 20))
              ]
            })
          }
        ])
      ]),
      div({ style: styles.container }, [
        h(PopupTrigger, {
          content: div({ style: { padding: '0.5rem' } }, ['Hello there']),
          position: 'right',
          align: 'center'
        }, [
          buttonPrimary({}, 'Popup trigger')
        ])
      ]),
      div({ style: styles.container }, [
        buttonPrimary({
          tooltip: 'Hello there'
        }, 'Tooltip trigger')
      ]),
      div({ style: styles.container }, [
        buttonPrimary({
          onClick: () => this.setState({ modalOpen: true })
        }, 'Open modal'),
        this.state.modalOpen && h(Modal, {
          title: 'Hello there',
          onDismiss: () => this.setState({ modalOpen: false })
        }, [
          'This is a modal'
        ])
      ])
    ])
  }
}

export const addNavPaths = () => {
  Nav.defPath('styles', {
    path: '/styles',
    component: StyleGuide,
    public: true,
    title: 'Style Guide'
  })
}
