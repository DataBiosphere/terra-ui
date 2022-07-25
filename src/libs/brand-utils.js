import anvilLogo from 'src/images/brands/anvil/ANVIL-Logo.svg'
import anvilLogoWhite from 'src/images/brands/anvil/ANVIL-Logo-White.svg'
import baselineLogo from 'src/images/brands/baseline/baseline-logo-color.svg'
import baselineLogoWhite from 'src/images/brands/baseline/baseline-logo-white.svg'
import bioDataCatalystLogo from 'src/images/brands/bioDataCatalyst/bioDataCatalyst-Logo-color.svg'
import bioDataCatalystLogoWhite from 'src/images/brands/bioDataCatalyst/bioDataCatalyst-Logo-white.svg'
import datastageLogo from 'src/images/brands/datastage/DataSTAGE-Logo.svg'
import datastageLogoWhite from 'src/images/brands/datastage/DataSTAGE-Logo-White.svg'
import elwaziLogo from 'src/images/brands/elwazi/elwazi-logo-color.svg'
import elwaziLogoWhite from 'src/images/brands/elwazi/elwazi-logo-white.svg'
import fcLogo from 'src/images/brands/firecloud/FireCloud-Logo.svg'
import fcLogoWhite from 'src/images/brands/firecloud/FireCloud-Logo-White.svg'
import projectSingularLogo from 'src/images/brands/projectSingular/project-singular-logo-black.svg'
import projectSingularLogoWhite from 'src/images/brands/projectSingular/project-singular-logo-white.svg'
import rareXLogo from 'src/images/brands/rareX/rarex-logo-color.svg'
import rareXLogoWhite from 'src/images/brands/rareX/rarex-logo-white.svg'
import { brands } from 'src/libs/brands'
import { getConfig } from 'src/libs/config'
import * as Utils from 'src/libs/utils'


export const isAnvil = () => (window.location.hostname === brands.anvil.hostName) || getConfig().isAnvil
export const isBaseline = () => (window.location.hostname === brands.baseline.hostName) || getConfig().isBaseline
export const isBioDataCatalyst = () => (window.location.hostname === brands.bioDataCatalyst.hostName) || getConfig().isBioDataCatalyst
// TODO: Deprecate Datastage (https://broadworkbench.atlassian.net/browse/SATURN-1414)
export const isDatastage = () => (window.location.hostname === brands.datastage.hostName) || getConfig().isDatastage
export const isElwazi = () => (window.location.hostname === brands.elwazi.hostName) || getConfig().isElwazi
export const isFirecloud = () => (window.location.hostname === brands.firecloud.hostName) || getConfig().isFirecloud
export const isProjectSingular = () => (window.location.hostname === brands.projectSingular.hostName) || getConfig().isProjectSingular
export const isRareX = () => (window.location.hostname === brands.rareX.hostName) || getConfig().isRareX
export const isTerra = () => (window.location.hostname === brands.terra.hostName) || getConfig().isTerra ||
  (!isFirecloud() && !isDatastage() && !isAnvil() && !isBioDataCatalyst() && !isBaseline() && !isElwazi() && !isProjectSingular() && !isRareX())

export const getEnabledBrand = () => Utils.cond(
  [isAnvil(), () => brands.anvil],
  [isBaseline(), () => brands.baseline],
  [isBioDataCatalyst(), () => brands.bioDataCatalyst],
  [isDatastage(), () => brands.datastage],
  [isElwazi(), () => brands.elwazi],
  [isFirecloud(), () => brands.firecloud],
  [isProjectSingular(), () => brands.projectSingular],
  [isRareX(), () => brands.rareX],
  [isTerra(), () => brands.terra],
  () => brands.terra
)

export const pickBrandLogo = (color = false) => Utils.cond(
  [isFirecloud(), () => color ? fcLogo : fcLogoWhite],
  [isDatastage(), () => color ? datastageLogo : datastageLogoWhite],
  [isAnvil(), () => color ? anvilLogo : anvilLogoWhite],
  [isBioDataCatalyst(), () => color ? bioDataCatalystLogo : bioDataCatalystLogoWhite],
  [isBaseline(), () => color ? baselineLogo : baselineLogoWhite],
  [isElwazi(), () => color ? elwaziLogo : elwaziLogoWhite],
  [isProjectSingular(), () => color ? projectSingularLogo : projectSingularLogoWhite],
  [isRareX(), () => color ? rareXLogo : rareXLogoWhite]
)
