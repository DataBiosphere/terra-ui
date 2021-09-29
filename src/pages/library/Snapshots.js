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
  const contacts = []
  const curators = []
  const contributors = []

  _.forEach(person => {
    person.contactName = person.contactName.replace(',,', ' ').replace(/,/g, ' ').replace(/\s([A-Z])\s/, ' $1. ')
    if (person.projectRole === 'data curator') {
      curators.push(person)
    } else if (person.correspondingContributor) {
      contacts.push(person)
    }
    contributors.push(person.contactName)
  }, snapshot.contributors)

  const dataType = _.flow(
    _.getOr([], 'prov:wasGeneratedBy'),
    _.filter(x => x.hasOwnProperty('TerraCore:hasAssayCategory')),
    _.flatMap('TerraCore:hasAssayCategory'),
    _.uniqBy(_.toLower)
  )(snapshot)

  const dataModality = _.flow(
    _.getOr([], 'prov:wasGeneratedBy'),
    _.filter(x => x.hasOwnProperty('TerraCore:hasDataModality')),
    _.flatMap(x => _.map(y => y.replace('TerraCoreValueSets:', ''), x['TerraCore:hasDataModality'])),
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
