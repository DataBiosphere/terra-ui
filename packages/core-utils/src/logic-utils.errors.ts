/* eslint-disable @typescript-eslint/no-unused-vars */
import { switchCase } from './logic-utils';

// THROWS No overload matches this call.
const switchCaseCollectionArray = switchCase([], [[], () => 'This should not compile.']);

// THROWS No overload matches this call.
const switchCaseCollectionObject = switchCase({}, [{}, () => 'This should not compile.']);
