import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { div, h, table, tbody, td, thead, tr } from 'react-hyperscript-helpers'
import { Ajax } from 'src/libs/ajax'

import { Select } from './common'


export const ImageDepViewer = ({ packageLink, namespace }) => {
  const [tools, setTools] = useState(['Loading...'])
  const [tool, setTool] = useState('Loading...')
  const [packageDoc, setPackageDoc] = useState({})

  const packages = _.filter(doc => doc['tool'] === tool, packageDoc)

  const fetchImageDocumentation = async (packageLink, namespace) => {
    const splitPath = packageLink.split('/')
    const object = splitPath[splitPath.length - 1]
    const bucket = splitPath[splitPath.length - 2]

    const file = await Ajax().Buckets.getObjectPreview(bucket, object, namespace, true).then(res => res.json())

    const adaptedDoc = packageDocAdaptor(file)
    return adaptedDoc
  }

  useEffect(() => {
    async function inner() {
      const docs = await fetchImageDocumentation(packageLink, namespace)
      setPackageDoc(docs)

      const tools = _.uniq(_.map(doc => doc['tool'], docs))
      const sortedTools = _.sortBy(tool => tool === 'tools' ? 1 : 0, tools)

      setTools(sortedTools)

      if (!sortedTools.includes(tool)) {
        setTool(sortedTools[0])
      }
    }
    inner()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageLink])


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
            options: tools
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
              td({ style: { align: 'left', fontWeight: 'bold', paddingRight: '1rem', paddingBottom: '1rem' } }, ['Package']),
              td({ style: { align: 'left', fontWeight: 'bold', paddingBottom: '1rem' } }, ['Version'])
            ])
          ]),
          tbody(
            _.map(doc => {
              return tr({ key: doc['name'] }, [
                td({ style: { paddingRight: '1rem' } }, [doc['name']]),
                td([doc['version']])
              ])
            }, packages)
          )
        ])

    ])
  ])
}

//takes a packageDoc with n tools, and returns one with at most Python, R, and a generic 'tool' bucket
function packageDocAdaptor(packageDoc) {
  const tools = _.keys(packageDoc)
  const mainTools = ['r', 'python']

  const docs = _.map(
    tool => {
      return _.map(
        lib => {
          return { tool: mainTools.includes(tool) ? tool : 'tools', name: lib, version: packageDoc[tool][lib] }
        }, _.keys(packageDoc[tool]))
    }, tools)

  return _.flatten(docs)
}
