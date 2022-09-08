import _ from 'lodash/fp'

/*
    * Returns the account type based on the user's email address
    * to use as a Mixpanel property on the user profile.
    *
*/
export const getAccountType = email => {
  const enterpriseTLD = [
    'com', 'net', 'io', 'ai', 'co', 'app', 'us', 'uk', 'ca',
    'de', 'fr', 'jp', 'au', 'ru', 'ch', 'se', 'no', 'nl', 'it',
    'es', 'dk', 'cz', 'br', 'be', 'at', 'ar', 'in', 'mx', 'pl',
    'pt', 'fi', 'gr', 'hk', 'id', 'ie', 'il', 'is', 'kr', 'my',
    'nz', 'ph', 'sg', 'th', 'tw', 'vn'
  ]

  const emailDomain = email.split('@')[1]
  const emailTLD = emailDomain.split('.')[1]

  if (emailDomain.endsWith('broadinstitute.org') || emailDomain.endsWith('firecloud.org')) {
    return 'Broad Employee'
  } else if (emailDomain.endsWith('verily.com')) {
    return 'Verily Employee'
  } else if (emailDomain.endsWith('gmail.com')) {
    return 'Independent Researcher'
  } else if (_.includes(emailTLD, enterpriseTLD)) {
    return 'Enterprise'
  } else if (emailDomain.endsWith('.edu')) {
    return 'Educational Institute'
  } else if (emailDomain.endsWith('.org')) {
    return 'Non-profit'
  } else {
    return 'Other'
  }
}
