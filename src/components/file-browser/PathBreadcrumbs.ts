import { Fragment } from 'react';
import { h, span } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import * as Utils from 'src/libs/utils';

interface PathBreadcrumbsProps {
  path: string;
  rootLabel: string;
  onClickPath: (path: string) => void;
}

const PathBreadcrumbs = (props: PathBreadcrumbsProps) => {
  const { path, rootLabel, onClickPath } = props;

  const segments = path
    .replace(/(^\/)|(\/$)/, '')
    .split('/')
    .filter(Boolean);

  return h(Fragment, [
    h(
      Link,
      {
        style: { padding: '0.5rem', textDecoration: 'underline' },
        onClick: (e) => {
          e.preventDefault();
          onClickPath('');
        },
      },
      [rootLabel]
    ),
    Utils.toIndexPairs(segments).map(([index, segment]) => {
      const pathUpToSegment = [...segments.slice(0, index + 1), ''].join('/');
      return h(Fragment, { key: pathUpToSegment }, [
        span({ style: { padding: '0.5rem 0' } }, [' / ']),
        h(
          Link,
          {
            style: { padding: '0.5rem', textDecoration: 'underline' },
            onClick: (e) => {
              e.preventDefault();
              onClickPath(pathUpToSegment);
            },
          },
          [segment]
        ),
      ]);
    }),
  ]);
};

export default PathBreadcrumbs;
