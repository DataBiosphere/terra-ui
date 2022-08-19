import _ from 'lodash/fp'
import { Fragment, useEffect, useState } from 'react'
import { div, h, h1, li, ol, p } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, DeleteConfirmationModal, IdContainer, spinnerOverlay } from 'src/components/common'
import { parseGsUri } from 'src/components/data/data-utils'
import { icon, spinner } from 'src/components/icons'
import { TextInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { FormLabel } from 'src/libs/forms'
import { useCancellation } from 'src/libs/react-utils'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const DownloadVersionButton = ({ url }) => {
  const signal = useCancellation()
  const [downloadUrl, setDownloadUrl] = useState()

  useEffect(() => {
    const loadUrl = async () => {
      try {
        setDownloadUrl(null)
        const [bucket, object] = parseGsUri(url)
        const { url: signedUrl } = await Ajax(signal).DrsUriResolver.getSignedUrl({ bucket, object })
        setDownloadUrl(signedUrl)
      } catch (error) {
        setDownloadUrl(null)
      }
    }
    loadUrl()
  }, [signal, url])

  return h(ButtonPrimary, {
    disabled: !downloadUrl,
    href: downloadUrl
  }, [
    !downloadUrl && icon('loadingSpinner', { size: 12, style: { marginRight: '1ch' } }),
    'Download TSV'
  ])
}

export const DataTableVersion = ({ version, onDelete }) => {
  const { entityType, timestamp, description } = version

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return div({ style: { padding: '1rem' } }, [
    h1({
      style: {
        ...Style.elements.sectionHeader, fontSize: 20,
        paddingBottom: '0.5rem', borderBottom: Style.standardLine, marginBottom: '1rem'
      }
    }, [
      `${entityType} (${Utils.makeCompleteDate(timestamp)})`
    ]),
    p([description || 'No description']),
    div({ style: { marginBottom: '1rem' } }, [
      h(DownloadVersionButton, { url: version.url })
    ]),
    div({ style: { marginBottom: '1rem' } }, [
      h(ButtonPrimary, {
        danger: true,
        disabled: deleting,
        onClick: () => setShowDeleteConfirmation(true)
      }, ['Delete'])
    ]),
    showDeleteConfirmation && h(DeleteConfirmationModal, {
      objectType: 'version',
      objectName: Utils.makeCompleteDate(timestamp),
      onConfirm: async () => {
        setShowDeleteConfirmation(false)
        try {
          setDeleting(true)
          await onDelete()
        } catch (err) {
          setDeleting(false)
        }
      },
      onDismiss: () => {
        setShowDeleteConfirmation(false)
      }
    }),
    deleting && spinnerOverlay
  ])
}

export const DataTableVersions = ({ loading, error, versions, onClickVersion }) => {
  return div({ style: { padding: '1rem 0.5rem 1rem 1.5rem', borderBottom: `1px solid ${colors.dark(0.2)}` } }, [
    Utils.cond(
      [loading, () => div({ style: { display: 'flex', alignItems: 'center' } }, [
        spinner({ size: 16, style: { marginRight: '1ch' } }),
        'Loading version history'
      ])],
      [error, () => div({ style: { display: 'flex', alignItems: 'center' } }, [
        // spinner({ size: 16, style: { marginRight: '1ch' } }),
        'Error loading version history'
      ])],
      [_.isEmpty(versions), () => 'No versions saved'],
      () => h(IdContainer, [id => h(Fragment, [
        div({ id, style: { marginBottom: '0.5rem' } }, ['Version history']),
        ol({ 'aria-labelledby': id, style: { margin: 0, padding: 0, listStyleType: 'none' } }, [
          _.map(version => {
            return li({ key: version.url }, [
              h(ButtonSecondary, { onClick: () => onClickVersion(version) }, [Utils.makeCompleteDate(version.timestamp)])
            ])
          }, versions)
        ])
      ])])
    )
  ])
}

export const DataTableSaveVersionModal = ({ entityType, onDismiss, onSubmit }) => {
  const [description, setDescription] = useState('')

  return h(Modal, {
    onDismiss,
    title: `Save version of ${entityType}`,
    okButton: h(ButtonPrimary, { onClick: () => onSubmit({ description }) }, ['Save'])
  }, [
    h(IdContainer, [id => h(Fragment, [
      h(FormLabel, { htmlFor: id }, ['Description']),
      h(TextInput, {
        id,
        placeholder: 'Enter a description',
        value: description,
        onChange: setDescription
      })
    ])])
  ])
}
