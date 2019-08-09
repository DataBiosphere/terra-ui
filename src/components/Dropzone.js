import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { div, input } from 'react-hyperscript-helpers'


const Dropzone = ({ disabled = false, onDragOver, onDrop, onDragLeave, style = {}, activeStyle = {}, children, ...props }) => {
  // dropzone's built-in dragging status doesn't seem to work if there's anything rendered over the root div
  const [dragging, setDragging] = useState(false)

  const { getRootProps, getInputProps, open: openUploader, ...dropProps } = useDropzone({
    noClick: true,
    disabled,
    onDragOver: e => {
      setDragging(true)
      onDragOver && onDragOver(e)
    },
    onDrop: e => {
      setDragging(false)
      onDrop && onDrop(e)
    },
    onDragLeave: e => {
      setDragging(false)
      onDragLeave && onDragLeave(e)
    },
    ...props
  })

  return div(getRootProps({ tabIndex: -1, style: { ...style, ...(dragging ? activeStyle : {}) } }), [
    // the input is disabled by react-dropzone when noClick is true, which makes it drag only, so we couldn't even open it manually
    input({ ...getInputProps({ disabled, 'aria-hidden': true }) }),
    children({ dragging, openUploader, ...dropProps })
  ])
}

export default Dropzone
