import { div, h } from 'react-hyperscript-helpers'
import { Fragment } from 'react'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { Component } from 'src/libs/wrapped-components'


export default ajaxCaller(class AccountDetail extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {

  }

  render() {
    const { accountName } = this.props

    return h(Fragment, [
      div({ style: { padding: '1.5rem 3rem' } }, [
        div({ style: { color: colors.gray[0], fontSize: 16, fontWeight: 600 } },
          [
            `BILLING ACCOUNT: ${accountName}`
          ])
      ])
    ])
  }
})
