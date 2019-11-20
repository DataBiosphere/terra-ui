import _ from 'lodash/fp'
import { Fragment, useState, useEffect } from 'react'
import { div, h, table, tbody, td, thead, tr } from 'react-hyperscript-helpers'

import { Select } from './common'

export const ImageDepViewer = ({ packageDoc }) => {
  const tools = _.uniq(_.map(doc => doc["tool"], packageDoc))
  const [tool, setTool] = useState(tools[0])

  console.log("tools:", tools)
  console.log("tool:", tool)
  if (!tools.includes(tool)) {
    setTool(tools[0])
  }
  const sortedTools = _.sortBy(tools, tool => tool == "tools" ? 0 : 1)

  useEffect(() => {

  }, )

  const packages = _.filter(doc => doc["tool"] == tool, packageDoc)
  return h(Fragment, [
    div({ style: { display: 'flex', alignItems: 'center', textTransform: 'capitalize' } }, [
      div({ style: { fontWeight: 'bold', marginRight: '1rem' } }, ['Installed packages']),
      tools.length === 1 ?
        `${tool}` :
      div({ style: { width: 120, textTransform: 'capitalize' } }, [
        h(Select, {
          'aria-label': 'Select a language',
          value: tool,
          onChange: ({ value }) => setTool(value),
          isSearchable: false,
          isClearable: false,
          options: sortedTools
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
            _.flatten(_.map((doc, index) => {
              return [
                tr({ key: index }, [
                  td({ style: { paddingRight: '1rem', paddingTop: index === 0 ? '1rem' : '0rem' } }, [doc["name"]]),
                  td({ style: { paddingTop: index === 0 ? '1rem' : '0rem' } }, [doc["version"]])
                ])
              ]
            }, packages))
          )
        ])

    ])
  ])
}
