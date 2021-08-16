import colors from "src/libs/colors";
import {a, div, h, label} from "react-hyperscript-helpers";
import {centeredSpinner, icon} from "src/components/icons";
import {UnmountClosed as RCollapse} from "react-collapse";
import _ from "lodash/fp";
import {Fragment, useState} from "react";
import {Clickable, IdContainer, Link, Select} from "src/components/common";
import FooterWrapper from "src/components/FooterWrapper";
import {libraryTopMatter} from "src/components/library-common";
import {DelayedSearchInput} from "src/components/input";
import * as Utils from "src/libs/utils";
import * as Nav from "src/libs/nav";
import * as Style from "src/libs/style";
import covidBg from "src/images/library/showcase/covid-19.jpg";
import gatkLogo from "src/images/library/showcase/gatk-logo-light.svg";
import featuredBg from "src/images/library/showcase/featured-workspace.svg";

export const styles = {
    column: { marginRight: '1.5rem', flex: '1 1 0px', maxWidth: 415 },
    header: {
        fontSize: 19, color: colors.dark(), fontWeight: 'bold',
        marginBottom: '1rem'
    },
    sidebarRow: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'
    },
    nav: {
        background: {
            position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
            overflow: 'auto', cursor: 'pointer'
        },
        container: state => ({
            ...(state === 'entered' ? {} : { opacity: 0, transform: 'translate(-2rem)' }),
            transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
            display: 'flex', flexDirection: 'column'
        }),
        navSection: {
            alignItems: 'center', flex: 'none', padding: '1.2rem 0', fontWeight: 700,
            borderTop: `1px solid ${colors.dark(0.35)}`
        }
    },
    pill: {
        width: '4.5rem', padding: '0.25rem', fontWeight: 500, textAlign: 'center',
        border: '1px solid', borderColor: colors.dark(0.25), borderRadius: '1rem',
        backgroundColor: 'white'
    },
    pillHighlight: {
        color: 'white', backgroundColor: colors.primary(1), borderColor: colors.primary(1)
    }
}

// collapsible section for sidebar categories
const SidebarCollapser = ({ title, isOpened, onClick, children }) => {
    return div({
        role: 'group'
    }, [
        h(NavItem, {
            onClick,
            style: { ...styles.sidebarRow, ...styles.nav.navSection }
        }, [
            title,
            div({ style: { flexGrow: 1 } }),
            icon(isOpened ? 'angle-up' : 'angle-down', { size: 18, style: { flex: 'none' } })
        ]),
        div({
            style: { flex: 'none' }
        }, [h(RCollapse, { isOpened }, [children])])
    ])
}

const NavItem = ({ children, ...props }) => {
    return h(Clickable, _.merge({
        style: { display: 'flex', alignItems: 'center', outlineOffset: -4 }
    }, props), [children])
}

export const Pill = ({ count, highlight }) => {
    return div({
        style: _.merge(styles.pill, highlight ? styles.pillHighlight : {})
    }, [count])
}

const uniqueSidebarTags = sidebarSections => {
    return _.flow([
        _.flatMap(s => _.map(_.toLower, s.labels)),
        _.uniq
    ])(sidebarSections)
}

export const groupByFeaturedTags = (workspaces, sidebarSections) => {
    return _.flow([
        _.map(tag => [tag, _.filter(w => _.includes(tag, w.tags.items), workspaces)]),
        _.fromPairs
    ])(uniqueSidebarTags(sidebarSections))
}

export const Sidebar = ({ onSectionFilter, onTagFilter, sections, selectedSections, selectedTags, workspacesByTag }) => {
    const [collapsedSections, setCollapsedSections] = useState([])

    const unionSectionWorkspaces = section => {
        return _.uniq(_.flatMap(tag => workspacesByTag[tag], section.tags))
    }

    return div({ style: { display: 'flex', flexDirection: 'column' } }, [
        _.map(section => {
            return section.keepCollapsed ?
                h(Clickable, {
                    key: section.name,
                    onClick: () => onSectionFilter(section),
                    style: { ...styles.sidebarRow, ...styles.nav.navSection }
                }, [
                    div({ style: { flex: 1 } }, [section.name]),
                    h(Pill, {
                        count: _.size(unionSectionWorkspaces(section)),
                        highlight: _.includes(section, selectedSections)
                    })
                ]) :
                h(SidebarCollapser,
                    {
                        key: section.name,
                        title: section.name,
                        onClick: () => setCollapsedSections(_.xor([section], collapsedSections)),
                        isOpened: !_.includes(section, collapsedSections)
                    },
                    [
                        ..._.map(label => {
                            const tag = _.toLower(label)
                            return h(Clickable, {
                                style: { display: 'flex', alignItems: 'baseline', margin: '0.5rem 0' },
                                onClick: () => onTagFilter(tag)
                            }, [
                                div({ style: { flex: 1 } }, [label]),
                                h(Pill, {
                                    count: _.size(workspacesByTag[tag]),
                                    highlight: _.includes(tag, selectedTags)
                                })
                            ])
                        }, section.labels)
                    ]
                )
        }, sections)
    ])
}

export const SearchAndFilterTopLevelComponent = (featuredList, workspacesByTag, sections, sidebarSections) => {

    const [selectedSections, setSelectedSections] = useState([])
    const [selectedTags, setSelectedTags] = useState([])
    const [searchFilter, setSearchFilter] = useState()
    const [sort, setSort] = useState('most recent')

    const sortWorkspaces = Utils.cond(
        [sort === 'most recent', () => _.orderBy(['created'], ['desc'])],
        [sort === 'alphabetical', () => _.orderBy(w => _.toLower(_.trim(w.name)), ['asc'])],
        () => _.identity
    )

    const filterBySections = workspaces => {
        if (_.isEmpty(selectedSections)) {
            return workspaces
        } else {
            const tags = _.uniq(_.flatMap(section => section.tags, selectedSections))
            return _.uniq(_.flatMap(tag => workspacesByTag[tag], tags))
        }
    }
    // eslint-disable-next-line lodash-fp/no-single-composition
    const filterByTags = workspaces => _.flow(_.map(tag => _.intersection(workspacesByTag[tag]), selectedTags))(workspaces)
    const filterByText = workspaces => {
        const lowerSearch = _.toLower(searchFilter)
        return _.isEmpty(lowerSearch) ?
            workspaces :
            _.filter(workspace => _.includes(lowerSearch, workspace.lowerName) || _.includes(lowerSearch, workspace.lowerDescription), workspaces)
    }
    const filteredWorkspaces = _.flow([
        filterBySections,
        filterByTags,
        filterByText
    ])(featuredList)

    return h(FooterWrapper, { alwaysShow: true }, [
        libraryTopMatter('featured workspaces'),
        !featuredList ?
            centeredSpinner() :
            h(Fragment, [
                div({ style: { display: 'flex', margin: '1rem 1rem 0', alignItems: 'baseline' } }, [
                    div({ style: { width: '19rem', flex: 'none' } }, [
                        div({ style: styles.sidebarRow }, [
                            div({ style: styles.header }, 'Featured workspaces'),
                            h(Pill, {
                                count: _.size(filteredWorkspaces),
                                highlight: _.isEmpty(selectedSections) && _.isEmpty(selectedTags)
                            })
                        ]),
                        div({ style: { display: 'flex', alignItems: 'center', height: '2.5rem' } }, [
                            div({ style: { flex: 1 } }),
                            h(Link, {
                                onClick: () => setSelectedTags([])
                            }, ['clear'])
                        ])
                    ]),
                    h(DelayedSearchInput, {
                        style: { flex: 1, marginLeft: '1rem' },
                        'aria-label': 'Search Featured Workspaces',
                        placeholder: 'Search Name or Description',
                        value: searchFilter,
                        onChange: setSearchFilter
                    }),
                    h(IdContainer, [
                        id => h(Fragment, [
                            label({ htmlFor: id, style: { margin: '0 0.5rem 0 1rem', whiteSpace: 'nowrap' } }, ['Sort by']),
                            h(Select, {
                                id,
                                isClearable: false,
                                isSearchable: false,
                                styles: { container: old => ({ ...old, width: '10rem' }) },
                                value: sort,
                                onChange: v => setSort(v.value),
                                options: ['most recent', 'alphabetical']
                            })
                        ])
                    ])
                ]),
                div({ style: { display: 'flex', margin: '0 1rem' } }, [
                    div({ style: { width: '19rem', flex: 'none' } }, [
                        h(Sidebar, {
                            onSectionFilter: section => setSelectedSections(_.xor([section], selectedSections)),
                            onTagFilter: tag => setSelectedTags(_.xor([tag], selectedTags)),
                            sections,
                            selectedSections,
                            selectedTags,
                            workspacesByTag: groupByFeaturedTags(filteredWorkspaces, sidebarSections)
                        })
                    ]),
                    div({ style: { marginLeft: '1rem', minWidth: 0 } }, [
                        ..._.map(makeCard(), sortWorkspaces(filteredWorkspaces))
                    ])
                ])
            ])
    ])
}

const makeCard = variant => workspace => {
    const { namespace, name, created, description } = workspace
    return a({
        href: Nav.getLink('workspace-dashboard', { namespace, name }),
        style: {
            backgroundColor: 'white',
            height: 175,
            borderRadius: 5,
            display: 'flex',
            marginBottom: '1rem',
            boxShadow: Style.standardShadow
        }
    }, [
        div({
            style: {
                backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: 'auto 100%', borderRadius: '5px 0 0 5px',
                width: 87,
                ...Utils.cond(
                    [name.toLowerCase().includes('covid'), () => ({ backgroundImage: `url(${covidBg})` })],
                    [variant === 'gatk', () => ({ backgroundColor: '#333', backgroundImage: `url(${gatkLogo})`, backgroundSize: undefined })],
                    () => ({ backgroundImage: `url(${featuredBg})`, opacity: 0.75 })
                )
            }
        }),
        div({ style: { flex: 1, minWidth: 0, padding: '15px 20px', overflow: 'hidden' } }, [
            div({ style: { display: 'flex' } }, [
                div({ style: { flex: 1, color: colors.accent(), fontSize: 16, lineHeight: '20px', height: 40, marginBottom: 7 } }, [name]),
                created && div([Utils.makeStandardDate(created)])
            ]),
            div({ style: { lineHeight: '20px', height: 100, whiteSpace: 'pre-wrap', overflow: 'hidden' } }, [description])
            // h(MarkdownViewer, [description]) // TODO: should we render this as markdown?
        ])
    ])
}




