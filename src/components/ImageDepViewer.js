import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { div, h, table, tbody, td, thead, tr } from 'react-hyperscript-helpers'
import { Select } from 'src/components/common'
import { fetchOk } from 'src/libs/ajax/ajax-common'
import { withErrorReporting } from 'src/libs/error'
import { useCancellation } from 'src/libs/react-utils'


export const ImageDepViewer = ({ packageLink }) => {
  const [selectedTool, setSelectedTool] = useState()
  const [packages, setPackages] = useState()
  const toolsList = _.flow(_.map('tool'), _.uniq, _.sortBy(v => v === 'tools' ? 1 : 0))
  const tools = toolsList(packages)

  const signal = useCancellation()
  useEffect(() => {
    const loadPackages = withErrorReporting('Error loading packages', async () => {
      const res = await fetchOk(packageLink, { signal })
      const data = await res.json()
      const newPackages = _.flatMap(([tool, packages]) => {
        return _.map(([name, version]) => {
          return { tool: _.includes(tool, ['r', 'python']) ? tool : 'tools', name, version }
        }, _.toPairs(packages))
      }, _.toPairs(data))
      setPackages(newPackages)
      const newTools = toolsList(newPackages)
      if (!_.includes(selectedTool, newTools)) {
        setSelectedTool(newTools[0])
      }
    })
    loadPackages()
  }, [packageLink]) // eslint-disable-line react-hooks/exhaustive-deps

  return h(Fragment, [
    div({ style: { display: 'flex', alignItems: 'center' } }, [
      div({ style: { fontWeight: 'bold', marginRight: '1rem' } }, ['Language:']),
      tools.length === 1 ?
        _.startCase(selectedTool) :
        div({ style: { width: 120 } }, [
          h(Select, {
            'aria-label': 'Select a language',
            value: selectedTool,
            onChange: ({ value }) => setSelectedTool(value),
            isSearchable: false,
            isClearable: false,
            options: tools,
            getOptionLabel: ({ value }) => _.startCase(value)
          })
        ])
    ]),
    div({ style: { padding: '1rem', marginTop: '1rem', backgroundColor: 'white', borderRadius: 5, flexGrow: 1 } }, [
      table([
        thead([
          tr([
            td({ style: { fontWeight: 'bold', paddingRight: '1rem', paddingBottom: '1rem' } }, ['Package']),
            td({ style: { fontWeight: 'bold', paddingBottom: '1rem' } }, ['Version'])
          ])
        ]),
        tbody(
          _.flow(
            _.filter({ tool: selectedTool }),
            _.sortBy(({ name }) => _.toLower(name)),
            _.map(({ name, version }) => {
              return tr({ key: name }, [
                td({ style: { paddingRight: '1rem' } }, [name]),
                td([version])
              ])
            })
          )(packages)
        )
      ])
    ])
  ])
}
