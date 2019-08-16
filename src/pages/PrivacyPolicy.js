import { div, h } from 'react-hyperscript-helpers'
import { Markdown, newWindowLinkRenderer } from 'src/components/Markdown'


const privacyPolicy = `
If there are any questions about privacy, please email [privacy@broadinstitute.org](mailto:privacy@broadinstitute.org).

We keep your name, email and company so you can use our system.

We place cookies on your browser to make our system faster.

We may use your name and email to send you information about our system.

You are responsible for maintaining the privacy of data you enter into our system. We keep your data very private on our cloud providers.

We follow the laws of all the countries where we operate. We follow the laws of Europe, like GDPR. If you need more information, see the sections below.

## Information Terra May Collect From You

1. Our primary goals in collecting information are to provide genomic information management and analysis services to you, to improve our Site, features, content, and to run our business.

    1. Genomic Information That You Voluntarily Provide

        * Terra collects and stores the genomic sequence data (DNA, RNA, etc), derived from humans or other organisms, that you submit to the Site along with metadata and other information related to such sequence data. You agree to and accept full responsibility for obtaining all necessary permissions and informed consents from the donors of all samples from which your submitted sequence data is derived.

    2. HIPAA, Protected Health Information, and the Clinical Compliance Features

        * Terra is not a Covered Entity as that term is defined in the Health Insurance Portability and Accountability Act of 1996, as amended, and its related regulations (collectively, "HIPAA"). On occasion, Terra may agree in writing with a user to perform services for the user in the storing PHI. We recommend that such users enter into a formal agreement with Terra/Firecloud.

        * Terra does offers clinical compliance features as part of its service ("Compliance Features") for users who wish to upload, store, or otherwise transfer PHI, as well as users who are using the Site in connection with their clinical operations. Users who desire to upload, store, or otherwise transfer PHI using the Site must implement all of the required Clinical Features and must enter a formal agreement with Firecloud stating that. The uploading, storing, or transferring of PHI using the Site by users that have not implemented the Clinical Features is strictly prohibited. You agree that, unless you have implemented the Clinical Features, you will not upload, store, or otherwise transfer PHI using the Site.

        * You acknowledge that this may require you, in some instances, to anonymize sequence data prior to uploading it to the Site. You further agree to indemnify and hold harmless Terra of and from any and all claims, demands, losses, causes of action, damage, lawsuits, judgments, including attorneys' fees and costs, arising out of or relating to your uploading, storing, or transferring of PHI without having fully implemented the Clinical Features.

    3. User Account Information/Personally Identifiable Information

        * When you register with us through the Site and during your use of the Site, we will ask you for personally-identifiable information, which is information about you that can be used to contact or identify you ("Personal Information"), such as: your name, company or organization name, title, e-mail address, postal address, telephone number.

    4. Cookies and Tracking Pixels

        * We use cookies, tracking pixels, and other similar technologies to track activity on our Site and to enhance the functionality of our Site. Cookies are small data files that our web servers send to your browser and which get saved on the hard drive of the computer that you are using to access the Site. If you do not want to allow cookies on your computer, most browsers have a feature that allows you either to automatically decline cookies or to decline or accept particular cookies from particular web sites. If you choose to reject cookies from our Site, you may be unable to use certain Site services, features, and functionality. If you choose to accept cookies from us and our service providers, you are agreeing to let us and our service providers install cookies on your computer. To learn more about cookies, please visit [http://allaboutcookies.org](http://allaboutcookies.org/). Tracking pixels (also known as web beacons, action tags, or transparent GIF files) collect and store information about your visits to our Site, such as page visits, the duration of the visit, the specific link(s) that you clicked during your visit, and the address of the website from which you arrived at the Site.

    5. User Software and Reference Data

        * You may also be permitted to upload your own software and data, including reference genomes, to the Site in the course of using the Site. You agree to and accept full responsibility for obtaining all permissions, consents, and rights necessary for uploading and using any such software and data to and with the Site. The software you upload must comply with the Terra "Terms of Use Policy".

2. How Your Information May be Used

    1. We may use your Personal Information to improve our products and services, to ensure contact information is up to date and accurate, to improve our customer service, to reduce risk and prevent fraud, to provide you with a personalized experience on our Site and to communicate with you regarding new service features and related products and services provided by our partners, events, and other information and notices we believe you may find interesting or useful. We will not sell or provide your information to third parties for their own direct marketing purposes.

    2. We use the automatic usage and other non-Personal Information collected to maintain, secure, and improve our Site, and to understand your interests when visiting our Site. We may generate statistical information regarding our user-base and use it to analyze our Site or business.

3. With Whom May Terra Share Your Information?

    1. Service Providers

        * We may rely on various third-party service providers and contractors to provide services that support the Site and our operations, including, without limitation, maintenance of our databases, distribution of emails and newsletters on our behalf, data analysis, payment processing and other services of an administrative nature. Such third-parties may have access to your Personal Information for the purpose of performing the service for which they have been engaged.

    2. Compliance with Laws and Law Enforcement

        * Terra cooperates with government and law enforcement officials and private parties to enforce and comply with the law. We may disclose Personal Information and other user information when we, in our sole discretion, have reason to believe that disclosing this information is necessary to identify, contact, or bring legal action against someone who may (either intentionally or unintentionally) be causing injury to or interference with our rights or property, users of our Site, or anyone else who could be harmed by such activities. We may also disclose user information when we believe, in our sole discretion, that such disclosure is required by applicable law. We also may be required to disclose an individual’s personal information in response to a lawful request by public authorities, including to meet national security or law enforcement requirements.

4. Information You Share With Other Users; Forums

    1. Our Site allows you to share the sequence data, reference genomes, and other information you submit to the Site with other users of the Site and third parties who are not users of the Site. Terra is not responsible for such other users' and third parties' use of your sequence data, reference genomes or other information. You understand and acknowledge that, if you choose to share the sequence data, reference genomes, or other information you submit to the Site with other users of the Site or third parties, such shared information might be copied or redistributed by other users and third parties. Even after you remove information from your account or delete your account, copies of that information may remain viewable elsewhere to the extent it has previously been shared with others.

5. Links and Third Party Applications

    1. On the Site, we may provide links to websites or applications maintained by third parties, which we believe you may find useful. Terra is not responsible for the privacy practices of these other websites or applications and we encourage you to review the privacy policies of each of those other websites or applications before using such websites and applications. If you click on these third-party links, these other websites or applications may place their own cookies or other files on your computer, collect data, or solicit Personal Information from you. Other websites and applications will have different policies and rules regarding the use or disclosure of the personal information you submit to them. We make no representation with regard to the policies or business practices of any websites or applications to which you connect through a link from this Site, and are not responsible for any material contained on, or any transactions that occur between you and any such website or application.

6. Location

    1. Broad Institute is a United States based company and therefore we must abide the laws and regulations of the United States as well as the other countries where we operate. By providing Personal Information and other information to this Site, you understand and consent to the collection, use, processing and transfer of such information to the United States and other countries or territories, which may not offer the same level of data protection as the country where you reside, in accordance with the terms of this Privacy Policy.

7. General Data Privacy Regulation (GDPR)

    1. Terra is compliant with the GDPR regulations as it becomes effective starting 25 May 2018. In the language of GDPR, Terra positions itself as a Data Processor or Subprocessor for our customers, who are either Data Controllers or Data Processors. As such, Terra is not liable for the provisions of GDPR that pertain to the Data Controllers. Terra’ obligations as a Data Processor include, but are not limited to the following:

        * Terra shall follow the instructions of the Customer in the management of their data. Terra shall not opportunistically use or mine or use personal data that it is entrusted, aside from those mentioned elsewhere in this document or under the written instructions of the Customer.

        * Terra shall obtain written permission from the Customer before engaging a subprocessor and assume liability for failures of the subprocessors to meet the requirements of GDPR.

        * Upon request, Terra shall delete or return all personal data to the Customer at the end of the service contract.

        * Terra shall enable and contribute to compliance audits conducted by the Customer’s controller or a competent representative of the controller.

        * Terra shall take reasonable steps to secure data, such as encryption, stability and uptime, backup and disaster recovery, and regular security testing.

        * Terra shall notify the Customer without undue delay upon learning of data breaches.

        * Terra shall make every effort to restrict personal data transfer to a third country only if legal safeguards are obtained.

        * Terra shall make the Data Protection Officer available address concerns or questions upon request.

8. Privacy Policy Changes

    1. This Privacy Policy may be updated periodically. We will notify you of any material changes to this Privacy Policy by posting the revised policy on the Site. You are advised to periodically review this page to ensure continuing familiarity with the most current version of our Privacy Policy. Any changes to our Privacy Policy will become effective upon our posting of the revised Privacy Policy on the Site. Use of the Site following such changes constitutes your acceptance of the revised Privacy Policy then in effect. You will be able to determine when this Privacy Policy was last revised by checking the "Last Updated" information that appears at the top of this page.
`

const PrivacyPolicy = () => {
  return div({ role: 'main', style: { padding: '1rem' } }, [
    h(Markdown, {
      renderers: {
        link: newWindowLinkRenderer
      }
    }, [privacyPolicy])
  ])
}

export const navPaths = [
  {
    name: 'privacy',
    path: '/privacy',
    component: PrivacyPolicy,
    public: true,
    title: 'Privacy Policy'
  }
]
