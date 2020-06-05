export const allProviders = ['fence', 'dcf-fence', 'anvil']

export const providerName = provider => {
  return {
    fence: 'DCP',
    'dcf-fence': 'DCF',
    anvil: 'NHGRI AnVIL Data Commons'
  }[provider]
}
