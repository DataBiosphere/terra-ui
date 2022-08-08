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
export const isRadX = () => (window.location.hostname === brands.radX.hostName) || getConfig().isRadX
export const isRareX = () => (window.location.hostname === brands.rareX.hostName) || getConfig().isRareX
export const isTerra = () => (window.location.hostname === brands.terra.hostName) || getConfig().isTerra ||
  (!isFirecloud() && !isDatastage() && !isAnvil() && !isBioDataCatalyst() && !isBaseline() && !isElwazi() && !isProjectSingular() && !isRadX() && !isRareX())

export const getEnabledBrand = () => Utils.cond(
  [isAnvil(), () => brands.anvil],
  [isBaseline(), () => brands.baseline],
  [isBioDataCatalyst(), () => brands.bioDataCatalyst],
  [isDatastage(), () => brands.datastage],
  [isElwazi(), () => brands.elwazi],
  [isFirecloud(), () => brands.firecloud],
  [isProjectSingular(), () => brands.projectSingular],
  [isRadX(), () => brands.radX],
  [isRareX(), () => brands.rareX],
  [isTerra(), () => brands.terra],
  () => brands.terra
)

export const pickBrandLogo = (color = false) => {
  const { logos } = getEnabledBrand()
  return color ? logos.color : logos.white
}
