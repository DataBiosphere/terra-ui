/* eslint-disable @typescript-eslint/no-unused-vars */
import { PropsWithChildren, ReactElement } from 'react'
import { div, h } from 'react-hyperscript-helpers'


// Empty element
div()

// Props only
div({ 'aria-label': 'label', 'data-testid': 'test-id', className: 'a-class', style: { display: 'flex' } })

// Children only
div(['Content'])
div([div()])
div([false])

// Props and children
div({ style: { display: 'flex' } }, ['Content'])
div({ className: 'a-class' }, [div()])

// Key
div({ key: 'key' })
div({ key: 'key', style: { display: 'flex' } }, [div()])

interface TestComponentProps {
  stringProp: string
  optionalNumberProp?: number
}

const TestComponent = (props: PropsWithChildren<TestComponentProps>) => div()

// PropsWithChildren with key
h(TestComponent, { key: 'key', stringProp: 'value' })

// Props
h(TestComponent, { stringProp: 'value' })
h(TestComponent, { stringProp: 'value', optionalNumberProp: 1 })

// Props and children
h(TestComponent, { stringProp: 'value' }, [div()])
h(TestComponent, { stringProp: 'value' }, ['Content'])

// Children
h(TestComponent, [div()])
h(TestComponent, [div(), div()])
h(TestComponent, ['Content'])

// Component that takes a function as a child
interface FunctionChildComponentProps {
  children: (args: { value: string }) => ReactElement
}

const FunctionChildComponent = (props: FunctionChildComponentProps) => props.children({ value: 'test' })

h(FunctionChildComponent, [(args: { value: string }) => div()])
