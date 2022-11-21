/* eslint-disable @typescript-eslint/no-unused-vars */
import { ReactElement } from 'react'
import { div, h } from 'react-hyperscript-helpers'

// Invalid prop
// THROWS Argument of type '{ invalidProp: boolean; }' is not assignable to parameter of type 'ReactNode[] | WithDataAttributes<DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>> | undefined'
div({ invalidProp: true })

// THROWS Argument of type '{ className: string; }' is not assignable to parameter of type 'ReactNode[]'.
div({ className: 'class-a' }, { className: 'class-b' })

// THROWS Argument of type 'string[]' is not assignable to parameter of type 'Omit<WithDataAttributes<DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>>, "children">'.
div(['Content'], ['More content'])

interface TestComponentProps {
  stringProp: string
  optionalNumberProp?: number
}

const TestComponent = (props: TestComponentProps) => div()

// Missing required prop
// TODO: This is currently valid, but preferably would error since it is missing a required prop (stringProp).
h(TestComponent)
// THROWS Argument of type '{ optionalNumberProp: number; }' is not assignable to parameter of type 'WithKey<TestComponentProps>'.
h(TestComponent, { optionalNumberProp: 1 })

// Invalid prop
// THROWS Argument of type '{ invalidProp: string; }' is not assignable to parameter of type 'WithKey<TestComponentProps>'.
h(TestComponent, { invalidProp: 'value' })

// Component does not accept children
// THROWS Argument of type 'ReactElement<any, any>[]' is not assignable to parameter of type 'never'
h(TestComponent, { stringProp: 'value' }, [div()])

// THROWS Argument of type '{ stringProp: string; }' is not assignable to parameter of type 'never'.
h(TestComponent, { stringProp: 'value' }, { stringProp: 'value' })

// THROWS Argument of type 'string[]' is not assignable to parameter of type 'WithKey<Omit<TestComponentProps, "children">>'.
h(TestComponent, ['Content'], ['Content'])

// Component that takes a function as a child
interface FunctionChildComponentProps {
  children: (args: { value: string }) => ReactElement
}

const FunctionChildComponent = (props: FunctionChildComponentProps) => props.children({ value: 'test' })

// THROWS Type 'ReactElement<any, any>' is not assignable to type '(args: { value: string; }) => ReactElement<any, string | JSXElementConstructor<any>>'.
h(FunctionChildComponent, [div()])

// THROWS Property 'invalidArg' does not exist on type '{ value: string; }'.
h(FunctionChildComponent, [({ invalidArg }) => div()])

// THROWS Type '(args: {    value: string;}) => ReactElement<any, any>' is not assignable to type 'undefined'.
h(FunctionChildComponent, [(args: { value: string }) => div(), (args: { value: string }) => div()])
