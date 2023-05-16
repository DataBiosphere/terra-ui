import _ from 'lodash/fp';
import { useEffect } from 'react';
import { getEnabledBrand } from 'src/libs/brand-utils';
import { useRoute } from 'src/libs/nav';
import * as Utils from 'src/libs/utils';

export function TitleManager() {
  const { title, params, query } = useRoute();
  const newTitle = Utils.cond(
    [_.isFunction(title), () => title({ ...params, queryParams: query })],
    [title, () => title],
    () => getEnabledBrand().name
  );
  useEffect(() => {
    document.title = newTitle;
  }, [newTitle]);
  return null;
}
