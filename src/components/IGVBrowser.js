import _ from 'lodash/fp'
import { Component } from 'src/libs/wrapped-components'
import { createRef } from 'react'
import colors from 'src/libs/colors'
import { Ajax } from 'src/libs/ajax'
import { div } from 'react-hyperscript-helpers'
import igv from 'igv/dist/igv.js'

const igvStyle = {
  paddingTop: '10px',
  paddingBottom: '10px',
  margin: '8px',
  border: `1px solid ${colors.gray[5]}`
}

export class IGVBrowser extends Component {
  constructor(props) {
    super(props)
    this.containerRef = createRef()
  }

  getTrackType(filePath) {
    const fileTypeToTrack = {
      'bam': 'alignment',
      'cram': 'alignment',
      'bed': 'annotation',
      'vcf': 'variant'
    }
    return fileTypeToTrack[_.last(filePath.split('.'))]
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
    const tracks = _.map(v => this.getTrack(v))(selectedFiles)
    const myOptions =
      {
        genome: refGenome,
        tracks: tracks
      }
    igv.setGoogleOauthToken(Ajax().User.token())
    igv.createBrowser(this.containerRef.current, myOptions)
  }

  render() {
    return (
      div({ ref: this.containerRef, style: igvStyle })
    )
  }
}
