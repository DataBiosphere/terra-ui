import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, table, tbody, td, thead, tr } from 'react-hyperscript-helpers'

import { Select } from './common'

export const ImageDepViewer = ({ packageDoc }) => {
  const pages = _.keys(packageDoc)
  const [language, setLanguage] = useState(pages[0]) //TODO safely do this

  //we must ensure
  if (!pages.includes(language)) {
    setLanguage(pages[0]) //TODO safely do this
  }

  const packages = packageDoc ? packageDoc[language] : {}

  return h(Fragment, [
    div({ style: { display: 'flex', alignItems: 'center' } }, [
      div({ style: { fontWeight: 'bold', marginRight: '1rem' } }, ['Installed packages']),
      pages.length === 1 ?
        `(${language})` :
        div({ style: { width: 120, textTransform: 'capitalize' } }, [
          h(Select, {
            'aria-label': 'Select a language',
            value: language,
            onChange: ({ value }) => {
              this.setState({ language: value })
            },
            isSearchable: false,
            isClearable: false,
            options: pages
          })
        ])
    ]),
    div({ style: { display: 'block', alignItems: 'left', padding: '1rem', marginTop: '1rem', backgroundColor: 'white', border: 'none', borderRadius: 5, overflowY: 'auto', flexGrow: 1 } }, [
      table(
        [
          thead([
            tr([td({ style: { align: 'left', fontWeight: 'bold', paddingRight: '1rem' } }, 'Package'),
              td({ style: { align: 'left', fontWeight: 'bold' } }, 'Version')])
          ]),
          tbody(
            _.keys(packages).map((name, index) => {
              return [
                tr({ key: index }, [td({ style: { paddingRight: '1rem', paddingTop: index === 0 ? '1rem' : '0rem' } }, name),
                  td({ style: { paddingTop: index === 0 ? '1rem' : '0rem' } }, packages[name])])
              ]
            }))
        ])

    ])
  ])
}

// export class ImageDepViewezr extends Component {
//   static propTypes = {
//     packageDoc: PropTypes.object
//   }
//
//   constructor(props) {
//     super(props)
//
//     const { packageDoc } = props
//     this.state = { language: _.keys(packageDoc)[0] }
//   }
//
//   render() {
//     const { packageDoc } = this.props
//
//     const pages = this.props.packageDoc ? _.keys(packageDoc) : []
//     let language = ''
//     if (this.props.packageDoc) {
//       language = this.state.language && pages.includes(this.state.language) ? this.state.language : pages[0]
//     }
//     const packages = this.props.packageDoc ? packageDoc[language] : {}
//
//     return h(Fragment, [
//       div({ style: { display: 'flex', alignItems: 'center' } }, [
//         div({ style: { fontWeight: 'bold', marginRight: '1rem' } }, ['Installed packages']),
//         pages.length === 1 ?
//           `(${language})` :
//           div({ style: { width: 120, textTransform: 'capitalize' } }, [
//             h(Select, {
//               'aria-label': 'Select a language',
//               value: language,
//               onChange: ({ value }) => {
//                 this.setState({ language: value })
//               },
//               isSearchable: false,
//               isClearable: false,
//               options: pages
//             })
//           ])
//       ]),
//       div({ style: { display: 'block', alignItems: 'left', padding: '1rem', marginTop: '1rem', backgroundColor: 'white', border: 'none', borderRadius: 5, overflowY: 'auto', flexGrow: 1 } }, [
//         table(
//           [
//             thead([
//               tr([td({ style: { align: 'left', fontWeight: 'bold', paddingRight: '1rem' } }, 'Package'),
//                 td({ style: { align: 'left', fontWeight: 'bold' } }, 'Version')])
//             ]),
//             tbody(
//               _.keys(packages).map((name, index) => {
//                 return [
//                   tr({ key: index }, [td({ style: { paddingRight: '1rem', paddingTop: index === 0 ? '1rem' : '0rem' } }, name),
//                     td({ style: { paddingTop: index === 0 ? '1rem' : '0rem' } }, packages[name])])
//                 ]
//               }))
//           ])
//
//       ])
//     ])
//   }
// }
