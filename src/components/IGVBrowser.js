import _ from 'lodash/fp'
import { Component } from 'src/libs/wrapped-components'
import { Ajax } from 'src/libs/ajax'
import { div } from 'react-hyperscript-helpers'
import igv from 'igv/dist/igv.js'

const igvStyle = {
  paddingTop: '10px',
  paddingBottom: '10px',
  margin: '8px',
  border: '1px solid lightgray'
}

export class IGVBrowser extends Component {
  constructor(props) {
    super(props)
    this.state = { }
  }

  async getToken() {
    return (await Ajax().User.token())
  }

  getTrackType(filePath) {
    const fileTypeToTrack = {
      'bam': 'alignment',
      'cram': 'alignment',
      'bed': 'annotation',
      'vcf': 'variant'
    }
    return fileTypeToTrack[filePath.split('.').pop()]
  }

  getTrack(filePath) {
    return {
      type: this.getTrackType(filePath),
      name: filePath,
      url: filePath,
      // igv.js will automatically find the index file, but not for crams
      indexURL: filePath.endsWith('cram') ? filePath + '.crai' : ''
    }
  }

  componentDidMount() {
    const { selectedFiles, refGenome } = this.props
    const actuallySelectedFiles = _.flow(
      _.keys,
      _.filter(v => selectedFiles[v])
    )(selectedFiles)
    const igvContainer = document.getElementById('igv-div')
    const tracks = _.transform((result, value) => {
      result.push(
        this.getTrack(value)
      ); return result
    }, [])(actuallySelectedFiles)
    const myOptions =
      {
        genome: refGenome,
        tracks: tracks
      }
    igv.setGoogleOauthToken(this.getToken())
    igv.createBrowser(igvContainer, myOptions)
  }

  render() {
    return (
      div({ id: 'igv-div', style: { igvStyle } })
    )
  }
}
