import filesize from 'filesize'
import _ from 'lodash/fp'
import { Fragment, useEffect, useRef, useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { Link, topSpinnerOverlay } from 'src/components/common'
import { saveScroll } from 'src/components/data/data-utils'
import Dropzone from 'src/components/Dropzone'
import FloatingActionButton from 'src/components/FloatingActionButton'
import { icon } from 'src/components/icons'
import { NameModal } from 'src/components/NameModal'
import { UploadProgressModal } from 'src/components/ProgressBar'
import { FlexTable, HeaderCell, TextCell } from 'src/components/table'
import UriViewer from 'src/components/UriViewer'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import { useCancelable, useCancellation, withDisplayName } from 'src/libs/react-utils'
import * as StateHistory from 'src/libs/state-history'
import { uploadFiles, useUploader } from 'src/libs/uploads'
import * as Utils from 'src/libs/utils'
import { DeleteObjectModal } from 'src/pages/workspaces/workspace/Data'


export const FileBrowserPanel = _.flow(
  withDisplayName('DataUploadPanel'),
  requesterPaysWrapper({ onDismiss: ({ onClose }) => onClose() })
)(({ workspace, workspace: { workspace: { googleProject, bucketName } }, onRequesterPaysError, basePrefix, setNumFiles, collection, allowNewFolders = true, style, children }) => {
  const [prefix, setPrefix] = useState('')
  const [prefixes, setPrefixes] = useState([])
  const [objects, setObjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [deletingName, setDeletingName] = useState(undefined)
  const [viewingName, setViewingName] = useState(undefined)
  const [isCreating, setCreating] = useState(false)

  const [uploadingFiles, setUploadingFiles] = useState([])
  const [uploadStatus, setUploadStatus] = useUploader()
  const [lastRefresh, setLastRefresh] = useState(0)

  const signal = useCancellation()
  const { signal: uploadSignal, abort: abortUpload } = useCancelable()

  const { initialY } = StateHistory.get() || {}
  const table = useRef()

  // Helpers
  const getFullPrefix = (targetPrefix = prefix) => {
    const fullPrefix = targetPrefix.startsWith(basePrefix) ? targetPrefix : `${basePrefix}${targetPrefix}`
    return fullPrefix.endsWith('/') ? fullPrefix : `${fullPrefix}/`
  }

  const getBareFilename = name => {
    return name.startsWith(basePrefix) ? name.slice(basePrefix.length + prefix.length) : name
  }

  const load = _.flow(
    withRequesterPaysHandler(onRequesterPaysError),
    withErrorReporting('Error loading bucket data'),
    Utils.withBusyState(setLoading)
  )(async (targetPrefix = prefix) => {
    const { items, prefixes } = await Ajax(signal).Buckets.list(googleProject, bucketName, getFullPrefix(targetPrefix))
    setPrefixes(_.flow(
      // Slice off the root
      _.map(p => p.slice(basePrefix.length)),
      _.uniq,
      _.compact
    )(prefixes || []))
    setObjects(items || [])
  })

  const count = _.flow(
    withRequesterPaysHandler(onRequesterPaysError),
    withErrorReporting('Error counting bucket objects')
  )(async () => {
    const items = await Ajax(signal).Buckets.listAll(googleProject, bucketName, basePrefix)
    setNumFiles(items.length)
  })

  // Lifecycle
  useEffect(() => {
    // Whenever the prefix changes, reload the table right away
    load(prefix)
  }, [prefix, lastRefresh]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!uploadStatus.active) {
      // If the uploader has completed, count all the files in the bucket
      count()
    } else {
      // While the uploader is working, refresh the table no more often than every 5 seconds
      const now = Date.now()
      if (lastRefresh < now - 5e3) {
        setLastRefresh(now)
      }
    }
  }, [uploadStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    StateHistory.update({ prefix, initialY })
  }, [prefix, initialY])

  useEffect(() => {
    if (uploadingFiles.length > 0) {
      uploadFiles({
        googleProject, bucketName,
        prefix: getFullPrefix(prefix),
        files: uploadingFiles,
        status: uploadStatus,
        setStatus: setUploadStatus,
        signal: uploadSignal
      })
    }
  }, [uploadingFiles]) // eslint-disable-line react-hooks/exhaustive-deps


  // Render

  // Get the folder prefix
  const prefixParts = _.compact(prefix.split('/'))
  const makeBucketLink = ({ label, target, onClick }) => h(Link, {
    style: { textDecoration: 'underline' },
    href: target ? `gs://${bucketName}/${target}` : undefined,
    onClick: e => {
      e.preventDefault()
      onClick()
    }
  }, [label])

  const numPrefixes = prefixes?.length || 0
  const numObjects = objects?.length || 0

  return div({ style }, [
    children,
    h(Dropzone, {
      disabled: !!Utils.editWorkspaceError(workspace) || uploadStatus.active,
      style: {
        display: 'flex', flexFlow: 'column nowrap',
        backgroundColor: 'white', border: `1px dashed ${colors.dark(0.55)}`,
        position: 'relative', minHeight: '10rem', height: '100%'
      },
      activeStyle: { backgroundColor: colors.accent(0.2), cursor: 'copy' },
      multiple: true,
      maxFiles: 0,
      onDropAccepted: setUploadingFiles
    }, [({ openUploader }) => h(Fragment, [
      div({
        style: {
          flex: 0, display: 'flex', flexFlow: 'row nowrap',
          width: '100%', borderBottom: `1px solid ${colors.dark(0.25)}`,
          padding: '1em'
        }
      }, [
        div({
          style: { display: 'table', height: '100%', flex: 1 }
        }, [
          _.map(({ label, target }) => {
            return h(Fragment, { key: target }, [
              makeBucketLink({
                label, target: getFullPrefix(target),
                onClick: () => setPrefix(target)
              }),
              ' / '
            ])
          }, [
            collection && { label: collection, target: '' },
            ..._.map(n => {
              return { label: prefixParts[n], target: _.map(s => `${s}/`, _.take(n + 1, prefixParts)).join('') }
            }, _.range(0, prefixParts.length))
          ]),
          allowNewFolders && makeBucketLink({
            label: span([icon('plus'), ' New folder']),
            onClick: () => setCreating(true)
          })
        ]),
        uploadStatus.active && div({
          style: { flex: 0 }
        }, [
          'Uploading...'
        ])
      ]),
      div({
        style: {
          flex: '0', textAlign: 'center', fontSize: '1.2em', padding: '1em 1em 0 1em'
        }
      }, [
        'Drag and drop your files here'
      ]),
      div({
        style: { fontSize: '1rem', flex: '1 1 auto', padding: '1em', height: '100%', minHeight: '30em' }
      }, [
        h(AutoSizer, {}, [
          ({ width, height }) => h(FlexTable, {
            ref: table,
            'aria-label': 'file browser',
            width,
            height,
            rowCount: numPrefixes + numObjects,
            noContentMessage: 'No files have been uploaded yet',
            onScroll: saveScroll,
            initialY,
            rowHeight: 40,
            headerHeight: 40,
            styleCell: () => {
              return { padding: '0.5em', borderRight: 'none', borderLeft: 'none' }
            },
            styleHeader: () => {
              return { padding: '0.5em', borderRight: 'none', borderLeft: 'none' }
            },
            hoverHighlight: true,
            columns: [
              {
                size: { min: 30, grow: 0 },
                headerRenderer: () => '',
                cellRenderer: ({ rowIndex }) => {
                  if (rowIndex >= numPrefixes) {
                    const { name } = objects[rowIndex - numPrefixes]
                    return h(Link, {
                      style: { display: 'flex' },
                      onClick: () => setDeletingName(name),
                      tooltip: 'Delete file'
                    }, [
                      icon('trash', {
                        size: 16,
                        className: 'hover-only'
                      })
                    ])
                  }
                }
              },
              {
                size: { min: 100, grow: 1 }, // Fill the remaining space
                headerRenderer: () => h(HeaderCell, ['Name']),
                cellRenderer: ({ rowIndex }) => {
                  if (rowIndex < numPrefixes) {
                    const p = prefixes[rowIndex]
                    return h(TextCell, [
                      makeBucketLink({
                        label: getBareFilename(p),
                        target: getFullPrefix(p),
                        onClick: () => setPrefix(p)
                      })
                    ])
                  } else {
                    const { name } = objects[rowIndex - numPrefixes]
                    return h(TextCell, [
                      makeBucketLink({
                        label: getBareFilename(name),
                        target: name,
                        onClick: () => setViewingName(name)
                      })
                    ])
                  }
                }
              },
              {
                size: { min: 150, grow: 0 },
                headerRenderer: () => h(HeaderCell, ['Size']),
                cellRenderer: ({ rowIndex }) => {
                  if (rowIndex >= numPrefixes) {
                    const { size } = objects[rowIndex - numPrefixes]
                    return filesize(size, { round: 0 })
                  }
                }
              },
              {
                size: { min: 200, grow: 0 },
                headerRenderer: () => h(HeaderCell, ['Last modified']),
                cellRenderer: ({ rowIndex }) => {
                  if (rowIndex >= numPrefixes) {
                    const { updated } = objects[rowIndex - numPrefixes]
                    return Utils.makePrettyDate(updated)
                  }
                }
              }
            ]
          })
        ])
      ]),
      uploadStatus.active && h(UploadProgressModal, {
        status: uploadStatus,
        abort: abortUpload
      }),
      deletingName && h(DeleteObjectModal, {
        workspace, name: deletingName,
        onDismiss: setDeletingName,
        onSuccess: () => {
          setDeletingName()
          load(prefix)
          count()
        }
      }),
      viewingName && h(UriViewer, {
        googleProject, uri: `gs://${bucketName}/${viewingName}`,
        onDismiss: () => setViewingName(undefined)
      }),
      isCreating && h(NameModal, {
        thing: 'Folder',
        onDismiss: () => setCreating(false),
        onSuccess: ({ name }) => {
          setPrefix(`${prefix}${name}/`)
          setCreating(false)
        }
      }),
      !Utils.editWorkspaceError(workspace) && h(FloatingActionButton, {
        label: 'UPLOAD',
        iconShape: 'plus',
        onClick: openUploader
      }),
      loading && topSpinnerOverlay
    ])])
  ])
})
