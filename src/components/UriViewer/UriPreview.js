import { Fragment, useState } from 'react';
import { div, h, img } from 'react-hyperscript-helpers';
import { isAzureUri } from 'src/components/UriViewer/uri-viewer-utils';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';

import els from './uri-viewer-styles';

const styles = {
  previewText: {
    whiteSpace: 'pre',
    fontFamily: 'Menlo, monospace',
    fontSize: 12,
    overflowY: 'auto',
    maxHeight: 206,
    marginTop: '0.5rem',
    padding: '0.5rem',
    background: colors.dark(0.25),
    borderRadius: '0.2rem',
  },
};

const isImage = ({ contentType, name }) => {
  return /^image/.test(contentType) || /\.(?:(jpe?g|png|svg|bmp))$/.test(name);
};

const isText = ({ contentType, name }) => {
  return /(?:(^text|application\/json))/.test(contentType) || /\.(?:(txt|[ct]sv|log|json))$/.test(name);
};

const isBinary = ({ contentType, name }) => {
  // excluding json and google's default types (i.e. wasn't set to anything else)
  return (
    /application(?!\/(json|octet-stream|x-www-form-urlencoded)$)/.test(contentType) || /(?:(\.(?:(ba[mi]|cra[mi]|pac|sa|bwt|gz))$|\.gz\.))/.test(name)
  );
};

const isFilePreviewable = ({ size, ...metadata }) => {
  return !isBinary(metadata) && (isText(metadata) || (isImage(metadata) && size <= 1e9));
};

export const UriPreview = ({ metadata, metadata: { uri, bucket, name }, googleProject }) => {
  const signal = useCancellation();
  const [preview, setPreview] = useState();
  const loadPreview = async () => {
    try {
      if (isAzureUri(uri)) {
        setPreview(metadata.textContent); // NB: For now, we only support text previews for Azure URIs.
      } else {
        const res = await Ajax(signal).Buckets.getObjectPreview(googleProject, bucket, name, isImage(metadata));
        if (isImage(metadata)) {
          setPreview(URL.createObjectURL(await res.blob()));
        } else {
          setPreview(await res.text());
        }
      }
    } catch (error) {
      setPreview(null);
    }
  };
  useOnMount(() => {
    if (isFilePreviewable(metadata)) {
      loadPreview();
    }
  });
  return els.cell([
    Utils.cond(
      [
        isFilePreviewable(metadata),
        () =>
          h(Fragment, [
            els.label('Preview'),
            Utils.cond(
              [preview === null, () => 'Unable to load preview.'],
              [preview === undefined, () => 'Loading preview...'],
              [isImage(metadata), () => img({ src: preview, width: 400 })],
              () =>
                div(
                  {
                    tabIndex: 0,
                    style: styles.previewText,
                  },
                  [preview]
                )
            ),
          ]),
      ],
      [isImage(metadata), () => els.label('Image is too large to preview')],
      () => els.label("File can't be previewed.")
    ),
  ]);
};
