import {Ajax} from "src/libs/ajax";
import {AppAjaxContract, AppsAjaxContract} from "src/libs/ajax/leonardo/Apps";
import { asMockedFn } from 'src/testing/test-utils';
import {RuntimesAjaxContract} from "src/libs/ajax/leonardo/Runtimes";

jest.mock('src/libs/ajax');

type AjaxContract = ReturnType<typeof Ajax>;
type RuntimeNeeds = Pick<RuntimesAjaxContract, 'invalidateCookie'>;

interface AjaxMockNeeds {
  Runtimes: RuntimeNeeds;
}
/**
 * local test utility - mocks the Ajax super-object and the subset of needed multi-contracts it
 * returns with as much type-safety as possible.
 *
 * @return collection of key contract sub-objects for easy
 * mock overrides and/or method spying/assertions
 */
const mockAjaxNeeds = (): AjaxMockNeeds => {
  const partialRuntimes: RuntimeNeeds = {
    invalidateCookie: jest.fn();
  };
  const mockRuntimes = partialRuntimes as RuntimesAjaxContract;

  asMockedFn(Ajax).m({ Runtimes: mockRuntimes } as AjaxContract);

  return {
    Runtimes: partialRuntimes
  };
};
describe('leoAppProvider', () => {

})
