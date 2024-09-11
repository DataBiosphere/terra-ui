export type RequesterPaysErrorInfo = {
  requesterPaysError: boolean;
};

export const isRequesterPaysErrorInfo = (error: any): error is RequesterPaysErrorInfo => {
  return error != null && typeof error === 'object' && 'requesterPaysError' in error;
};
