import '@webcomponents/custom-elements' // must be before icons
import { ClarityIcons } from '@clr/icons'
import '@clr/icons/clr-icons.css'
import '@clr/icons/shapes/essential-shapes'
import mixinDeep from 'mixin-deep'
import { Fragment } from 'react'
import { div, h, style } from 'react-hyperscript-helpers'
import { logoIcon, table } from 'src/libs/custom-icons'
import * as Style from 'src/libs/style'


/**
 * Creates a Clarity icon.
 * @param {string} shape - see {@link https://vmware.github.io/clarity/icons/icon-sets}
 * @param {object} [props]
 */
export const icon = function(shape, props) {
  return h('clr-icon', mixinDeep({ shape }, props))
}

/**
 * Creates a breadcrumb icon.
 * @param {object} [props]
 */
export const breadcrumb = function(props) {
  return icon('angle right', mixinDeep({ size: 10, style: { padding: '0 0.25rem' } }, props))
}

export const logo = function(props) {
  return icon('logoIcon', mixinDeep({ size: 48, style: { marginRight: '0.5rem' } }, props))
}

export const loadingIndicator = function(backgroundColor) {
  return h(Fragment, [
    style({}, `.loader {
  font-size: 10px;
  margin: 50px auto;
  text-indent: -9999em;
  width: 11em;
  height: 11em;
  border-radius: 50%;
  background: ${Style.colors.primary};
  background: -moz-linear-gradient(left, ${Style.colors.primary} 10%, rgba(255, 255, 255, 0) 42%);
  background: -webkit-linear-gradient(left, ${Style.colors.primary} 10%, rgba(255, 255, 255, 0) 42%);
  background: -o-linear-gradient(left, ${Style.colors.primary} 10%, rgba(255, 255, 255, 0) 42%);
  background: -ms-linear-gradient(left, ${Style.colors.primary} 10%, rgba(255, 255, 255, 0) 42%);
  background: linear-gradient(to right, ${Style.colors.primary} 10%, rgba(255, 255, 255, 0) 42%);
  position: relative;
  -webkit-animation: load3 1.4s infinite linear;
  animation: load3 1.4s infinite linear;
  -webkit-transform: translateZ(0);
  -ms-transform: translateZ(0);
  transform: translateZ(0);
}
.loader:before {
  width: 50%;
  height: 50%;
  background: ${Style.colors.primary};
  border-radius: 100% 0 0 0;
  position: absolute;
  top: 0;
  left: 0;
  content: '';
}
.loader:after {
  background: ${backgroundColor};
  width: 75%;
  height: 75%;
  border-radius: 50%;
  content: '';
  margin: auto;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}
@-webkit-keyframes load3 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
@keyframes load3 {
  0% {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}`),
    div({ className: 'loader' })
  ])
}

ClarityIcons.add({ logoIcon, table })
