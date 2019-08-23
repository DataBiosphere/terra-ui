import marked from 'marked'
import { lazy, Suspense } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { centeredSpinner } from 'src/components/icons'


/**
 * WARNING: Be very careful when using custom renderers because they may override marked's built-in
 * content sanitization.
 * @param {string} children markdown content
 * @param renderers element-specific renderers
 * @param props properties for wraper div
 * @returns {object} div containing rendered markdown
 * @constructor
 */
export const MarkdownViewer = ({ children, renderers = {}, ...props }) => {
  const content = marked(children, {
    renderer: Object.assign(new marked.Renderer(), renderers)
  })
  return div({
    className: 'markdown-body', ...props,
    dangerouslySetInnerHTML: { __html: content }
  })
}

export const newWindowLinkRenderer = (href, title, text) => {
  return `<a href="${href}" ${(title ? `title=${title}` : '')} target="_blank">${text}</a>`
}

export const MarkdownEditor = props => {
  const SimpleMDE = lazy(() => import('react-simplemde-editor'))

  return h(Suspense, { fallback: centeredSpinner() }, [h(SimpleMDE, props)])
}
