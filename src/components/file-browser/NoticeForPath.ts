import _ from 'lodash/fp';
import { div } from 'react-hyperscript-helpers';
import colors from 'src/libs/colors';

type NoticeForPathProps = {
  notices: { [path: string]: string };
  path: string;
};

export function NoticeForPath(props: NoticeForPathProps) {
  const { notices, path } = props;

  const activeNotice = _.flow(_.keys, _.sortBy(_.size), _.reverse, _.find(_.startsWith(_.placeholder, path)))(notices);

  return activeNotice
    ? div({ style: { padding: '1rem', background: colors.accent(0.2) } }, [notices[activeNotice]])
    : null;
}
