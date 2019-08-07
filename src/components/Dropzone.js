import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { div, input } from 'react-hyperscript-helpers'
import * as Utils from 'src/libs/utils'


const Dropzone = ({ disabled = false, onDragOver, onDrop, onDragLeave, style = {}, activeStyle = {}, children, ...props }) => {
  const [dragging, setDragging] = useState(false)

  const { getRootProps, getInputProps, open: openUploader, ...dropProps } = useDropzone({
    noClick: true,
    disabled,
    onDragOver: () => {
      setDragging(true)
      Utils.maybeCall(onDragOver)
    },
    onDrop: () => {
      setDragging(false)
      Utils.maybeCall(onDrop)
    },
    onDragLeave: () => {
      setDragging(false)
      Utils.maybeCall(onDragLeave)
    },
    ...props
  })

  return div(getRootProps({ style: { ...style, ...(dragging ? activeStyle : {}) } }), [
    // the input is disabled by react-dropzone when noClick is true, which makes it drag only, so we couldn't even open it manually
    input({ ...getInputProps({ disabled }) }),
    children({ dragging, openUploader, ...dropProps })
  ])
}

export default Dropzone
