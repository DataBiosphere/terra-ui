import _ from 'lodash/fp'
import { div, h, label } from 'react-hyperscript-helpers'
import { IdContainer, Select } from 'src/components/common'

// Additional references supported by Terra that are not included in IGV
const terraReferences = {
  'MN908947.3': {
    id: 'sarsCov2RefId.3', indexed: false,
    fastaURL: 'https://storage.googleapis.com/gcp-public-data--broad-references/sars-cov-2/MN908947.3/nCoV-2019.reference.fasta'
  }
}

// The reference genome can be specified using either a 'reference' object or,
// for IGV-hosted references, a 'genome' ID.
// https://github.com/igvteam/igv.js/wiki/Reference-Genome
const igvAvailableReferences = _.map(
  id => {
    return _.has(id, terraReferences) ?
      { label: id, value: { reference: terraReferences[id] } } :
      { label: id, value: { genome: id } }
  },
  [
    'hg38',
    'hg19',
    'hg18',
    'MN908947.3',
    'ASM985889v3',
    'mm10',
    'panTro4',
    'panPan2',
    'susScr11',
    'bosTau8',
    'canFam3',
    'rn6',
    'danRer10',
    'dm6',
    'sacCer3'
  ]
)

export const defaultIgvReference = { genome: 'hg38' }

const IGVReferenceSelector = ({ value, onChange }) => {
  return h(IdContainer, [id => div([
    label({ htmlFor: id, style: { fontWeight: 500 } }, ['Reference genome: ']),
    div({ style: { display: 'inline-block', marginLeft: '0.25rem', marginBottom: '1rem', minWidth: 125 } }, [
      h(Select, {
        id,
        options: igvAvailableReferences,
        value,
        onChange: ({ value }) => onChange(value)
      })
    ])
  ])])
}

export default IGVReferenceSelector
