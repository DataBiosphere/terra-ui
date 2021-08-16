import colors from "src/libs/colors";
import {div, h} from "react-hyperscript-helpers";
import {icon} from "src/components/icons";
import {UnmountClosed as RCollapse} from "react-collapse";
import _ from "lodash/fp";
import {useState} from "react";
import {Clickable} from "src/components/common";

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
export const SidebarCollapser = ({ title, isOpened, onClick, children }) => {
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

export const NavItem = ({ children, ...props }) => {
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



