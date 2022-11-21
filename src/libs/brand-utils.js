import { brands } from 'src/libs/brands'
import { getConfig } from 'src/libs/config'
import * as Utils from 'src/libs/utils'


export const isBrand = brand => {
  return new RegExp(`^((dev|alpha|perf|staging)\\.)?${brand.hostName}$`).test(window.location.hostname)
}

export const isAnvil = () => isBrand(brands.anvil) || getConfig().isAnvil
export const isBaseline = () => isBrand(brands.baseline) || getConfig().isBaseline
export const isBioDataCatalyst = () => isBrand(brands.bioDataCatalyst) || getConfig().isBioDataCatalyst
// TODO: Deprecate Datastage (https://broadworkbench.atlassian.net/browse/SATURN-1414)
export const isDatastage = () => isBrand(brands.datastage) || getConfig().isDatastage
export const isElwazi = () => isBrand(brands.elwazi) || getConfig().isElwazi
export const isFirecloud = () => isBrand(brands.firecloud) || getConfig().isFirecloud
export const isProjectSingular = () => isBrand(brands.projectSingular) || getConfig().isProjectSingular
export const isRadX = () => isBrand(brands.radX) || getConfig().isRadX
export const isRareX = () => isBrand(brands.rareX) || getConfig().isRareX
export const isTerra = () => isBrand(brands.terra) || getConfig().isTerra ||
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
