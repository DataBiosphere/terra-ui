import { CSSProperties } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { Clickable, ClickableProps } from 'src/components/common'
import colors from 'src/libs/colors'
import { forwardRefWithName } from 'src/libs/react-utils'


type MenuButtonProps<T extends keyof JSX.IntrinsicElements> = ClickableProps<T>

const MenuButtonInternal = <T extends keyof JSX.IntrinsicElements = 'div'>({ disabled, children, ...props }: MenuButtonProps<T>, ref) => {
  return div({ role: 'menuitem' }, [
    h(Clickable, {
      ref,
      disabled,
      style: {
        display: 'flex', alignItems: 'center',
        fontSize: 12, minWidth: 125, height: '2.25rem',
        padding: '0.875rem',
        ...(disabled ? { color: colors.dark(0.7), cursor: 'not-allowed' } : { cursor: 'pointer' })
      } as CSSProperties,
      hover: !disabled ? { backgroundColor: colors.light(0.4), color: colors.accent() } : undefined,
      ...props
    }, [children])
  ])
}


export const MenuButton = <T extends keyof JSX.IntrinsicElements>(): React.FC<MenuButtonProps<T>> => forwardRefWithName('MenuButton', MenuButtonInternal) as React.FC<MenuButtonProps<T>>
// export const MenuButton = <T extends keyof JSX.IntrinsicElements>(): React.FC<MenuButtonProps<T>> => forwardRefWithName('MenuButton', MenuButtonInternal) as (<T extends keyof JSX.IntrinsicElements>(props: MenuButtonProps<T>) => JSX.Element)
