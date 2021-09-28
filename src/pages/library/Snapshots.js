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
    if (person.projectRole === 'data curator') {
      curators.push(person)
    } else if (person.correspondingContributor) {
      contacts.push(person)
    }
    contributors.push(person.contactName.replace(',,', ' '))
  }, snapshot.contributors)

  return {
    ...snapshot,
    project: _.get('0.dct:identifier', snapshot['TerraDCAT_ap:hasDataCollection']),
    lowerName: _.toLower(snapshot['dct:title']), lowerDescription: _.toLower(snapshot['dct:description']),
    lastUpdated: snapshot['dct:modified'] ? new Date(snapshot['dct:modified']) : null,
    dataType: _.getOr('N/A', 'TerraDCAT_ap:dataType', snapshot),
    contacts, curators, contributors
  }
}
