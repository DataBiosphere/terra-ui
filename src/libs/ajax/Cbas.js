import _ from 'lodash/fp';
import { authOpts, fetchCbas, jsonBody } from 'src/libs/ajax/ajax-common';

export const Cbas = (signal) => ({
  methods: {
    post: async (root, methodName, methodDesc, methodSource, methodVersion, methodUrl, inputMappings, outputMappings) => {
      const body = {
        method_name: methodName,
        method_description: methodDesc,
        method_source: methodSource,
        method_version: methodVersion,
        method_url: methodUrl,
        method_input_mappings: inputMappings,
        method_output_mappings: outputMappings,
      };
      const res = await fetchCbas(root)('api/batch/v1/methods', _.mergeAll([authOpts(), jsonBody(body), { signal, method: 'POST' }]));
      return res.json();
    },
  },
});
