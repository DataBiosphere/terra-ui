import { Fragment } from 'react'
import { h, p, span } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import * as Utils from 'src/libs/utils'


export const deletePDText = () => {
  // TODO (PD): Add real text here
  return h(Fragment, [p({ style: { margin: '0px', lineHeight: '1.5rem' } }, [
    'Deleting your runtime will also ',
    span({ style: { fontWeight: 600 } }, ['delete any files on the associated hard disk ']),
    '(e.g. input data or analysis outputs) and installed packages. To permanently save these files, ',
    h(Link, {
      href: 'https://support.terra.bio/hc/en-us/articles/360026639112',
      ...Utils.newTabLinkProps
    }, ['move them to the workspace bucket.'])
  ]),
  p({ style: { margin: '14px 0px 0px', lineHeight: '1.5rem' } },
    ['Deleting your runtime will stop all running notebooks and associated costs. You can recreate your runtime later, ' +
      'which will take several minutes.'])])
}
