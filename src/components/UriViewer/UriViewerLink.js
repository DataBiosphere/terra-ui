import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'

import { isAzureUri, isGsUri } from './uri-viewer-utils'
import { UriViewer } from './UriViewer'


export const UriViewerLink = ({ uri, workspace }) => {
  const [modalOpen, setModalOpen] = useState(false)
  return h(Fragment, [
    h(Link, {
      style: { textDecoration: 'underline' },
      href: uri,
      onClick: e => {
        e.preventDefault()
        setModalOpen(true)
      }
    }, [isGsUri(uri) || isAzureUri(uri) ? _.last(uri.split(/\/\b/)) : uri]),
    modalOpen && h(UriViewer, {
      onDismiss: () => setModalOpen(false),
      uri, workspace
    })
  ])
}
