import _ from 'lodash/fp'
import colors from 'src/libs/colors'


export const snapshotStyles = {
  access: {
    open: colors.success(1.5),
    controlled: colors.accent(),
    pending: '#F7981C'
  }
}

export const normalizeSnapshot = snapshot => {
  const contactNames = _.map(({ contactName, ...rest }) => ({
    contactName: _.flow(_.replace(/,|(,,)/g, ' '), _.replace(/\s([A-Z])\s/, ' $1. '))(contactName),
    ...rest
  }), snapshot.contributors)

  const curators = _.filter(({ projectRole }) => projectRole === 'data curator', contactNames)
  const contacts = _.filter('correspondingContributor', contactNames)
  const contributors = _.flow(
    _.without(curators),
    _.map('contactName')
  )(contactNames)

  const dataType = _.flow(
    _.getOr([], 'prov:wasGeneratedBy'),
    _.filter(_.get('TerraCore:hasAssayCategory')),
    _.flatMap('TerraCore:hasAssayCategory'),
    _.uniqBy(_.toLower)
  )(snapshot)

  const dataModality = _.flow(
    _.getOr([], 'prov:wasGeneratedBy'),
    _.filter(_.get('TerraCore:hasDataModality')),
    _.flatMap(({ 'TerraCore:hasDataModality': hasDataModality }) => hasDataModality),
    _.map(_.replace('TerraCoreValueSets:', '')),
    _.uniqBy(_.toLower)
  )(snapshot)

  return {
    ...snapshot,
    project: _.get('0.dct:title', snapshot['TerraDCAT_ap:hasDataCollection']),
    lowerName: _.toLower(snapshot['dct:title']), lowerDescription: _.toLower(snapshot['dct:description']),
    lastUpdated: snapshot['dct:modified'] ? new Date(snapshot['dct:modified']) : null,
    dataReleasePolicy: snapshot['TerraDCAT_ap:hasDataUsePermission'].replace('TerraCore:', '').replace(/([A-Z])/g, ' $1'),
    contacts, curators, contributors,
    dataType, dataModality,
    access: _.getOr('Open', 'access', snapshot)
  }
}
