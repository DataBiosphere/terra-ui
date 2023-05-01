import DOMPurify from 'dompurify';
import _ from 'lodash/fp';
import { marked } from 'marked';
import { lazy, Suspense, useMemo } from 'react';
import { div, h, p } from 'react-hyperscript-helpers';
import { centeredSpinner } from 'src/components/icons';

// Filtering copied from Github: https://github.com/gjtorikian/html-pipeline/blob/main/lib/html/pipeline/sanitization_filter.rb
const ALLOWED_ATTR = [
  'abbr',
  'accept',
  'accept-charset',
  'accesskey',
  'action',
  'align',
  'alt',
  'axis',
  'border',
  'cellpadding',
  'cellspacing',
  'char',
  'charoff',
  'charset',
  'checked',
  'clear',
  'cols',
  'colspan',
  'color',
  'compact',
  'coords',
  'datetime',
  'dir',
  'disabled',
  'enctype',
  'for',
  'frame',
  'headers',
  'height',
  'hreflang',
  'hspace',
  'ismap',
  'label',
  'lang',
  'maxlength',
  'media',
  'method',
  'multiple',
  'name',
  'nohref',
  'noshade',
  'nowrap',
  'open',
  'prompt',
  'readonly',
  'rel',
  'rev',
  'rows',
  'rowspan',
  'rules',
  'scope',
  'selected',
  'shape',
  'size',
  'span',
  'start',
  'summary',
  'tabindex',
  'target',
  'title',
  'type',
  'usemap',
  'valign',
  'value',
  'vspace',
  'width',
  'itemprop',
  // Github only allows the following attributes on certain tags, but dompurify doesn't support that, so just allow them
  'href',
  'src',
  'longdesc',
  'itemscope',
  'itemtype',
  'cite',
];
const ALLOWED_TAGS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'h7',
  'h8',
  'br',
  'b',
  'i',
  'strong',
  'em',
  'a',
  'pre',
  'code',
  'img',
  'tt',
  'div',
  'ins',
  'del',
  'sup',
  'sub',
  'p',
  'ol',
  'ul',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'blockquote',
  'dl',
  'dt',
  'dd',
  'kbd',
  'q',
  'samp',
  'var',
  'hr',
  'ruby',
  'rt',
  'rp',
  'li',
  'tr',
  'td',
  'th',
  's',
  'strike',
  'summary',
  'details',
];

DOMPurify.setConfig({ ALLOWED_TAGS, ALLOWED_ATTR });

const renderAndSanitizeMarkdown = (text, renderers = {}) =>
  DOMPurify.sanitize(
    marked(text, {
      renderer: Object.assign(new marked.Renderer(), renderers),
    })
  );

/**
 * @param {string} children - markdown content
 * @param {Object} renderers - element-specific renderers
 * @param {Object} props - properties for wrapper div
 * @returns div containing rendered markdown
 * @constructor
 */
export const MarkdownViewer = ({ children, renderers, ...props }) => {
  const content = renderAndSanitizeMarkdown(children, renderers);
  return div({
    className: 'markdown-body',
    ...props,
    dangerouslySetInnerHTML: { __html: content },
  });
};

export const FirstParagraphMarkdownViewer = ({ children, renderers, ...props }) => {
  let renderedFirstParagraph = false;
  const content = renderAndSanitizeMarkdown(children, {
    // See https://marked.js.org/using_pro#renderer for list of renderer methods.
    blockquote: () => '',
    checkbox: () => '',
    code: () => '',
    heading: () => '',
    hr: () => '',
    html: () => '',
    image: () => '',
    list: () => '',
    listitem: () => '',
    paragraph: (text) => {
      if (!renderedFirstParagraph) {
        renderedFirstParagraph = true;
        return text;
      }
      return '';
    },
    table: () => '',
    tablerow: () => '',
    tablecell: () => '',
    ...renderers,
  });

  return p({
    className: 'markdown-body',
    ...props,
    dangerouslySetInnerHTML: { __html: content },
  });
};

export const newWindowLinkRenderer = (href, title, text) => {
  return `<a href="${href}" ${title ? `title=${title}` : ''} target="_blank">${text}</a>`;
};

const SimpleMDE = lazy(() => import('react-simplemde-editor'));

/**
 * N.B. Make sure you memoize 'options' if you're passing any in to 'SimpleMDE'!
 */
export const MarkdownEditor = ({ options: rawOptions, placeholder, autofocus = true, ...props }) => {
  const options = useMemo(
    () =>
      _.merge(
        {
          placeholder,
          autofocus,
          renderingConfig: {
            singleLineBreaks: false,
          },
          previewClass: ['editor-preview', 'markdown-body'],
          previewRender: renderAndSanitizeMarkdown,
          status: false,
        },
        rawOptions
      ),
    [placeholder, autofocus, rawOptions]
  );

  return h(Suspense, { fallback: centeredSpinner() }, [h(SimpleMDE, { options, ...props })]);
};
