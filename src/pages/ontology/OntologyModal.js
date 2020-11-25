import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h, li, ul } from 'react-hyperscript-helpers'
import { spinnerOverlay } from 'src/components/common'
import { ConfirmedSearchInput } from 'src/components/input'
import { withModalDrawer } from 'src/components/ModalDrawer'
import TitleBar from 'src/components/TitleBar'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withDisplayName } from 'src/libs/utils'


const includedOntologies = [
  {
    title: 'NCI Thesaurus OBO Edition',
    acronym: 'ncit',
    description: `The NCIt OBO Edition project aims to increase integration of the
      NCIt with OBO Library ontologies. NCIt is a reference terminology that includes
      broad coverage of the cancer domain, including cancer related diseases, findings
      and abnormalities. NCIt OBO Edition releases should be considered experimental.`
  },
  {
    title: 'Data Use Ontology',
    acronym: 'duo',
    description: div([
      div([`DUO is an ontology which represent data use conditions.
        DUO allows to semantically tag datasets with restriction about their
        usage, making them discoverable automatically based on the authorization
        level of users, or intended usage.`]),
      div({ style: { marginTop: '1rem' } }, [
        `This resource is based on the OBO Foundry principles, and developed using
        the W3C Web Ontology Language. It is used in production by the European
        Genome-phenome Archive (EGA) at EMBL-EBI as well as the Broad Institute
        for the Data Use Oversight System (DUOS).\t`
      ])
    ])
  }
]

const AboutOntologySearch = () => {
  return div([
    div({ style: { fontWeight: 600 } }, ['About Ontology Search']),
    div({ style: { marginTop: '1rem' } }, [
      `This experimental terra-embedded ontology search uses neo4j to deliver definitions
      and other metadata such as relationships, synonyms, and ontological code for your search term.`
    ]),
    div({ style: { marginTop: '1rem' } }, [
      `Built as part of the 2020 DSP Jamboree.`
    ]),
    div({ style: { marginTop: '1.5rem', borderBottom: `1px solid ${colors.dark(0.55)}` } }),
    div({ style: { marginTop: '1rem', fontWeight: 600 } }, ['Included ontologies']),
    includedOntologies.map((ontology, i) => div({
      key: i,
      style: {
        padding: '1rem',
        borderRadius: 8,
        backgroundColor: 'white',
        marginTop: '1rem'
      }
    }, [
      div({ style: { display: 'flex', alignItems: 'center' } }, [
        div({
          style: {
            backgroundColor: colors.primary(0.5),
            padding: '0.35rem 1.5rem',
            fontWeight: 600,
            borderRadius: 15,
            textTransform: 'uppercase'
          }
        }, [ontology.acronym]),
        div({ style: { paddingLeft: '0.5rem', fontWeight: 600 } }, [ontology.title])
      ]),
      div({ style: { marginTop: '1rem' } }, [ontology.description])
    ]))
  ])
}

const OntologySearch = ({ searchTerm }) => {
  const [data, setData] = useState(undefined)
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState(undefined)
  const loadData = async () => {
    setSubmittedSearchTerm(searchTerm)
    const response = await Ajax().Neo4j.searchOntology(searchTerm)
    setData(response)
  }
  if (searchTerm !== submittedSearchTerm) {
    loadData()
  }
  return div([
    data ? (data.records.length !== 0 ? data.records.map((r, i) => div({ key: i }, [
      _.toPairs(r.toObject()).map((k, j) => div({ key: j }, [
        div({ style: { fontWeight: 600, paddingTop: '.5rem' } }, [
          k[0],
          ':'
        ]),
        div([
          _.isArray(k[1]) ? ul({ style: { listStyleType: 'none', padding: 0, margin: 0 } }, _.uniq(_.flatMap(v => v, k[1])).map(value => li([value]))) : k[1]
        ])
      ])),
      i < data.records.length - 1 && div({ style: { marginTop: '1.5rem', borderBottom: `1px solid ${colors.dark(0.55)}` } })
    ])) : div([
      `No results found for: '${searchTerm}'`
    ])) : spinnerOverlay
  ])
}


export const OntologyModal = _.flow(withDisplayName('OntologyModal'), withModalDrawer())(({ onDismiss }) => {
  const [ontologyTerm, setOntologyTerm] = useState('')
  return div({ style: { padding: '2rem' } }, [
    h(TitleBar, {
      style: { marginBottom: '0.5rem' },
      title: 'Ontology Search',
      onDismiss,
      onPrevious: () => setOntologyTerm('')
    }),
    h(ConfirmedSearchInput, {
      'aria-label': 'Enter Term',
      placeholder: 'Enter Term',
      onChange: setOntologyTerm
    }),
    div({ style: { paddingTop: '1rem' } }, [
      _.trim(ontologyTerm).length === 0 ?
        h(AboutOntologySearch) :
        h(OntologySearch, { searchTerm: ontologyTerm })
    ])
  ])
})
