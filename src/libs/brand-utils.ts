import _ from 'lodash/fp'
import { BrandConfiguration, brands, defaultBrand } from 'src/libs/brands'
import { getConfig } from 'src/libs/config'
import { getCurrentUrl } from 'src/libs/nav'


export const isBrand = (brand: BrandConfiguration): boolean => {
  const currentHostname = getCurrentUrl().hostname
  return new RegExp(`^((dev|alpha|staging)\\.)?${brand.hostName}$`).test(currentHostname)
}

export const getEnabledBrand = (): BrandConfiguration => {
  const forcedBrand: string = getConfig().brand

  if (!!forcedBrand && _.has(forcedBrand, brands)) {
    return brands[forcedBrand]
  }

  if (!_.isNil(forcedBrand)) {
    console.warn(`'${forcedBrand}' is not a valid co-brand. Defaulting to '${_.toLower(defaultBrand.name)}'.`) // eslint-disable-line no-console
    console.log(`Valid co-brands are '${_.join("', '", _.keys(brands))}'.`) // eslint-disable-line no-console
  }

  const brandFromHostName = _.findKey(isBrand, brands)

  return (brandFromHostName && brands[brandFromHostName]) || defaultBrand
}

export const pickBrandLogo = (color: boolean = false): string => {
  const { logos } = getEnabledBrand()
  return color ? logos.color : logos.white
}

export const isAnvil = () => getEnabledBrand() === brands.anvil
export const isBaseline = () => getEnabledBrand() === brands.baseline
export const isBioDataCatalyst = () => getEnabledBrand() === brands.bioDataCatalyst
// TODO: Deprecate Datastage (https://broadworkbench.atlassian.net/browse/SATURN-1414)
export const isDatastage = () => getEnabledBrand() === brands.datastage
export const isElwazi = () => getEnabledBrand() === brands.elwazi
export const isFirecloud = () => getEnabledBrand() === brands.firecloud
export const isProjectSingular = () => getEnabledBrand() === brands.projectSingular
export const isRadX = () => getEnabledBrand() === brands.radX
export const isRareX = () => getEnabledBrand() === brands.rareX
export const isTerra = () => getEnabledBrand() === brands.terra
