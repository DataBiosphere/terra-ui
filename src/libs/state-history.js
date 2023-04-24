import _ from "lodash/fp";
import { getDynamic, getSessionStorage, setDynamic } from "src/libs/browser-storage";
import { v4 as uuid } from "uuid";

const getKey = () => {
  const state = window.history.state;
  if (state?.key) {
    return state.key;
  }
  const key = uuid();
  window.history.replaceState({ key }, "");
  return key;
};

export const get = () => {
  const data = getDynamic(getSessionStorage(), getKey());
  return _.isPlainObject(data) ? data : {};
};

export const set = (newState) => {
  return setDynamic(getSessionStorage(), getKey(), newState);
};

export const update = (newState) => {
  set({ ...get(), ...newState });
};

export const clearCurrent = () => setDynamic(getSessionStorage(), getKey(), undefined);
