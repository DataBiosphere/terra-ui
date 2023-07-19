import type { DraggableSyntheticListeners, UniqueIdentifier } from '@dnd-kit/core';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import _ from 'lodash/fp';
import type { CSSProperties, PropsWithChildren } from 'react';
import { createContext, Fragment, useContext, useMemo } from 'react';
import { div, h, label, span } from 'react-hyperscript-helpers';
import { AutoSizer, List } from 'react-virtualized';
import { Checkbox, IdContainer } from 'src/components/common';
import { icon } from 'src/components/icons';
import TooltipTrigger from 'src/components/TooltipTrigger';
import * as Style from 'src/libs/style';

interface BaseItem {
  id: UniqueIdentifier;
  name: string;
  visible: boolean;
}

interface SortableListProps<T extends BaseItem> {
  items: T[];
  onChange(items: T[]): void;
  toggleVisibility(index: number): void;
}

function customCoordinatesGetter(event, args) {
  const { currentCoordinates } = args;
  const delta = 30;

  if (event.code === 'Down' || event.code === 'ArrowDown') {
    if (!args.context.over) {
      return {
        ...currentCoordinates,
        y: currentCoordinates.y - delta,
      };
    }
    return {
      ...currentCoordinates,
      y: currentCoordinates.y + delta,
    };
  }

  if (event.code === 'Up' || event.code === 'ArrowUp') {
    if (!args.context.over) {
      return {
        ...currentCoordinates,
        y: currentCoordinates.y + delta,
      };
    }
    return {
      ...currentCoordinates,
      y: currentCoordinates.y - delta,
    };
  }
  return undefined;
}

interface SortableItemProps {
  id: UniqueIdentifier;
}

interface Context {
  attributes: Record<string, any>;
  listeners: DraggableSyntheticListeners;

  ref(node: HTMLElement | null): void;
}

const SortableItemContext = createContext<Context>({
  attributes: {},
  listeners: undefined,
  ref() {},
});

function SortableItem({ children, id }: PropsWithChildren<SortableItemProps>) {
  const { attributes, isDragging, listeners, setNodeRef, setActivatorNodeRef, transform, transition } = useSortable({
    animateLayoutChanges: () => false,
    id,
  });
  const context = useMemo(
    () => ({
      attributes,
      listeners,
      ref: setActivatorNodeRef,
    }),
    [attributes, listeners, setActivatorNodeRef]
  );
  const style: CSSProperties = {
    opacity: isDragging ? 0.4 : undefined,
    transform: CSS.Translate.toString(transform),
    transition,
    display: 'flex',
  };

  return h(SortableItemContext.Provider, { value: context }, [div({ ref: setNodeRef, style }, [children])]);
}

const styles = {
  columnHandle: {
    paddingRight: '0.25rem',
    cursor: 'move',
    display: 'flex',
    alignItems: 'center',
  },
};

function DragHandle() {
  // attributes include aria roles to make drag and drop keyboard accessible.
  // ref is setActivatorNodeRef
  const { attributes, listeners, ref } = useContext(SortableItemContext);
  return div({ ref, ...attributes, ...listeners, style: styles.columnHandle }, [
    icon('columnGrabber', { style: { transform: 'rotate(90deg)' } }),
  ]);
}

export const ColumnSettingsList = <T extends BaseItem>({ items, onChange, toggleVisibility }: SortableListProps<T>) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: customCoordinatesGetter,
      scrollBehavior: 'smooth',
    })
  );

  const onDragEnd = ({ active, over }) => {
    if (over && active.id !== over?.id) {
      const activeIndex = items.findIndex(({ id }) => id === active.id);
      const overIndex = items.findIndex(({ id }) => id === over.id);

      onChange(arrayMove(items, activeIndex, overIndex));
    }
  };

  const renderItem = (item, index) => {
    return h(SortableItem, { id: item.id }, [
      h(DragHandle),
      h(IdContainer, [
        (id) =>
          h(Fragment, [
            h(
              TooltipTrigger,
              {
                // Since attribute names don't contain spaces, word-break: break-all is necessary to
                // wrap the attribute name instead of truncating it when the tooltip reaches its
                // max width of 400px.
                content: span({ style: { wordBreak: 'break-all' } }, [item.name]),
              },
              [
                label(
                  {
                    htmlFor: id,
                    style: {
                      lineHeight: '30px', // match rowHeight of SortableList
                      ...Style.noWrapEllipsis,
                    },
                  },
                  [
                    h(Checkbox, {
                      id,
                      checked: item.visible,
                      onChange: () => {
                        if (!_.isUndefined(index)) toggleVisibility(index);
                      },
                    }),
                    ' ',
                    item.name,
                  ]
                ),
              ]
            ),
          ]),
      ]),
    ]);
  };

  return h(AutoSizer, { disableHeight: true }, [
    ({ width }) => {
      return h(DndContext, { sensors, onDragEnd }, [
        h(SortableContext, { items }, [
          // @ts-ignore
          h(List, {
            style: { outline: 'none' },
            lockAxis: 'y',
            useDragHandle: true,
            width,
            height: 400,
            rowCount: items.length,
            rowHeight: 30,
            rowRenderer: ({ index, style, key }) => {
              const item = items[index];
              return div({ key, style: { ...style, display: 'flex' } }, [renderItem(item, index)]);
            },
          }),
        ]),
      ]);
    },
  ]);
};
