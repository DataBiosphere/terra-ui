import { button, div, h, h2 } from 'react-hyperscript-helpers'
import * as Style from 'src/libs/style'
import { useState } from 'react';

const MethodConfig = ( { name, namespace } ) => {
    return div({ style: { margin: 100 } }, [
      h2({ style: { fontSize: 18, fontWeight: 500, lineHeight: '22px' } }, ['Hello World, you navigated to page ' + namespace + ' ' + name]),
      h(TestComponent)
     //'hello world'
    ])
}

const TestComponent = () => {
    const [ testbool, setTestBool ] = useState(false);
    return button({ onClick:()=>{ setTestBool(!testbool)}}, ['testVal: ' + testbool])
}

export const navPaths = [
    {
      name: 'method-configs',
      path: '/workspaces/:namespace/:name/methodConfigs',
      component: MethodConfig,
      title: ({ name }) => `${name} - method configs`
    }
  ]
  