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
  return {
    ...snapshot,
    project: _.get('0.dct:identifier', snapshot['TerraDCAT_ap:hasDataCollection']),
    lowerName: _.toLower(snapshot['dct:title']), lowerDescription: _.toLower(snapshot['dct:description']),
    lastUpdated: snapshot['dct:modified'] ? new Date(snapshot['dct:modified']) : null,
    dataType: _.getOr('N/A', 'TerraDCAT_ap:dataType', snapshot)
  }
}
