import _ from 'lodash/fp'
import { div, h, span } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { buttonPrimary, buttonSecondary, Checkbox, link, search } from 'src/components/common'
import { icon } from 'src/components/icons'
import { textInput, validatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import PopupTrigger from 'src/components/PopupTrigger'
import { FlexTable, GridTable, HeaderCell, TextCell } from 'src/components/table'
import colors from 'src/libs/colors'
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

const els = {
  section: (title, children) => div({
    style: {
      padding: '1.5rem', backgroundColor: 'white', margin: '1.5rem 0',
      overflowX: 'auto'
    }
  }, [
    div({ style: { fontSize: 25, marginBottom: '1rem', textTransform: 'uppercase' } }, [title]),
    ...children
  ]),
  colorSwatch: (color, title, textColor = 'white') => div({
    style: {
      width: 91, height: 91, backgroundColor: color, color: textColor,
      padding: '0.25rem', display: 'inline-flex', flexDirection: 'column'
    }
  }, [
    div({ style: { flex: 1 } }),
    div({ style: { textTransform: 'uppercase' } }, [title]),
    div({ style: { fontSize: '75%' } }, [color])
  ]),
  colorWaterfall: (colorBase, title) => div({
    style: {
      display: 'flex', marginBottom: '0.5rem'
    }
  }, colorBase.map((color, index) => els.colorSwatch(
    color,
    index === 0 ? title : undefined,
    index >= 4 ? colorBase[0] : 'white'))
  )
}

class StyleGuide extends Component {
  render() {
    const { validatedInputValue, validatedInputTouched } = this.state
    const errors = validate({ validatedInputValue }, { validatedInputValue: { email: true } })

    return div({ style: { width: 1164, margin: '4rem auto' } }, [
      div({ style: { display: 'flex', alignItems: 'center', marginBottom: '4rem' } }, [
        icon('logoIcon', { size: 210 }),
        span({
          style: {
            fontSize: 55, fontWeight: 700, color: colors.titleAlt, letterSpacing: 1.78,
            marginLeft: '2rem'
          }
        }, [
          'SATURN STYLE GUIDE'
        ])
      ]),
      els.section('Color Styles', [
        div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
          div([
            els.colorWaterfall(colors.primary, 'primary'),
            els.colorWaterfall(colors.title, 'title'),
            els.colorWaterfall(colors.text, 'text'),
            els.colorWaterfall(colors.accent, 'accent')
          ]),
          div([
            els.colorWaterfall(colors.success, 'success'),
            els.colorWaterfall(colors.error, 'error'),
            els.colorWaterfall(colors.warning, 'warning'),
            els.colorSwatch(colors.titleAlt, 'title alt'),
            els.colorSwatch(colors.standout, 'standout')
          ])
        ])
      ]),
      els.section('Typeface', [
        div({ style: { display: 'flex', alignItems: 'center' } }, [
          div({ style: { paddingRight: '2rem', borderRight: Style.standardLine, marginRight: '2rem' } }, [
            div({ style: { fontSize: 78 } }, ['Montserrat']),
            div({ style: { display: 'flex', justifyContent: 'space-between', fontSize: 24, lineHeight: '42px' } }, [
              div([
                div({ style: { fontWeight: 400 } }, ['Montserrat 400']),
                div({ style: { fontWeight: 600 } }, ['Montserrat 600'])
              ]),
              div([
                div({ style: { fontWeight: 700 } }, ['Montserrat 700']),
                div({ style: { fontWeight: 800 } }, ['Montserrat 800'])
              ])
            ])
          ]),
          div({ style: { fontSize: 28, lineHeight: '42px' } }, [
            div(['ABCČĆDĐEFGHIJKLMNOPQRSŠTUVWXYZŽ']),
            div(['abcčćdđefghijklmnopqrsštuvwxyzž']),
            div(['ĂÂÊÔƠƯăâêôơư1234567890‘?’“!']),
            div(['(%)[#]{@}/&\\<-+÷×=>®©$€£¥¢:;,.*'])
          ])
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
