import { act, renderHook, RenderHookOptions, RenderHookResult, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

type UserEvent = ReturnType<typeof userEvent.setup>;

/*
 * Use when working with a jest.fn() mocked method to get better type safety and IDE hinting on
 * the function signature of what's being mocked.
 *
 * Type "any" is used here to allow for desired type flow during usage where T "looks like a function".
 */
export const asMockedFn = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> => {
  return fn as jest.MockedFunction<T>;
};

export type PromiseController<T> = {
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

/**
 * Returns a promise and a controller that allows manually resolving/rejecting the promise.
 */
export const controlledPromise = <T>(): [Promise<T>, PromiseController<T>] => {
  const controller: PromiseController<T> = {
    resolve: () => {},
    reject: () => {},
  };

  const promise = new Promise<T>((resolve, reject) => {
    controller.resolve = resolve;
    controller.reject = reject;
  });

  return [promise, controller];
};

// This is for the AutoSizer component. It requires screen dimensions in order to be tested properly.
export const setUpAutoSizerTesting = () => {
  Object.defineProperties(window.HTMLElement.prototype, {
    offsetLeft: {
      get() {
        return parseFloat(window.getComputedStyle(this).marginLeft) || 0;
      },
    },
    offsetTop: {
      get() {
        return parseFloat(window.getComputedStyle(this).marginTop) || 0;
      },
    },
    offsetHeight: {
      get() {
        return parseFloat(window.getComputedStyle(this).height) || 0;
      },
    },
    offsetWidth: {
      get() {
        return parseFloat(window.getComputedStyle(this).width) || 0;
      },
    },
  });
};

export const renderHookInAct = async <T, U>(
  callback: (args: T) => U,
  options?: RenderHookOptions<T>
): Promise<RenderHookResult<U, T>> => {
  let result: RenderHookResult<U, T>;
  await act(async () => {
    result = renderHook(callback, options);
  });
  return result!;
};

export class SelectHelper {
  selectElement: HTMLElement;

  user: UserEvent;

  constructor(selectElement: HTMLElement, user: UserEvent) {
    this.selectElement = selectElement;
    this.user = user;
  }

  async getOptions(): Promise<string[]> {
    await this.user.click(this.selectElement);
    const listboxId = this.selectElement.getAttribute('aria-controls')!;
    const listBox = document.getElementById(listboxId)!;
    const options = Array.from(listBox.querySelectorAll('[role="option"]'));
    const optionLabels = options.map((opt) => opt.textContent!);
    return optionLabels;
  }

  async selectOption(optionLabel: string): Promise<void> {
    await this.user.click(this.selectElement);
    const listboxId = this.selectElement.getAttribute('aria-controls')!;
    const listBox = document.getElementById(listboxId)!;
    const option = within(listBox).getByRole('option', { name: optionLabel });
    await this.user.click(option);
  }
}
