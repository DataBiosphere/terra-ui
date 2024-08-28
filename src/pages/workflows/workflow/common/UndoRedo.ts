import { useState } from 'react';

interface Command {
  executeFn: Function;
  undoFn: Function;
}

interface State {
  history: Command[];
  currentIndex: number;
}

export function useUndoRedo() {
  const [state, setState] = useState<State>({ history: [], currentIndex: 0 });

  const execute = (executeFn: Function, undoFn: Function) => {
    const cmd: Command = { executeFn, undoFn }; // create Command object
    setState((prev) => {
      const { history, currentIndex } = prev; // get history and index from state
      cmd.executeFn(); // execute from command
      return { history: [...history, cmd], currentIndex: currentIndex + 1 };
    });
  };

  const undo = () => {
    setState((prev) => {
      const { history, currentIndex } = prev;
      if (currentIndex <= 0) return prev;
      const lastCommand = history[currentIndex - 1];
      lastCommand.undoFn(); // execute undoFn
      return { history, currentIndex: currentIndex - 1 }; // return new state
    });
  };

  const redo = () => {
    setState((prev) => {
      const { history, currentIndex } = prev;
      if (currentIndex >= history.length - 1) return prev; // do not redo if there is no forward history
      const nextCommand = history[currentIndex + 1];
      nextCommand.executeFn();
      return { history, currentIndex: currentIndex + 1 };
    });
  };

  const canUndo = state.currentIndex > 0;
  const canRedo = state.currentIndex < state.history.length - 1;

  return { execute, undo, redo, canRedo, canUndo };
}
