import _ from 'lodash/fp';
import { Fragment } from 'react';
import { div, h, iframe } from 'react-hyperscript-helpers';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';

export const styles = {
  htmlFrame: {
    width: '100%',
    border: Style.standardLine,
    borderRadius: 3,
    padding: '1rem',
    backgroundColor: 'white',
  },
  jsonFrame: {
    padding: '0.5rem',
    backgroundColor: colors.light(),
    whiteSpace: 'pre-wrap',
    overflow: 'auto',
    overflowWrap: 'break-word',
    fontFamily: 'Menlo, monospace',
    maxHeight: 400,
  },
};

const ErrorView = ({ error }) => {
  return div({ style: { marginTop: '1rem' } }, [
    Utils.cond(
      [_.isError(error), () => error.message],
      [
        _.isString(error),
        () => {
          const json = Utils.maybeParseJSON(error);
          return Utils.cond(
            [
              error[0] === '<',
              () => {
                return iframe({ style: styles.htmlFrame, srcDoc: error, sandbox: '' });
              },
            ],
            [
              json !== undefined,
              () => {
                return h(Fragment, [
                  json.message && div({ style: { marginBottom: '1rem' } }, [json.message]),
                  div({ style: { fontWeight: 600, marginBottom: '0.5rem' } }, ['Full error:']),
                  div({ style: styles.jsonFrame }, [JSON.stringify(json, null, 2)]),
                ]);
              },
            ],
            () => error
          );
        },
      ],
      () => error.toString()
    ),
  ]);
};

export default ErrorView;
