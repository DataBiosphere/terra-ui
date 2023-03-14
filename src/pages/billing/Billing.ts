import { BillingList } from 'src/pages/billing/List/List'


export const billingRoles = {
  owner: 'Owner',
  user: 'User'
}

export const billingProjectNameValidator = (existing: string[]) => ({
  length: { minimum: 6, maximum: 30 },
  format: {
    pattern: /(\w|-)+/,
    message: 'can only contain letters, numbers, underscores and hyphens.'
  },
  exclusion: {
    within: existing,
    message: 'already exists'
  }
})

export const navPaths = [
  {
    name: 'billing',
    path: '/billing',
    component: BillingList,
    title: 'Billing'
  }
]
