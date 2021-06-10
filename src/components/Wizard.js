import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'


// Sample Views
const One = ({ setNextView }) => div({ onClick: () => setNextView('two') }, 'one')
const Two = ({ setNextView }) => div({ onClick: () => setNextView('three') }, 'two')
const Three = ({ setNextView }) => div({ onClick: () => setNextView('four') }, 'three')
const Four = () => div('four')

export const sampleSteps = [{
  step: 'one',
  component: One
}, {
  step: 'two',
  component: Two
}, {
  step: 'three',
  component: Three
}, {
  step: 'four',
  component: Four,
  onDone: () => console.log('Do the thing')
}]

export const DELETE = Symbol()

// Keeps a history of the state
// This could accept all expected states and only allow known state when accumulating the history
const useStateAccumulator = initialState => {
  const [state, setState] = useState(initialState ? [initialState] : [])
  return [state, nextState => nextState === DELETE ? setState(_.take(_.size(state) - 1, state)) : setState([...state, nextState])]
}

// handles previous, state per state, path
// accumulators for path, state per path
export const Wizard = ({ steps, initialStep }) => {
  const [stepPath, setStepPath] = useStateAccumulator(initialStep)
  const [totalState, setTotalState] = useStateAccumulator()
  const currentStep = _.last(stepPath)
  const stepState = _.find(([step]) => step === currentStep, totalState)

  const { component, onDone } = _.find(({ step }) => step === currentStep, steps) || {}
  return h(Fragment, [
    div({
      onClick: () => {
        setStepPath(DELETE)
      }
    }, ['Back']),
    component && h(component, { setStepState: stepState => setTotalState([currentStep, stepState]), setNextView: setStepPath, stepState }),
    // On completion you can filter the totalState based all of the stepPath state (consider using _.unionWith)
    // The "done" handler will know the state it needs
    onDone && div({ onClick: onDone }, ['done'])
  ])
}
