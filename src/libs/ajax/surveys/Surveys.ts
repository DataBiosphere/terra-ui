import * as qs from 'qs';
import { fetchGoogleForms } from 'src/libs/ajax/ajax-common';

export const Surveys = (signal?: AbortSignal) => ({
  submitForm: (formId, data) => fetchGoogleForms(`${formId}/formResponse?${qs.stringify(data)}`, { signal }),
});

export type SurveysAjaxContract = ReturnType<typeof Surveys>;
