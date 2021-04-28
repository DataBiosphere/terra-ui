import _ from 'lodash/fp'
import marked from 'marked'
import { lazy, Suspense } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { centeredSpinner } from 'src/components/icons'


const renderMarkdown = (text, renderers = {}) => marked(text, {
  renderer: Object.assign(new marked.Renderer(), renderers)
})

/**
 * WARNING: Be very careful when using custom renderers because they may override marked's built-in
 * content sanitization.
 * @param {string} children - markdown content
 * @param {Object} renderers - element-specific renderers
 * @param {Object} props - properties for wrapper div
 * @returns div containing rendered markdown
 * @constructor
 */
export const MarkdownViewer = ({ children, renderers, ...props }) => {
  const content = renderMarkdown(children, renderers)
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
  return h(Suspense, { fallback: centeredSpinner() }, [h(SimpleMDE, _.merge({
    options: {
      autofocus: true,
      renderingConfig: {
        singleLineBreaks: false
      },
      previewClass: ['editor-preview', 'markdown-body'],
      previewRender: renderMarkdown,
      status: false
    }
  }, props))])
}
