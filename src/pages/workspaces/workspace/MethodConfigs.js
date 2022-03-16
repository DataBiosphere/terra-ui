import { button, div, h, h2 } from 'react-hyperscript-helpers'
import * as Style from 'src/libs/style'
import { useState } from 'react';
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'
import * as breadcrumbs from 'src/components/breadcrumbs'

// actual component
const MethodConfig = ( { name, namespace } ) => {
    return div({ style: { margin: 100 } }, [
      h2({ style: { fontSize: 18, fontWeight: 500, lineHeight: '22px' } }, ['Hello World, you navigated to page ' + namespace + ' ' + name]),
      h(TestComponent)
     //'hello world'
    ])
}

// wrapping our actual component in chrome
const WrapMethodConfig = wrapWorkspace({
    breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: props => props.name,
    activeTab: 'method configs'
})(MethodConfig);

const TestComponent = () => {
    const [ testbool, setTestBool ] = useState(false);
    return button({ onClick:()=>{ setTestBool(!testbool)}}, ['testVal: ' + testbool])
}

export const navPaths = [
    {
      name: 'method-configs',
      path: '/workspaces/:namespace/:name/methodConfigs',
      component: WrapMethodConfig,
      title: ({ name }) => `${name} - method configs`
    }
  ]
  