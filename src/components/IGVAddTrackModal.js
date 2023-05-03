import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { form, h, label } from 'react-hyperscript-helpers';
import { ButtonPrimary, IdContainer } from 'src/components/common';
import { parseGsUri } from 'src/components/data/data-utils';
import { TextInput, ValidatedInput } from 'src/components/input';
import Modal from 'src/components/Modal';
import * as Utils from 'src/libs/utils';

const IGVAddTrackModal = ({ onDismiss, onSubmitTrack }) => {
  const [value, setValue] = useState({
    name: '',
    url: '',
    indexUrl: '',
  });

  const [urlInputTouched, setUrlInputTouched] = useState(false);

  const urlError = Utils.cond(
    [!value.url, () => 'A URL is required'],
    [_.isEmpty(parseGsUri(value.url)), () => 'A gs:// URL is required'],
    () => null
  );

  const isTrackValid = _.isNull(urlError);

  const submit = () => {
    const track = {
      name: value.name || value.url,
      url: value.url,
    };
    if (value.indexUrl) {
      track.indexURL = value.indexUrl;
    } else {
      track.indexed = false;
    }

    onSubmitTrack(track);
  };

  return h(
    Modal,
    {
      title: 'Add track',
      okButton: h(
        ButtonPrimary,
        {
          disabled: !isTrackValid,
          onClick: submit,
        },
        ['Add track']
      ),
      onDismiss,
    },
    [
      form(
        {
          onSubmit: (e) => {
            e.preventDefault();
            submit();
          },
        },
        [
          h(IdContainer, [
            (id) =>
              h(Fragment, [
                label(
                  {
                    htmlFor: id,
                    style: { display: 'block', margin: '0.5rem 0 0.25rem' },
                  },
                  ['Name (optional)']
                ),
                h(TextInput, {
                  id,
                  placeholder: 'My track',
                  value: value.name,
                  onChange: (name) => setValue(_.set('name', name)),
                }),
              ]),
          ]),

          h(IdContainer, [
            (id) =>
              h(Fragment, [
                label(
                  {
                    htmlFor: id,
                    style: { display: 'block', margin: '0.5rem 0 0.25rem' },
                  },
                  ['URL (required)']
                ),
                h(ValidatedInput, {
                  inputProps: {
                    id,
                    placeholder: 'gs://my-bucket/file.bam',
                    value: value.url,
                    onChange: (url) => {
                      setValue(_.set('url', url));
                      setUrlInputTouched(true);
                    },
                  },
                  error: urlInputTouched && urlError,
                }),
              ]),
          ]),

          h(IdContainer, [
            (id) =>
              h(Fragment, [
                label(
                  {
                    htmlFor: id,
                    style: { display: 'block', margin: '0.5rem 0 0.25rem' },
                  },
                  ['Index URL (optional)']
                ),
                h(TextInput, {
                  id,
                  placeholder: 'gs://my-bucket/file.bai',
                  value: value.indexUrl,
                  onChange: (indexUrl) => setValue(_.set('indexUrl', indexUrl)),
                }),
              ]),
          ]),
        ]
      ),
    ]
  );
};

export default IGVAddTrackModal;
