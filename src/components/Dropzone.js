import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { div, input } from 'react-hyperscript-helpers'


const Dropzone = ({ disabled = false, onDragOver, onDrop, onDragLeave, style = {}, activeStyle = {}, children, ...props }) => {
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

  return div(getRootProps({ style: { ...style, ...(dragging ? activeStyle : {}) } }), [
    // the input is disabled by react-dropzone when noClick is true, which makes it drag only, so we couldn't even open it manually
    input({ ...getInputProps({ disabled }) }),
    children({ dragging, openUploader, ...dropProps })
  ])
}

export default Dropzone
