import _ from 'lodash/fp'
import { div, h, span } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { buttonPrimary, buttonSecondary, Checkbox, link, RadioButton } from 'src/components/common'
import { ConfirmedSearchInput, DelayedSearchInput, TextInput, ValidatedInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import PopupTrigger from 'src/components/PopupTrigger'
import { FlexTable, GridTable, HeaderCell, TextCell } from 'src/components/table'
import { logo } from 'src/libs/logos'
import colors from 'src/libs/colors'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import validate from 'validate.js'


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
  columns: (children, style = {}) => div({
    style: { display: 'flex', justifyContent: 'space-between', ...style }
  }, children),
  fixWidth: (width, children) => div({ style: { display: 'inline-block', width } }, children),
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
  ),
  buttonContainer: component => div({ style: { marginTop: '2rem' } }, [component])
}

class StyleGuide extends Component {
  constructor(props) {
    super(props)
    this.state = { validatedInputValue: 'Invalid input' }
  }

  render() {
    const { validatedInputValue } = this.state
    const errors = validate({ validatedInputValue }, { validatedInputValue: { email: true } })

    return div({ style: { width: 1164, margin: '4rem auto' } }, [
      div({ style: { display: 'flex', alignItems: 'center', marginBottom: '4rem' } }, [
        logo({ size: 210 }),
        span({
          style: {
            fontSize: 55, fontWeight: 700, color: colors.slate, letterSpacing: 1.78,
            marginLeft: '2rem'
          }
        }, [
          'TERRA STYLE GUIDE'
        ])
      ]),
      els.section('Color Styles', [
        els.columns([
          div([
            els.colorWaterfall(colors.blue, 'blue'),
            els.colorWaterfall(colors.darkBlue, 'dark blue'),
            els.colorWaterfall(colors.gray, 'gray'),
            els.colorWaterfall(colors.purple, 'purple')
          ]),
          div([
            els.colorWaterfall(colors.green, 'green'),
            els.colorWaterfall(colors.red, 'red'),
            els.colorWaterfall(colors.orange, 'orange'),
            els.colorSwatch(colors.slate, 'slate'),
            els.colorSwatch(colors.brick, 'brick')
          ])
        ])
      ]),
      els.section('Typeface', [
        div({ style: { display: 'flex', alignItems: 'center' } }, [
          div({ style: { paddingRight: '2rem', borderRight: Style.standardLine, marginRight: '2rem' } }, [
            div({ style: { fontSize: 78 } }, ['Montserrat']),
            els.columns([
              div([
                div({ style: { fontWeight: 400 } }, ['Montserrat 400']),
                div({ style: { fontWeight: 600 } }, ['Montserrat 600'])
              ]),
              div([
                div({ style: { fontWeight: 700 } }, ['Montserrat 700']),
                div({ style: { fontWeight: 800 } }, ['Montserrat 800'])
              ])
            ], { fontSize: 24, lineHeight: '42px' })
          ]),
          div({ style: { fontSize: 28, lineHeight: '42px' } }, [
            div(['ABCČĆDĐEFGHIJKLMNOPQRSŠTUVWXYZŽ']),
            div(['abcčćdđefghijklmnopqrsštuvwxyzž']),
            div(['ĂÂÊÔƠƯăâêôơư1234567890‘?’“!”']),
            div(['(%)[#]{@}/&\\<-+÷×=>®©$€£¥¢:;,.*'])
          ])
        ])
      ]),
      els.section('Buttons & Links', [
        div({ style: { display: 'flex' } }, [
          div({ style: { flex: 1 } }, [
            els.buttonContainer(buttonPrimary({}, ['Primary Button'])),
            els.buttonContainer(buttonSecondary({}, ['Secondary Button'])),
            els.buttonContainer(link({}, ['Text as a link']))
          ]),
          div({ style: { flex: 1 } }, [
            els.buttonContainer(buttonPrimary({ disabled: true }, ['Disabled button'])),
            els.buttonContainer(buttonSecondary({ disabled: true }, ['Disabled secondary']))
          ])
        ])
      ]),
      els.section('Search Box', [
        els.columns([
          els.fixWidth('30%', [h(DelayedSearchInput, { placeholder: 'Debounced search' })]),
          els.fixWidth('30%', [h(ConfirmedSearchInput, { placeholder: 'Search with explicit confirmation' })])
        ])
      ]),
      els.section('Text Box', [
        els.columns([
          els.fixWidth('30%', [h(TextInput, { placeholder: 'Text box' })]),
          els.fixWidth('30%', [h(TextInput, { defaultValue: 'Text box' })]),
          els.fixWidth('30%', [
            h(ValidatedInput, {
              inputProps: {
                placeholder: 'ValidatedInput wants an email',
                value: validatedInputValue,
                onChange: v => this.setState({ validatedInputValue: v })
              },
              error: Utils.summarizeErrors(errors && errors.validatedInputValue)
            })
          ])
        ])
      ]),
      els.section('Checkmarks/Radio/Toggles', [
        els.fixWidth(40, [h(Checkbox, { checked: false })]),
        els.fixWidth(40, [h(Checkbox, { checked: true })]),
        els.fixWidth(40, [h(Checkbox, { checked: false, disabled: true })]),
        els.fixWidth(40, [h(Checkbox, { checked: true, disabled: true })]),
        els.fixWidth(40, [h(RadioButton, { checked: false, readOnly: true })]),
        els.fixWidth(40, [h(RadioButton, { checked: true, readOnly: true })])
      ]),
      els.section('Popup/Tooltip', [
        els.fixWidth('18%', [
          h(PopupTrigger, {
            content: 'Qui blandit praesent luptatum zzril delenit.',
            side: 'bottom'
          }, [
            buttonPrimary({}, ['Popup trigger'])
          ])
        ]),
        els.fixWidth('18%', [
          h(PopupTrigger, {
            content: div({}, [
              span({}, ['Qui blandit praesent luptatum ']),
              link({}, ['zzril delenit.'])
            ]),
            side: 'bottom'
          }, [
            buttonPrimary({}, ['Popup trigger'])
          ])
        ]),
        els.fixWidth('18%', [
          buttonPrimary({
            tooltip: 'Aliquam erat volutpat ut wisi enim ad minim, veniam quis nostrud exerci tation.'
          }, ['Tooltip below'])
        ]),
        els.fixWidth('18%', [
          buttonPrimary({
            tooltip: 'Aliquam erat volutpat ut wisi enim ad minim, veniam quis nostrud exerci tation.',
            tooltipSide: 'top'
          }, ['Tooltip above'])
        ]),
        els.fixWidth('18%', [
          buttonPrimary({
            onClick: () => this.setState({ modalOpen: true })
          }, ['Open Modal']),
          this.state.modalOpen && h(Modal, {
            title: 'Modal Title',
            onDismiss: () => this.setState({ modalOpen: false })
          }, ['Modal Contents'])
        ])
      ]),
      els.section('Tables', [
        div({ style: { height: 300 } }, [
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
                      return h(TextInput, { readOnly: true, value: `details-${rowIndex}` })
                    }
                  }
                ]
              })
            }
          ])
        ]),
        div({ style: { height: 300, marginTop: '1.5rem' } }, [
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
        ])
      ])
    ])
  }
}

export const navPaths = [
  {
    name: 'styles',
    path: '/styles',
    component: StyleGuide,
    public: true,
    title: 'Style Guide'
  }
]
