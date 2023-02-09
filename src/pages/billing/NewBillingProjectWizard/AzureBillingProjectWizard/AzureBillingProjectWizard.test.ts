import { AddUserInfo } from 'src/pages/billing/NewBillingProjectWizard/AzureBillingProjectWizard/AddUserStep'

import { userInfoListToProjectAccessObjects } from './AzureBillingProjectWizard'


describe('transforming user info to the request object', () => {
  it('splits lists of emails and maps them to roles', () => {
    const emailList = 'a@b.com, b@c.com'
    const userInfo: AddUserInfo[] = [{ emails: emailList, role: 'User' }]
    const result = userInfoListToProjectAccessObjects(userInfo)

    expect(result).toHaveLength(2)
    expect(result[0].role).toEqual('User')
    expect(result[0].email).toEqual('a@b.com')
    expect(result[1].role).toEqual('User')
    expect(result[1].email).toEqual('b@c.com')
  })
})

