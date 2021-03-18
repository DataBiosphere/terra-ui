import marked from 'marked'
import { lazy, Suspense } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { centeredSpinner } from 'src/components/icons'


/**
 * WARNING: Be very careful when using custom renderers because they may override marked's built-in
 * content sanitization.
 * @param {string} children - markdown content
 * @param {Object} renderers - element-specific renderers
 * @param {Object} props - properties for wrapper div
 * @returns div containing rendered markdown
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

const SimpleMDE = lazy(() => import('react-simplemde-editor'))

export const MarkdownEditor = props => {
  return h(Suspense, { fallback: centeredSpinner() }, [h(SimpleMDE, props)])
}
