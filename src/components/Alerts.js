import { Component } from 'react'
import { fetchOk } from 'src/libs/ajax'
import { getConfig } from 'src/libs/config'
import { withErrorReporting } from 'src/libs/error'


export default class Alerts extends Component {

  componentDidMount() {
    this.checkAlerts(true)
  }

  checkAlerts = withErrorReporting('Error reading alerts from Google Cloud Storage', async isFirstTime => {
    this.setState({ alertsArray: await fetchOk(`${getConfig().firecloudBucketRoot}/alerts.json`).then(res => res.json()) })
    this.handleResponse(isFirstTime)
  })

  handleResponse(isFirstTime) {
    const {alertsArray} = this.state


  }


}
