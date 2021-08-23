import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, label, wbr } from 'react-hyperscript-helpers'
import { ButtonPrimary, IdContainer } from 'src/components/common'
import { TextArea } from 'src/components/input'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'


const UpdateUserCommentModal = ({
                                  onDismiss, onSuccess, workspace: { namespace, name }, submissionId, userComment
                                }) => {
  const [updating, setUpdating] = useState(undefined)
  const [saveError, setSaveError] = useState(undefined)
  const [updateComment, setUpdateComment] = useState(userComment)

  const doUpdate = async () => {
    try {
      // TODO: How to remove whitespaces here?
      await Ajax().Workspaces.workspace(namespace, name).submission(submissionId).updateUserComment(updateComment)
      onSuccess(updateComment)
      onDismiss()
    } catch (error) {
      setSaveError(await (error instanceof Response ? error.text() : error.message))
    }
  }

  const wrappableOnPeriods = _.flow(str => str?.split(/(\.)/), _.flatMap(sub => sub === '.' ? [wbr(), '.'] : sub))

  return h(Modal, {
      title: !updating ? 'Comments' : 'Updating Comments',
      onDismiss,
      showCancel: !updating,
      okButton: !saveError ?
        h(ButtonPrimary, {
          disabled: updating,
          onClick: () => {
            setUpdating(true)
            doUpdate()
          }
        }, ['Save']) :
        h(ButtonPrimary, { onClick: onDismiss }, ['OK'])
    }, [
      h(IdContainer, [id => div({ style: { margin: '1rem 0' } }, [
        label({ htmlFor: id, style: { display: 'block' } }),
        div([
          h(TextArea, {
            id,
            placeholder: 'Enter comment for the submission',
            value: updateComment,
            onChange: v => setUpdateComment(v),
            style: { height: 100 }
          })
        ])
      ])]),
      div({ style: { color: colors.danger(), overflowWrap: 'break-word' } }, [
        h(Fragment, wrappableOnPeriods(saveError))
      ])
    ]
  )
}

export default UpdateUserCommentModal