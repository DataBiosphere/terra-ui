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
  const contributors = _.map(_.update('contactName', _.flow(
    _.replace(/,+/g, ' '),
    _.replace(/(^|\s)[A-Z](?=\s|$)/g, '$&.')
  )), snapshot.contributors)

  const [curators, rawContributors] = _.partition({ projectRole: 'data curator' }, contributors)
  const contacts = _.filter('correspondingContributor', contributors)
  const contributorNames = _.map('contactName', rawContributors)

  const dataType = _.flow(
    _.flatMap('TerraCore:hasAssayCategory'),
    _.compact,
    _.uniqBy(_.toLower)
  )(snapshot['prov:wasGeneratedBy'])

  const dataModality = _.flow(
    _.flatMap('TerraCore:hasDataModality'),
    _.compact,
    _.map(_.replace('TerraCoreValueSets:', '')),
    _.uniqBy(_.toLower)
  )(snapshot['prov:wasGeneratedBy'])

  const dataReleasePolicy = _.flow(
    _.replace('TerraCore:', ''),
    _.startCase
  )(snapshot['TerraDCAT_ap:hasDataUsePermission'])

  return {
    ...snapshot,
    project: _.get(['TerraDCAT_ap:hasDataCollection', 0, 'dct:title'], snapshot),
    lowerName: _.toLower(snapshot['dct:title']), lowerDescription: _.toLower(snapshot['dct:description']),
    lastUpdated: !!snapshot['dct:modified'] && new Date(snapshot['dct:modified']),
    dataReleasePolicy,
    contacts, curators, contributorNames,
    dataType, dataModality,
    access: snapshot.access || 'Open'
  }
}
