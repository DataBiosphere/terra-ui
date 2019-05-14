import '@webcomponents/custom-elements' // this needs to be first, basically only for FF ESR now

import { ClarityIcons } from '@clr/icons'
import '@clr/icons/clr-icons.css'
import '@clr/icons/shapes/all-shapes'
import _ from 'lodash/fp'
import { h, img } from 'react-hyperscript-helpers'
import arrowRight from 'src/icons/arrow-right.svg'
import cardMenuIcon from 'src/icons/card-menu-icon.svg'
import caretDown from 'src/icons/caret-down.svg'
import checkSquare from 'src/icons/check-square.svg'
import columnGrabber from 'src/icons/column_grabber.svg'
import creditCard from 'src/icons/credit-card.svg'
import listAlt from 'src/icons/list-alt.svg'
import loadingSpinner from 'src/icons/loading-spinner.svg'
import purchaseOrder from 'src/icons/purchase-order.svg'
import renameIcon from 'src/icons/rename-icon.svg'
import square from 'src/icons/square.svg'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'


ClarityIcons.add({
  arrowRight, cardMenuIcon, caretDown, checkSquare, columnGrabber, creditCard, listAlt, loadingSpinner,
  purchaseOrder, renameIcon, square
})

/**
 * Creates a Clarity icon.
 * @param {string} shape - see {@link https://vmware.github.io/clarity/icons/icon-sets}
 * @param {object} [props]
 */
export const icon = (shape, { className, ...props } = {}) => h('clr-icon', _.merge({ shape, class: className }, props))

export const breadcrumb = props => icon('angle right', _.merge({ size: 10, style: { margin: '0 0.25rem' } }, props))

export const spinner = props => icon('loadingSpinner', _.merge({ size: 24, style: { color: colors.primary(0.8) } }, props))

export const centeredSpinner = props => spinner(_.merge({ size: 48, style: { display: 'block', margin: 'auto' } }, props))

export const profilePic = ({ size, style, ...props } = {}) => img({
  src: getUser().imageUrl,
  height: size, width: size,
  style: { borderRadius: '100%', ...style },
  ...props
})
