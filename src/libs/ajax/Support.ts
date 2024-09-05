import { jsonBody } from '@terra-ui-packages/data-client-core';
import _ from 'lodash/fp';
import { fetchOk } from 'src/libs/ajax/fetch/fetch-core';

export interface ZendeskCreateSupportRequestRequest {
  name: string;
  email: string;
  currUrl: string;
  subject: string;
  type: 'question' | 'bug' | 'survey';
  description: string;
  attachmentToken: string;
  emailAgreed: boolean;
  clinicalUser?: boolean;
}

export interface ZendeskCreateSupportRequestResponse {
  request: {
    custom_status_id: number;
    description: string;
    id: number;
    status: string;
    subject: string;
  };
}

export interface ZendeskUploadResponse {
  token: string;
  expires_at: Date;
  attachment: {
    url: string;
    id: number;
    file_name: string;
    content_url: string;
    content_type: string;
  };
}

export const Support = (signal?: AbortSignal) => {
  return {
    // If you are making changes to the Support Request Modal, make sure you test the following:
    // 1. Submit a ticket via Terra while signed in and signed out
    // 2. Check the tickets are generated on Zendesk
    // 3. Reply internally (as a Light Agent) and make sure an email is not sent
    // 4. Reply externally (ask one of the Comms team with Full Agent access) and make sure you receive an email
    createSupportRequest: async (
      request: ZendeskCreateSupportRequestRequest
    ): Promise<ZendeskCreateSupportRequestResponse> => {
      const { name, email, currUrl, subject, type, description, attachmentToken, emailAgreed, clinicalUser } = request;
      const res = await fetchOk(
        'https://support.terra.bio/api/v2/requests.json',
        _.merge(
          { signal, method: 'POST' },
          jsonBody({
            request: {
              requester: { name, email },
              subject,
              // BEWARE changing the following ids or values! If you change them then you must thoroughly test.
              custom_fields: [
                { id: 360012744452, value: type },
                { id: 360007369412, value: description },
                { id: 360012744292, value: name },
                { id: 360012782111, value: email },
                { id: 360018545031, value: emailAgreed },
                { id: 360027463271, value: clinicalUser },
              ],
              comment: {
                body: `${description}\n\n------------------\nSubmitted from: ${currUrl}`,
                uploads: [`${attachmentToken}`],
              },
            },
          })
        )
      );
      return res.json();
    },

    uploadAttachment: async (file: File): Promise<ZendeskUploadResponse> => {
      const res = await fetchOk(`https://support.terra.bio/api/v2/uploads?filename=${file.name}`, {
        method: 'POST',
        body: file,
        headers: {
          'Content-Type': 'application/binary',
        },
      });
      return (await res.json()).upload;
    },
  };
};
