import filesize from 'filesize'
import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import { requesterPaysWrapper, withRequesterPaysHandler } from 'src/components/bucket-utils'
import { Link, topSpinnerOverlay } from 'src/components/common'
import Dropzone from 'src/components/Dropzone'
import FloatingActionButton from 'src/components/FloatingActionButton'
import { icon } from 'src/components/icons'
import { NameModal } from 'src/components/NameModal'
import { UploadProgressModal } from 'src/components/ProgressBar'
import { HeaderCell, SimpleTable, TextCell } from 'src/components/table'
import UriViewer from 'src/components/UriViewer'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import * as StateHistory from 'src/libs/state-history'
import { uploadFiles, useUploader } from 'src/libs/uploads'
import * as Utils from 'src/libs/utils'
import { DeleteObjectModal } from 'src/pages/workspaces/workspace/Data'


export const FileBrowserPanel = _.flow(
  Utils.withDisplayName('DataUploadPanel'),
  requesterPaysWrapper({ onDismiss: ({ onClose }) => onClose() })
)(({ workspace, workspace: { workspace: { namespace, bucketName } }, onRequesterPaysError, basePrefix, setNumFiles, collection, allowNewFolders = true, children }) => {
  const [prefix, setPrefix] = useState('')
  const [prefixes, setPrefixes] = useState(undefined)
  const [objects, setObjects] = useState(undefined)
  const [loading, setLoading] = useState(false)
  const [deletingName, setDeletingName] = useState(undefined)
  const [viewingName, setViewingName] = useState(undefined)
  const [isCreating, setCreating] = useState(false)

  const [uploadingFiles, setUploadingFiles] = useState([])
  const [uploadStatus, setUploadStatus] = useUploader()

  const signal = Utils.useCancellation()
  const { signal: uploadSignal, abort: abortUpload } = Utils.useCancelable()

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
    const { items, prefixes } = await Ajax(signal).Buckets.list(namespace, bucketName, getFullPrefix(targetPrefix))
    setPrefixes(_.flow(
      // Slice off the root
      _.map(p => p.slice(basePrefix.length)),
      _.uniq,
      _.compact
    )(prefixes))
    setObjects(items)
  })

  const count = _.flow(
    withRequesterPaysHandler(onRequesterPaysError),
    withErrorReporting('Error counting bucket objects'),
    Utils.withBusyState(setLoading)
  )(async () => {
    const items = await Ajax(signal).Buckets.listAll(namespace, bucketName)
    setNumFiles(_.flow(
      _.map('name'),
      _.filter(_.startsWith(basePrefix))
    )(items).length)
  })

  // Lifecycle
  useEffect(() => {
    load(prefix)
  }, [prefix, uploadStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    count()
  }, [uploadStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    StateHistory.update({ prefix })
  }, [prefix])

  useEffect(() => {
    if (uploadingFiles.length > 0) {
      uploadFiles({
        namespace, bucketName,
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

  return h(Fragment, {}, [
    uploadStatus.active && h(UploadProgressModal, {
      status: uploadStatus,
      abort: () => {
        abortUpload()
      }
    }),
    children,
    h(Dropzone, {
      disabled: !!Utils.editWorkspaceError(workspace) || uploadStatus.active,
      style: {
        flexGrow: 1, backgroundColor: 'white', border: `1px solid ${colors.dark(0.55)}`,
        padding: '1rem', position: 'relative', minHeight: '10rem'
      },
      activeStyle: { backgroundColor: colors.accent(0.2), cursor: 'copy' },
      multiple: true,
      maxFiles: 0,
      onDropAccepted: setUploadingFiles
    }, [({ openUploader }) => h(Fragment, [
      div({
        style: { display: 'table', height: '100%' }
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
      div({ style: { margin: '1rem -1rem 1rem -1rem', borderBottom: `1px solid ${colors.dark(0.25)}` } }),
      (prefixes?.length > 0 || objects?.length > 0) ? div({
        style: { fontSize: '1rem' }
      }, [
        h(SimpleTable, {
          columns: [
            { size: { basis: 24, grow: 0 }, key: 'button' },
            { header: h(HeaderCell, ['Name']), size: { grow: 1 }, key: 'name' },
            { header: h(HeaderCell, ['Size']), size: { basis: 200, grow: 0 }, key: 'size' },
            { header: h(HeaderCell, ['Last modified']), size: { basis: 200, grow: 0 }, key: 'updated' }
          ],
          rows: [
            ..._.map(p => {
              return {
                name: h(TextCell, [
                  makeBucketLink({
                    label: getBareFilename(p),
                    target: getFullPrefix(p),
                    onClick: () => setPrefix(p)
                  })
                ])
              }
            }, prefixes),
            ..._.map(({ name, size, updated }) => {
              return {
                button: h(Link, {
                  style: { display: 'flex' },
                  onClick: () => setDeletingName(name),
                  tooltip: 'Delete file'
                }, [
                  icon('trash', { size: 16, className: 'hover-only' })
                ]),
                name: h(TextCell, [
                  makeBucketLink({
                    label: getBareFilename(name),
                    target: name,
                    onClick: () => setViewingName(name)
                  })
                ]),
                size: filesize(size, { round: 0 }),
                updated: Utils.makePrettyDate(updated)
              }
            }, objects)
          ]
        })
      ]) : div({
        style: {
          color: colors.dark(0.75), width: '100%', margin: '4rem 0', textAlign: 'center',
          fontSize: '1.5em'
        }
      }, ['Drag and drop your files here']),
      deletingName && h(DeleteObjectModal, {
        workspace, name: deletingName,
        onDismiss: () => setDeletingName(),
        onSuccess: () => {
          setDeletingName()
          load(prefix)
        }
      }),
      viewingName && h(UriViewer, {
        googleProject: namespace, uri: `gs://${bucketName}/${viewingName}`,
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
      (loading) && topSpinnerOverlay
    ])])
  ])
})
