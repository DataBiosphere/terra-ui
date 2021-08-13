import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import FooterWrapper from 'src/components/FooterWrapper'
import { DelayedSearchInput } from 'src/components/input'
import { libraryTopMatter } from 'src/components/library-common'
import {textMatch} from "src/libs/utils";


const DataBrowser = () => {
  const items = ['test1', 'test2']

  const [searchFilter, setSearchFilter] = useState()

  const filterBySearch = items => {
    const lowerSearch = _.toLower(searchFilter)
    return _.isEmpty(lowerSearch) ? items : _.filter(item => textMatch(searchFilter, item), items)
  }

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter('browse & explore'),
    h(DelayedSearchInput, {
      style: { flex: 1, marginLeft: '1rem' },
      'aria-label': 'Search Featured Workspaces',
      placeholder: 'Search Name or Description',
      value: searchFilter,
      onChange: setSearchFilter
    }),
    h(Fragment, filterBySearch(items))
  ])
}

export const navPaths = [{
  name: 'library-browser',
  path: '/library/browser',
  component: DataBrowser,
  title: 'Browse & Explore'
}]
