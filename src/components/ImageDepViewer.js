import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, table, tbody, td, thead, tr } from 'react-hyperscript-helpers'

import { Select } from './common'

export const ImageDepViewer = ({ packageDoc }) => {
  const languages = _.keys(packageDoc)
  const [language, setLanguage] = useState(languages[0])

  if (!languages.includes(language)) {
    setLanguage(languages[0])
  }

  const packages = packageDoc[language]

  return h(Fragment, [
    div({ style: { display: 'flex', alignItems: 'center', textTransform: 'capitalize' } }, [
      div({ style: { fontWeight: 'bold', marginRight: '1rem' } }, ['Installed packages']),
      languages.length === 1 ?
        `${language}` :
      div({ style: { width: 120, textTransform: 'capitalize' } }, [
        h(Select, {
          'aria-label': 'Select a language',
          value: language,
          onChange: ({ value }) => setLanguage(value),
          isSearchable: false,
          isClearable: false,
          options: languages
        })
      ])
    ]),
    div({
      style: {
        display: 'block', alignItems: 'left', padding: '1rem', marginTop: '1rem', backgroundColor: 'white', border: 'none', borderRadius: 5,
        overflowY: 'auto', flexGrow: 1
      }
    }, [
      table(
        [
          thead([
            tr([
              td({ style: { align: 'left', fontWeight: 'bold', paddingRight: '1rem' } }, ['Package']),
              td({ style: { align: 'left', fontWeight: 'bold' } }, ['Version'])
            ])
          ]),
          tbody(
            _.keys(packages).map((name, index) => {
              return [
                tr({ key: index }, [
                  td({ style: { paddingRight: '1rem', paddingTop: index === 0 ? '1rem' : '0rem' } }, [name]),
                  td({ style: { paddingTop: index === 0 ? '1rem' : '0rem' } }, [packages[name]])
                ])
              ]
            }))
        ])

    ])
  ])
}
