/* eslint-disable import/no-amd */
/* global $, define */
define([
  'base/js/namespace',
  'base/js/promises'
], (
  Jupyter,
  promises
) => {
  function closeNotebook() {
    Jupyter.notebook.shutdown_kernel({ confirm: false })
    window.parent.postMessage('close', '*')
  }

  function loadIpythonExtension() {
    // hide header
    // $('#header-container').hide() // NOTE: disabled until we have better solutions for displaying save-status

    // remove menu items
    $('#new_notebook').remove()
    $('#open_notebook').remove()
    $('#file_menu .divider').first().remove()
    $('#toggle_header').remove()

    // override close menu action
    $('#close_and_halt').on('click', closeNotebook)

    // add close button
    $('#menubar-container > div').wrapAll('<div style="max-width: calc(100% - 40px)">')

    $('#menubar-container')
      .css('display', 'flex')
      .append(
        '<style>' +
        '#menubar-close-button { margin-left: 20px; margin-top: -5px; align-self: center; width: 30px; height: 30px; fill: currentColor; flex: none; color: #5c912e; }' +
        '#menubar-close-button:hover { text-decoration: none; color: #74ae43; }' +
        '</style>',

        '<a href="#" id="menubar-close-button" title="Shutdown this notebook\'s kernel, and close this window">' +
        // times-circle from Clarity
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">' +
        '<path d="M19.61 18l4.86-4.86a1 1 0 0 0-1.41-1.41l-4.86 4.81-4.89-4.89a1 1 0 0 0-1.41 1.41L16.78 18 12 22.72a1 1 0 1 0 1.41 1.41l4.77-4.77 4.74 4.74a1 1 0 0 0 1.41-1.41z"/>' +
        '<path d="M18 34a16 16 0 1 1 16-16 16 16 0 0 1-16 16zm0-30a14 14 0 1 0 14 14A14 14 0 0 0 18 4z"/>' +
        '</svg>' +
        '</a>'
      )

    $('#menubar-close-button').on('click', closeNotebook)

    // frequent autosave
    promises.notebook_loaded.then(() => {
      Jupyter.notebook.set_autosave_interval(15000)
    })

    // listen for explicit save command
    window.addEventListener('message', e => {
      if (e.data === 'save') {
        Jupyter.notebook.save_notebook()
      }
    })

    // report save status up
    Jupyter.notebook.save_widget.events.on('set_dirty.Notebook', (event, data) => {
      window.parent.postMessage(data.value ? 'dirty' : 'saved', '*')
    })
  }

  return {
    load_ipython_extension: loadIpythonExtension
  }
})
