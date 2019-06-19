import { Component } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { Markdown, newWindowLinkRenderer } from 'src/components/Markdown'


const broadEula = `
1. The Terra Free Credits Program (“credits”), sponsored by Google, is administered by [Onix Networking](https://www.onixnet.com/products/google-cloud/google-cloud-platform/google-app-engine) (“Onix”), a Google Cloud Premier Partner. 

2. By opting into this program, you are authorizing Terra to give Onix and Google access to your Terra user profile information. This is necessary for Onix and Google to give you the free credits. 

3. Your credits of $300 will expire December 30, 2019 or 60 days after they were issued, whichever comes first.

4. Onix will contact you during the trial with information on options for creating your own billing account to further use Terra once the credits expire. Other billing options will be available on the Terra website.

5. Terra has no obligation to maintain a billing account or any data saved under an account once credits are exhausted.

6. Credits are not redeemable for cash and are not transferable.

7. All use of Terra by researchers is subject to the [Terra Terms of Use](https://app.terra.bio/#terms-of-service), which may be updated from time to time. Terra reserves the right to revoke credits for any activity that violates the Terms of Use.
`

const onixEula = `### Onix Networking Google Cloud Platform Online Customer Agreement

Onix Networking Google Cloud Platform Online Customer Agreement (the
\\"Agreement\\") is entered into by and between Onix Networking Corp., an
Ohio corporation, with offices at 18519 Detroit Avenue, Lakewood, Ohio
44107 (“Onix”) and the entity agreeing to these terms (\\"Customer\\"). This
Agreement is effective as of the date you click the \\"I Accept\\" button
below (the \\"Effective Date\\"). If you are accepting on behalf of your
employer or another entity, you represent and warrant that: (i) you have
full legal authority to bind your employer, or the applicable entity, to
these terms and conditions; (ii) you have read and understand this
Agreement; and (iii) you agree, on behalf of the party that you
represent, to this Agreement. If you don't have the legal authority to
bind your employer or the applicable entity, please do not click the \\"I
Accept\\" button below. This Agreement governs Customer's access to and
use of the Services.

1.  **Services**. “Services” means the Google services currently known
    as “Google Cloud Platform” as set forth at the following URL:
    <https://cloud.google.com/terms/services>, as provided by Google and
    used by Customer under this Agreement. Customer may use any or all
    of the services.
    
    1.  Google will provide the Services to Customer. As part of
        receiving the Services Customer will have access to the Admin
        Console, through which Customer may administer the Services. The
        Services shall be deemed accepted by Customer upon provisioning
        of Admin Console.
    
    2.  Customer must have an Account to use the Services, and is
        responsible for the information it provides to create the
        Account, the security of its passwords for the Account, and for
        any use of its Account. If Customer becomes aware of any
        unauthorized use of its password or its Account, Customer will
        notify Onix or Google as promptly as possible.
    
    3.  Documentation. Google will provide Customer with Documentation.
        The Documentation may specify restrictions on how the
        Applications may be built or how the Services may be used and
        Customer will ensure that Customer and its End Users comply with
        such restrictions.
    
    4.  Customer agrees to comply with the terms and conditions of the
        Service Specific Terms.
    
    5.  Customer agrees to comply with the terms and conditions of the
        Google Cloud Platform Acceptable Use Policy (“AUP”).
    
    6.  Service Level Agreement. Google will provide the Services in
        accordance with the applicable Service Level Agreement (“SLA”),
        if any.
    
    7.  Data Location. Customer may select where certain Customer Data
        will be stored (\\"Data Location Selection\\"), and Google will
        store it there in accordance with the Service Specific Terms. If
        a Data Location Selection is not covered by the Service Specific
        Terms (or a Data Location Selection is not made by Customer in
        respect of any Customer Data), Google may store and process the
        relevant Customer Data anywhere Google or its Subprocessors
        maintain facilities. By using the Services, Customer consents to
        this processing and storage of Customer Data.
    
    8.  New Applications and Services. Google may: (i) make new
        applications, tools, features or functionality available through
        the Services and (ii) add new services to the “Services”
        definition (by adding them at the URL under that definition),
        the use of which may be contingent upon Customer’s agreement to
        additional terms.
    
    9.  Modifications.
        
        1.  Modifications to the Services. Google may make commercially
            reasonable updates to the Services from time to time. If
            Google makes a material change to the Services, Onix will
            make commercially reasonable efforts to inform Customer.
        
        2.  Modifications to the URL Terms. Google may make commercially
            reasonable changes to the URL Terms from time to time. If
            Google makes a material change to the URL Terms, Onix will
            inform Customer through email notification or the Admin
            Console. If the change has a material adverse impact on
            Customer and is not a result of Google complying with a
            court order or applicable law, Customer may notify Onix
            within 30 days after being informed of the change that
            Customer does not agree with the change. If Customer
            notifies Onix as required, then Customer will remain
            governed by the terms in effect immediately prior to the
            change until the earlier of: (i) the end of the then-current
            Initial Term (as defined in section 6.1 below) or Renewal
            Term (as defined in section 6.2 below) or (ii) 12 months
            after Onix informs Customer of the change, unless the
            modification to the URL Terms is in response to a court
            order or to comply with applicable law. If the Agreement
            renews, it will do so under the updated URL Terms.
    
    10. Third Party Components. Certain components of the Software
        (including open source software) may be subject to separate
        license agreements, which Google will provide to Customer along
        with such components.
    
    11. Use of Customer Data. Google will not access or use Customer
        Data, except as necessary to provide the Services to Customer
        and its End Users.
    
    12. Onix and Google are independent contractors and Onix is not
        Google’s agent or partner or in a joint venture with Google.

2.  **Customer Obligations.**
    
    13. Compliance. Customer is responsible for any violations of the
        AUP, the Service Specific Terms, or Section 2.2 (Restrictions),
        in each case caused by Customer (and Customer End Users),
        Customer Data, Applications, or Projects. Google reserves the
        right to review the Customer Data, Applications, and Projects
        for compliance with the AUP.
    
    14. Restrictions. Customer will not, and will not allow any third
        parties under its control or End Users to: (a) copy, modify,
        create a derivative work of, reverse engineer, decompile,
        translate, disassemble, or otherwise attempt to extract any or
        all of the source code of the Services (subject to Section 1.10
        above and except to the extent such restriction is expressly
        prohibited by applicable law); (b) create multiple Applications,
        Accounts, or Projects to simulate or act as a single
        Application, Account, or Project (respectively) or otherwise
        access the Services in a manner intended to avoid incurring
        Fees; (c) unless otherwise stated in the Service Specific Terms,
        use the Services to operate or enable any telecommunications
        service or in connection with any Application that allows
        Customer End Users to place calls or to receive calls from any
        public switched telephone network; (d) process or store any
        Customer Data that is subject to the International Traffic in
        Arms Regulations maintained by the Department of State; (e) use
        the Services for High Risk Activities; or (f) sublicense,
        resell, or distribute any or all of the Services separate from
        any integrated solution.
    
    15. Unless otherwise specified in writing by Google or Onix, Google
        and Onix do not intend uses of the Services to create
        obligations under HIPAA, and makes no representations that the
        Services satisfy HIPAA requirements. If Customer is (or becomes)
        a Covered Entity or Business Associate, as defined in HIPAA,
        Customer agrees not to use the Services for any purpose or in
        any manner involving Protected Health Information (as defined in
        HIPAA) unless Customer has received prior written consent to
        such use from Onix or Google. As between the parties, Customer
        is solely responsible for any applicable compliance with HIPAA.

3.  **Privacy**.
    
    16. The Data Processing and Security Terms will apply. Subject to
        Section 3.2, Google may change the Data Processing and Security
        Terms from time to time by notifying Customer in writing.
    
    17. Updates to Data Processing and Security Terms. Google may only
        change the Data Processing and Security Terms where such change
        is required to comply with applicable law, applicable
        regulation, court order or guidance issued by a governmental
        regulator or agency, where such change is expressly permitted by
        the Data Processing and Security Terms, or where such change:
        
        3.  is commercially reasonable;
        
        4.  does not result in a degradation of the overall security of
            the Services;
        
        5.  does not expand the scope of or remove any restrictions on
            Google’s processing of Customer Personal Data, as described
            in Section 5.3 (Scope of Processing) of the Data Processing
            and Security Terms; and
        
        6.  does not otherwise have a material adverse impact on
            Customer’s rights under the Data Processing and Security
            Terms.
    
    18. Consent to Processing. Customer will obtain and maintain any
        required consents necessary to permit the processing of Customer
        Data under this Agreement.
    
    19. Google is a processor of any personal data processed by it on
        Customer’s behalf, and Customer is the controller of any such
        data, as the terms “controller”, “processed”, “processor” and
        “personal data” are defined in the EU Directive.

4.  **DMCA Policy**. Google provides information to help copyright
    holders manage their intellectual property online, but Google cannot
    determine whether something is being used legally or not without
    their input. Google responds to notices of alleged copyright
    infringement and terminates accounts of repeat infringers according
    to the process in the U.S. Digital Millennium Copyright Act. If
    Customer thinks somebody is violating Customer’s copyrights and
    wants to notify Google, Customer can find information about
    submitting notices, and Google's policy about responding to notices
    at <http://www.google.com/dmca.html>.

5.  **Suspension of Services.**
    
    20. Suspension/Removals. If Customer becomes aware that any
        Application, Project , or Customer Data violates the AUP,
        Customer will immediately suspend the Application, Project, or
        End User’s access and/or remove the relevant Customer Data (as
        applicable). If Customer fails to suspend or remove as noted in
        the prior sentence, Google or Onix may specifically request that
        Customer do so. If Customer fails to comply with Google’s or
        Onix’ request to do so, then Google or Onix may suspend the
        Customer’s or applicable End Users’ Google accounts, disable the
        Project or Application, or disable the Account (as may be
        applicable) until the AUP violation is corrected..
    
    21. Emergency Security Issues. Despite the foregoing, if there is an
        Emergency Security Issue, then Onix or Google may automatically
        suspend the offending Application, Project, or the Account.
        Suspension will be to the minimum extent required, and of the
        minimum duration, to prevent or resolve the Emergency Security
        Issue. If Onix or Google suspends an Application, Project, or
        the Account, for any reason, without prior notice to Customer,
        then at Customer’s request, Onix or Google will provide Customer
        the reason for the suspension as soon as reasonably possible.

6.  **Term and Termination**.
    
    22. Agreement Term. Subject to Customer’s payment of Fees, the
        Initial Term will start on the Agreement effective date and
        continue for a period of twelve (12) months, unless terminated
        earlier in accordance with this Agreement.
    
    23. Auto Renewal. At the end of the Initial Term, the Agreement will
        automatically renew for consecutive terms of twelve (12) months
        (each a “Renewal Term”), unless terminated earlier in accordance
        with this Agreement.
    
    24. Termination for Breach. Either party may suspend or terminate
        this Agreement for breach if: (i) the other party is in material
        breach of the Agreement and fails to cure that breach within
        thirty (30) days after receipt of written notice; (ii) the other
        party ceases its business operations or becomes subject to
        insolvency proceedings and the proceedings are not dismissed
        within ninety (90) days; or (iii) the other party is in material
        breach of this Agreement more than two times notwithstanding any
        cure of such breaches. Where Onix has the right to terminate
        this Agreement under this Section, Onix may suspend or terminate
        any, all, or any portion of the Services or Projects.
    
    25. Termination for Inactivity. Onix reserves the right to terminate
        the Services for inactivity, if, for a period exceeding one
        hundred and eighty (180) days, Customer (a) has failed to access
        the Admin Console, (b) a Project has no active virtual machine
        or storage resources or an Application has not served any
        requests; and (c) no invoices are being generated.
    
    26. Termination for Convenience. Customer may stop using the Service
        at any time.
    
    27. Effects of Termination. If the Agreement expires or is
        terminated, then: (i) the rights granted by one Party to the
        other will immediately cease; (ii) all Fees (including Taxes)
        owed by Customer to Onix are immediately due upon receipt of the
        final invoice; (iii) Customer will delete the Software, and any
        Application, Instance, Project, and any Customer Data from the
        Services; and (iv) upon request, each Party will use
        commercially reasonable efforts to return or destroy all
        Confidential Information of the other party in its possession.

7.  **Technical Support Services (TSS)**.
    
    28. Customer is responsible for technical support of its
        Applications and Projects.
    
    29. Subject to payment of applicable support Fees, Google and/or
        Onix will provide TSS to Customer during the License Term in
        accordance with the TSS Guidelines as specified at
        <https://cloud.google.com/terms/tssg>.

8.  **Deprecation Policy.**
    
    30. Google may discontinue any Services or any portion or feature of
        the Services for any reason at any time without liability to
        Customer.
    
    31. Notwithstanding Section 8.1, if Google intends to discontinue or
        make backwards incompatible changes to those Services that are
        specified at <https://cloud.google.com/cloud/terms/deprecation>
        (“Deprecation URL”), Google will announce such change or
        discontinuance and will use commercially reasonable efforts to
        continue to operate those versions and features of those
        Services identified at the Deprecation URL without these changes
        for at least one year after that announcement, unless (as Google
        determines in its reasonable good faith judgment):
        
        7.  required by law or third party relationship (including if
            there is a change in applicable law or relationship), or
        
        8.  doing so could create a security risk or substantial
            economic or material technical burden.
    
    32. The above policy in Section 8.2 is the “Deprecation Policy”.

9.  **Fees and Billing**.
    
    33. Usage and Invoicing. Customer will pay for all Fees based on:
        (a) Customer’s use of the Services; (b) any Reserved Units
        selected; (c) any Committed Purchases selected; and/or (d) any
        Package Purchases selected. Onix will invoice Customer on a
        monthly basis for those Fees accrued at the end of each month
        unless otherwise stated at the URL designating the Fees for an
        applicable SKU. Fees are solely based on Google's measurements
        of use of the Services under Customer’s Account and Google’s
        determination is final.
    
    34. Payment. Fees are due thirty (30) days from the invoice date.
        All payments due are in U.S. dollars. Customer’s obligation to
        pay all Fees is non-cancellable.
    
    35. Taxes. Customer is responsible for paying any Taxes, and
        Customer will pay the Fees to Onix without any deduction. If
        Onix is obligated to collect or remit Taxes imposed on Customer,
        the appropriate amount will be invoiced to and paid by Customer,
        unless Customer provides Onix with a timely and valid tax
        exemption certificate (or other documentation as required for
        the exemption) authorized by the appropriate taxing authority.
    
    36. Any terms and conditions on a purchase order do not apply to
        this Agreement and are null and void.

10. **Warranty**.

  > EXCEPT AS EXPRESSLY PROVIDED FOR HEREIN, TO THE MAXIMUM EXTENT
  > PERMITTED BY APPLICABLE LAW, ONIX AND GOOGLE DO NOT MAKE ANY OTHER
  > WARRANTY OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY OR
  > OTHERWISE, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY,
  > FITNESS FOR A PARTICULAR USE AND NONINFRINGEMENT. ONIX AND ITS
  > SUPPLIERS ARE NOT RESPONSIBLE OR LIABLE FOR THE DELETION OF OR FAILURE
  > TO STORE ANY CUSTOMER DATA AND OTHER COMMUNICATIONS MAINTAINED OR
  > TRANSMITTED THROUGH USE OF THE SERVICES. CUSTOMER IS SOLELY
  > RESPONSIBLE FOR SECURING AND BACKING UP ITS APPLICATION, PROJECT, AND
  > CUSTOMER DATA. NEITHER ONIX NOR GOOGLE, WARRANTS THAT THE OPERATION OF
  > THE SOFTWARE OR THE SERVICES WILL BE ERROR-FREE OR UNINTERRUPTED.
  > NEITHER THE SOFTWARE NOR THE SERVICES ARE DESIGNED, MANUFACTURED, OR
  > INTENDED FOR HIGH RISK ACTIVITIES.

11. **Intellectual Property Rights**.
    
    37. Except as expressly set forth herein, this Agreement does not
        grant either party any rights, implied or otherwise, to the
        other’s content or any of the other’s intellectual property. As
        between the parties, Customer owns all Intellectual Property
        Rights in Customer Data and the Application or Project (if
        applicable) and Google owns all Intellectual Property Rights in
        the Services and Software.
    
    38. Services Feedback. If Customer provides Feedback to Google, then
        Google may use that information without obligation to Customer,
        and Customer irrevocably assigns to Google all right, title, and
        interest in the Feedback..

12. **Confidentiality.**
    
    39. Confidential Information. “Confidential Information” is
        information disclosed by one Party to the other Party under this
        Agreement that is marked as confidential or would normally under
        the circumstances be considered confidential information of the
        disclosing party. Confidential Information does not include
        information that the recipient already knew, that becomes public
        through no fault of the recipient, that was independently
        developed by the recipient, or that was rightfully given to the
        recipient by another party.
    
    40. Confidentiality Obligations. The recipient of the other Party's
        Confidential Information will not disclose the Confidential
        Information, except to Affiliates, employees, agents, or
        professional advisors who need to know it and who have agreed in
        writing (or in the case of professional advisors are otherwise
        bound) to keep it confidential. The recipient will ensure that
        those people and entities use the Confidential Information only
        to exercise rights and fulfill obligations under this Agreement,
        while using reasonable care to keep it confidential. The
        recipient may also disclose Confidential Information when
        required by law after giving reasonable notice to the discloser
        if allowed by law. Customer is responsible for responding to all
        third party requests concerning its use and its End Users' use
        of the Services.

13. **Indemnity.**
    
    41. By Customer. Customer will defend and indemnify Onix and its
        Affiliates against Indemnified Liabilities in any Third-Party
        Legal Proceeding to the extent arising from: (i) any Integrated
        Solution, Application, Project, Customer Data, or Customer Brand
        Features; or (ii) Customer’s or its End Users’, use of the
        Services in violation of the AUP.
    
    42. By Onix. Onix will defend and indemnify Customer against
        Indemnified Liabilities in any Third-Party Legal Proceeding to
        the extent arising from a third party claim that Google's
        technology used to provide the Service (excluding any open
        source software) or any Google Brand Feature infringes or
        misappropriates any patent, copyright, trade secret or trademark
        of such third party. Notwithstanding the foregoing, in no event
        shall Onix have any obligations or liability under this Section
        arising from: (i) use of any Service or Google Brand Features in
        a modified form or in combination with materials not furnished
        by Google or Onix, and (ii) any Customer Data.

14. **Limitation of Liability.**
    
    43. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW AND SUBJECT TO
        SECTION 14.3 (EXCEPTIONS TO LIMITATIONS), IN NO EVENT WILL
        EITHER PARTY BE LIABLE TO THE OTHER FOR ANY SPECIAL, INCIDENTAL,
        PUNITIVE, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
        WITHOUT LIMITATION, LOST PROFITS, LOSS OF USE, LOSS OF DATA OR
        LOSS OF GOODWILL), ARISING OUT OF OR IN CONNECTION WITH THIS
        AGREEMENT OR THE PERFORMANCE OR OPERATION OF THE LICENSES,
        WHETHER SUCH LIABILITY ARISES FROM ANY CLAIM BASED UPON BREACH
        OF CONTRACT, BREACH OF WARRANTY, TORT (INCLUDING NEGLIGENCE),
        PRODUCT LIABILITY OR OTHERWISE, AND WHETHER OR NOT SUCH PARTY
        HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
    
    44. EACH PARTY'S TOTAL AGGREGATE LIABILITY FOR DIRECT DAMAGES
        ARISING OUT OF OR RELATING TO THIS AGREEMENT IS LIMITED TO THE
        FEES CUSTOMER PAID UNDER THE AGREEMENT DURING THE 12 MONTHS
        BEFORE THE LIABILITY AROSE.
    
    45. EXCEPTIONS TO LIMITATIONS. NOTHING IN THIS AGREEMENT EXCLUDES OR
        LIMITS EITHER PARTY’S LIABILITY FOR: (A) DEATH OR PERSONAL
        INJURY RESULTING FROM ITS NEGLIGENCE OR THE NEGLIGENCE OF ITS
        EMPLOYEES OR AGENTS; (B) FRAUD OR FRAUDULENT MISREPRESENTATION;
        (C) OBLIGATIONS UNDER SECTION 13 (DEFENSE AND INDEMNITY); (D)
        INFRINGEMENT OF THE OTHER PARTY’S INTELLECTUAL PROPERTY RIGHTS;
        (E) CUSTOMER’S PAYMENT OBLIGATIONS; (F) BREACHES OF
        CONFIDENTIALITY; OR (G) MATTERS FOR WHICH LIABILITY CANNOT BE
        EXCLUDED OR LIMITED UNDER APPLICABLE LAW.
    
    46. Customer acknowledges that the Licenses are provided as a
        service by Google, and Onix, to the extent permitted by
        applicable law, disclaims Google’s liability for any damages,
        whether direct or indirect, incidental or consequential, arising
        from Onix’s distribution and resale of the Services to Customer.

15. **Federal Agency Users**. The Services were developed solely at
    private expense and are commercial computer software and related
    documentation within the meaning of the Federal Acquisition
    Regulations (“FAR”) and agency supplements to the FAR.

16. **Assignment.** Neither Party may assign any part of this Agreement
    without the written consent of the other, except to an Affiliate
    where: (a) the assignee has agreed in writing to be bound by the
    terms of this Agreement; (b) the assigning party remains liable for
    obligations under the Agreement if the assignee defaults on them;
    and (c) the assigning Party has notified the other Party of the
    assignment. Any other attempt to assign is void. .

17. **Governing Law**. This Agreement is governed by Ohio law excluding
    Ohio’s choice of laws rules.

18. **Severability.** If any term, condition or provision of this
    Agreement is held or determined to be void, invalid, illegal, or
    unenforceable in any respect, in whole or in part, such term,
    condition or provision shall be severed from this Agreement, and the
    remaining terms, conditions and provisions contained herein shall
    continue in force and effect, and shall in no way be affected,
    prejudiced or disturbed thereby.

19. **Survival**. The rights and obligations of Onix and Customer
    contained in this Section and in Sections 12-14, 16-17, and 24 shall
    survive any expiration or termination of this Agreement.

20. **Waiver**. Failure to enforce any provision will not constitute a
    waiver.

21. **Headings.** The headings and titles of the various sections of
    this Agreement are intended solely for convenience of reference and
    are not intended to define, limit, explain, expand, modify or place
    any construction on any of the provisions of this Agreement.

22. **Amendments.** Any amendment must be in writing, signed by both
    parties, and expressly state that it is amending this Agreement.

23. **Force Majeure.** Onix shall not be liable for inadequate
    performance of its obligations under the Agreement to the extent
    caused by a circumstance beyond its reasonable control, including,
    without limitation, Domain Name Server issues outside its direct
    control, labor strikes or shortages, riots, insurrection, fires,
    flood, storm, explosions, acts of God, war, terrorism, governmental
    action, labor conditions, earthquakes and material shortages.

24. **Notices.** All notices, acknowledgments or other written
    communications (referred to as “Notices”) required to be given under
    this Agreement shall be in writing and shall be deemed to have been
    given and properly delivered if duly mailed by certified or
    registered mail to the other Party at its address set forth on the
    first page of this Agreement, or to such other address as either
    Party may, by written notice, designate to the other. Additionally,
    Notices sent by any other means (i.e., email, facsimile, overnight
    delivery, courier, and the like) are acceptable subject to written
    confirmation of both the transmission and receipt of the Notice.

25. **Publicity.** Customer agrees that Onix may include Customer's name
    or Brand Features in a list of Onix customers, online or in
    promotional materials. Customer also agrees that Onix may verbally
    reference Customer as a customer of the products or services that
    are the subject of this Agreement.

26. **Counterparts.** The parties may execute this Agreement in
    counterparts, including facsimile, PDF or other electronic copies
    which taken together will constitute one instrument.

27. **Equitable Relief.** Nothing in this Agreement will limit either
    party’s ability to seek equitable relief.

28. **Relationship of the Parties.** Nothing herein shall be construed
    as creating a partnership, an employment relationship, or an agency
    relationship between the parties, or as authorizing either party to
    act as agent for the other. Each party maintains its separate
    identity.

29. **Entire Agreement.** This Agreement and the Exhibits hereto and any
    documents expressly referenced herein or therein is the parties’
    entire agreement relating to its subject and supersedes any prior or
    contemporaneous agreements on that subject. The terms located at a
    URL and referenced in this Agreement are hereby incorporated by this
    reference.

30. **Definitions.**

> “Acceptable Use Policy” or “AUP” means the acceptable use policy for
> the Services at <https://cloud.google.com/cloud/terms/aup>(or such
> other URL as Google may provide).
> 
> “Account” means Customer’s Google Cloud Platform account, subject to
> those terms of service, as may be applicable.
> 
> “Admin Console” means the online console(s) and/or tool(s) provided by
> Google to Customer for administering the Services.
> 
> \\"Affiliate\\" means any entity that directly or indirectly Controls, is
> Controlled by, or is under common Control with a party.
> 
> “Application(s)” means any web application Customer creates using the
> Services, including any source code written by Customer to be used
> with the Services.
> 
> “Brand Features” means the trade names, trademarks, service marks,
> logos, domain names, and other distinctive brand features of each
> Party, respectively, as secured by such Party from time to time.
> 
> “Committed Purchase(s)” have the meaning in the Service Specific
> Terms.
> 
> “Control” means control of greater than fifty percent of the voting
> rights or equity interests of a party.
> 
> “Customer Data” means content provided to Google or Onix by Customer
> (or at its direction) through the Services under the Account.
> 
> \\"Data Processing and Security Terms\\" means the terms set out in
> Exhibit A (including its Appendices) to this Agreement.
> 
> “Documentation” means the Google documentation (as may be updated from
> time to time) in the form generally made available by Google to its
> customers for use with the Services at
> <https://cloud.google.com/docs/>.
> 
> “Emergency Security Issue” means either: (a) Customer’s, or Customer
> End Users’ use of the Services in violation of the AUP, which could
> disrupt: (i) the Services; (ii) third parties’ use of the Services; or
> (iii) the Google network or servers used to provide the Services; or
> (b) unauthorized third party access to the Services.
> 
> “End Users” means the individuals whom Customer permits to use the
> Services, Application, or Project.
> 
> “Feedback” means feedback or suggestions about the Services provided
> to Google by Customer.
> 
> “Fees” means the applicable fees for each Service and any applicable
> Taxes. The Fees for each Service are at:
> <https://cloud.google.com/skus> or are otherwise stated on the
> Ordering Document.
> 
> “High Risk Activities” means uses such as the operation of nuclear
> facilities, air traffic control, or life support systems, where the
> use or failure of the Services could lead to death, personal injury,
> or environmental damage.
> 
> “HIPAA” means the Health Insurance Portability and Accountability Act
> of 1996 as it may be amended from time to time, and any regulations
> issued under it.
> 
> “Indemnified Liabilities” means any (a) settlement amounts approved by
> the indemnifying party; and (b) damages and costs finally awarded
> against the indemnified party and its Affiliates by a court of
> competent jurisdiction.
> 
> “Instance” means a virtual machine instance, configured and managed by
> Customer, which runs on the Services. Instances are more fully
> described in the Documentation.
> 
> “Intellectual Property Rights” means current and future worldwide
> rights under patent, copyright, trade secret, trademark, or moral
> rights laws, and other similar rights.
> 
> “Ordering Document” means an order form signed by the parties that
> incorporates this Agreement.
> 
> “Package Purchase” has the meaning in the Service Specific Terms.
> 
> “Products” also referred to as “Services” means the services set forth
> at <https://cloud.google.com/cloud/services> (or such other URL as
> Google may provide) (including any associated APIs).
> 
> “Project” means a grouping of computing, storage, and API resources
> for Customer, through which Customer may use the Services. Projects
> are more fully described in the Documentation.
> 
> “Service Specific Terms” means the terms that are specific to each
> Service at
> [https://cloud.google.com/terms/service-terms](https://cloud.google.com/terms/service-terms%20)
> (or such other URL as Google may provide).
> 
> “SLA” means each of the then-current service level agreements at:
> <https://cloud.google.com/terms/sla>.
> 
> “Software” means any downloadable tools, software development kits, or
> other proprietary computer software provided by Google in connection
> with the Services that may be downloaded by Customer, and any updates
> Google may make to such Software from time to time.
> 
> “Third-Party Legal Proceeding” means any formal legal proceeding filed
> by an unaffiliated third party before a court or government tribunal
> (including any appellate proceeding).
> 
> “URL Terms” means the following URL terms: AUP, Services, Fees, SLA,
> Service Specific Terms and TSS Guidelines.

  


**Exhibit A - Data Processing and Security Terms**

**1. Introduction**

These Data Processing and Security Terms, including the Appendices
(collectively, the “Terms”) supplement the Agreement. These Terms
reflect the parties’ agreement with respect to terms governing the
processing of Customer Personal Data under the Agreement.

**2. Definitions**

2.1 In these Terms, unless expressly stated otherwise:

Additional Products means products, services and applications (whether
made available by Google or a third party) that are not part of the
Services, but that may be accessible via the Admin Console or otherwise,
for use with the Services.

Alternative Transfer Solution means any solution, other than the Model
Contract Clauses, that ensures an adequate level of protection of
personal data in a third country within the meaning of Article 25 of the
Directive

Data Incident means (a) any unlawful access to Customer Data stored in
the Services or systems, equipment, or facilities of Google or its
Subprocessors, or (b) unauthorized access to such Services, systems,
equipment, or facilities that results in loss, disclosure, or alteration
of Customer Data.

Data Protection Legislation means, as applicable: (a) any national
provisions adopted pursuant to the Directive that are applicable to
Customer and/or any Customers as the controller(s) of the Customer
Personal Data; and/or (b) the Federal Data Protection Act of 19 June
1992 (Switzerland).

Directive means Directive 95/46/EC of the European Parliament and of the
Council on the Protection of Individuals with Regard to the Processing
of Personal Data and on the Free Movement of Such Data.

EEA means the European Economic Area.

Google Group means those Google Affiliates involved in provision of the
Services to Customer.

Instructions means Customer’s written instructions to Google consisting
of the Agreement, including instructions to Google to provide the
Services as set out in the Agreement; instructions given via the Admin
Console and otherwise under Customer’s Account; and any subsequent
written instructions given by Customer (acting on behalf of itself and
its Customers) to Google and acknowledged by Google.

Model Contract Clauses or MCCs mean an agreement containing the standard
contractual clauses (processors) for the purposes of Article 26(2) of
Directive 95/46/EC for the transfer of personal data to processors
established in third countries which do not ensure an adequate level of
data protection.

Customer Personal Data means the personal data that is contained within
the Customer Data.

Security Measures has the meaning given in Section 6.1 (Security
Measures) of these Terms.

Subprocessors means (a) all Google Group entities that have logical
access to, and process, Customer Personal Data (each, a “Google Group
Subprocessor”), and (b) all third parties (other than Google Group
entities) that are engaged to provide services to Customer and that have
logical access to, and process, Customer Personal Data (each, a \\"Third
Party Subprocessor\\").

Third Party Auditor means a qualified and independent third party
auditor, whose then-current identity Google will disclose to Customer.

2.2 The terms “personal data”, “processing”, “data subject”,
“controller” and “processor” have the meanings given to them in the
Directive. The terms “data importer” and “data exporter” have the
meanings given to them in the Model Contract Clauses.

**3. Term**

These Terms will take effect on the Terms Effective Date and,
notwithstanding expiry or termination of the Agreement, will remain in
effect until, and automatically terminate upon, deletion by Google of
all data as described in Section 7 (Data Correction, Blocking,
Exporting, and Deletion) of these Terms.

**4. Data Protection Legislation**

The parties agree and acknowledge that the Data Protection Legislation
will apply to the processing of Customer Personal Data if, for example,
the processing is carried out in the context of the activities of an
establishment of the Customer in the territory of an EU Member State.

**5. Processing of Customer Personal Data**

5.1 Controller and Processor. If the Data Protection Legislation applies
to the processing of Customer Personal Data, then as between the
parties, the parties acknowledge and agree that:

(a) Google will be a processor of the Customer Personal Data and will,
within the scope of the Agreement, comply with its obligations as a
processor under the Agreement; and

(b) where Customer is a controller with respect to certain Customer
Personal Data it will, within the scope of the Agreement, comply with
its obligations as a controller under the Data Protection Legislation in
respect of that Customer Personal Data.

5.2 Customers. Where Customer is not the controller of certain Customer
Personal Data, Customer represents and warrants to Google that:

(a) it is authorized to provide the Instructions, and otherwise act on
behalf of the applicable controller, in relation to that Customer
Personal Data; and

b) Google’s processing of the Customer Personal Data, in accordance with
the Instructions, will not breach the Data Protection Legislation.

Appendix 1 sets out a description of the categories of data that may
fall within Customer Personal Data and of the categories of data
subjects to which that data may relate.

5.3 Scope of Processing. Google will only process Customer Personal Data
in accordance with the Instructions, and will not process Customer
Personal Data for any other purpose.

5.4 Additional Products. Customer acknowledges that if Additional
Products are installed, used or enabled via the Admin Console or
otherwise under the Customer’s Account, then the Services may allow such
Additional Products to access Customer Data as required for the
interoperation of those Additional Products with the Services. The
Agreement does not apply to the processing of data transmitted to or
from such Additional Products. Such Additional Products are not required
to use the Services.

**6. Data Security; Security Compliance; Audits**

6.1 Security Measures. Google will take and implement appropriate
technical and organizational measures to protect Customer Data against
accidental or unlawful destruction or accidental loss or alteration, or
unauthorized disclosure or access, or other unauthorized processing, as
detailed in Appendix 2 (the \\"Security Measures\\"). Google may update or
modify the Security Measures from time to time provided that such
updates and modifications do not result in the degradation of the
overall security of the Services. Customer agrees that it is solely
responsible for its and its Customers’ use of the Services, including
securing its and their account authentication credentials, and that
Google has no obligation to protect Customer Data that Customer or its
Customers elect to store or transfer outside of Google’s and its
Subprocessors’ systems (e.g., offline or on-premise storage).

6.2 Security Compliance by Google Staff. Google will take appropriate
steps to ensure compliance with the Security Measures by its employees,
contractors and Subprocessors to the extent applicable to their scope of
performance.

6.3 Data Incidents. If Google becomes aware of a Data Incident, Google
will promptly notify Customer of the Data Incident, and take reasonable
steps to minimize harm and secure Customer Data. Notification(s) of any
Data Incident(s) will be delivered to the email address provided by
Customer in the Agreement (or in the Admin Console) or, at Google’s
discretion, by direct Customer communication (e.g., by phone call or an
in-person meeting). Customer acknowledges that it is solely responsible
for ensuring that the contact information set forth above is current and
valid, and for fulfilling any third party notification obligations.
Customer agrees that “Data Incidents” do not include: (i) unsuccessful
access attempts or similar events that do not compromise the security or
privacy of Customer Data, including pings, port scans, denial of service
attacks, and other network attacks on firewalls or networked systems; or
(ii) accidental loss or disclosure of Customer Data caused by Customer’s
or its Customers’ use of the Services or Customer’s or its Customers’
loss of account authentication credentials. Google’s obligation to
report or respond to a Data Incident under this Section will not be
construed as an acknowledgement by Google of any fault or liability with
respect to the Data Incident.

6.4 Compliance with Security and Privacy Standards; SOC 2 and 3 Reports.
During the Term, Google will maintain the following:

(a) its ISO/IEC 27001:2013 Certification or a comparable certification
for the following Services: Google App Engine, Google Compute Engine,
Google Cloud Storage, Google Cloud Datastore, Google BigQuery Service,
Google Cloud SQL, and Google Genomics (“ISO 27001 Certification”);

(b) its confidential Service Organization Control (SOC) 2 report (or a
comparable report) on Google’s systems examining logical security
controls, physical security controls, and system availability applicable
to the following Services: Google App Engine, Google Compute Engine,
Google Cloud Storage, Google Cloud Datastore, Google BigQuery Service
and Google Cloud SQL (“SOC 2 Report”), as produced by the Third Party
Auditor and updated at least once every eighteen (18) months; and

(c) its Service Organization Control (SOC) 3 report (or a comparable
report) applicable to the following Services: Google App Engine, Google
Compute Engine, Google Cloud Storage, Google Cloud Datastore, Google
BigQuery Service and Google Cloud SQL (“SOC 3 Report”), as produced by
the Third Party Auditor and updated at least once every eighteen (18)
months.

**6.5 Auditing Security Compliance.**

6.5.1 Reviews of Security Documentation. Google will make the following
available for review by Customer:

(a) the certificate issued in relation to Google’s ISO 27001
Certification;

(b) the then-current SOC 3 Report;

(c) a summary or redacted version of the then-current confidential SOC 2
Report; and

(d) following a request by Customer in accordance with Section 6.5.4
below, the then-current confidential SOC 2 Report.

6.5.2 Customer Audits. If Customer has entered into Model Contract
Clauses as described in Section 10.2 of these Terms, Customer may
exercise the audit rights granted under clauses 5(f) and 12(2) of such
Model Contract Clauses:

(a) by instructing Google to execute the audit as described in Sections
6.4 and 6.5.1 above; and/or

(b) following a request by Customer in accordance with Section 6.5.4
below, by executing an audit as described in such Model Contract
Clauses.

6.5.3 Additional Business Terms for Reviews and Audits. Google and
Customer will discuss and agree in advance on:

(a) the reasonable date(s) of and security and confidentiality controls
applicable to any Customer review under Section 6.5.1(d); and

(b) the identity of a suitably qualified independent auditor for any
audit under Section 6.5.2(b), and the reasonable start date, scope and
duration of and security and confidentiality controls applicable to any
such audit.

Google reserves the right to charge a fee (based on Google’s reasonable
costs) for any review under Section 6.5.1(d) and/or audit under Section
6.5.2(b). For clarity, Google is not responsible for any costs incurred
or fees charged by any third party auditor appointed by Customer in
connection with an audit under Section 6.5.2(b). Nothing in this Section
6.5 varies or modifies any rights or obligations of Customer or Google
Inc. under any Model Contract Clauses entered into as described in
Section 10.2 (Transfers of Data Out of the EEA) of these Terms.

6.5.4 Requests for Reviews and Audits. Any requests under Section 6.5.1
or 6.5.2 must be sent to the Data Privacy Office as described in Section
9 (Data Privacy Office for Google Cloud Platform) of these Terms.

**7. Data Correction, Blocking, Exporting, and Deletion**

During the Term, Google will provide Customer with the ability to
correct, block, export and delete the Customer Data in a manner
consistent with the functionality of the Services and in accordance with
the terms of the Agreement. Once Customer deletes Customer Data via the
Services such that the Customer Data cannot be recovered by Customer
(the “Customer-Deleted Data”), Google will delete the Customer-Deleted
Data within a maximum period of 180 days, unless applicable legislation
or legal process prevents it from doing so. On the expiry or termination
of the Agreement (or, if applicable on expiry of any post-termination
period during which Google may agree to continue providing access to the
Services), after a recovery period of up to 30 days following such
expiry or termination, Google will thereafter delete the
Customer-Deleted Data within a maximum period of 180 days, unless
applicable legislation or legal process prevents it from doing so.

**8. Access; Export of Data**

During the Term, Google will make available to Customer the Customer
Data in a manner consistent with the functionality of the Services and
in accordance with the terms of the Agreement. To the extent Customer,
in its use and administration of the Services during the Term, does not
have the ability to amend or delete Customer Data (as required by
applicable law), or migrate Customer Data to another system or service
provider, Google will, at Customer’s reasonable expense, comply with any
reasonable requests by Customer to assist in facilitating such actions
to the extent Google is legally permitted to do so and has reasonable
access to the relevant Customer Data.

**9. Data Privacy Office for Google Cloud Platform**

Google’s Data Privacy Office for Google Cloud Platform can be contacted
by Customer administrators at:
https://support.google.com/cloud/contact/dpo (or via such other means as
Google may provide).

**10. Data Transfers**

10.1 Data Location and Transfers. Customer may select where certain
Customer Data will be stored (the \\"Data Location Selection\\"), and Google
will store it there in accordance with the Service Specific Terms. If a
Data Location Selection is not covered by the Service Specific Terms (or
a Data Location Selection is not made by Customer in respect of any
Customer Data), Google may store and process the relevant Customer Data
anywhere Google or its Subprocessors maintain facilities.

10.2 Transfers of Data Out of the EEA.

10.2.1 Customer Obligations. If the storage and/or processing of
Customer Data (as set out in Section 10.1 above) involves transfers of
Customer Personal Data out of the EEA, and Data Protection Legislation
applies to the transfers of such data (**“Transferred Personal Data”**),
Customer acknowledges that Data Protection Legislation will require
Customer to enter into Model Contract Clauses in respect of such
transfers, unless Google has adopted an Alternative Transfer Solution.

10.2.2 Google Obligations. In respect of Transferred Personal Data,
Google will:

(a) if requested to do so by Customer, ensure that Google Inc. as the
importer of the Transferred Personal Data enters into Model Contract
Clauses with Customer as the exporter of such data, and that the
transfers are made in accordance with such Model Contract Clauses;
and/or

(b) adopt an Alternative Transfer Solution and ensure that the transfers
are made in accordance with such solution.

10.3 Data Center Information. Google will make available to Customer
information about the countries in which data centers used to store
Customer Personal Data are located.

**11. Subprocessors**

11.1 Subprocessors. Google may engage Subprocessors to provide limited
parts of the Services, subject to the restrictions in these Terms.

11.2 Subprocessing Restrictions. Google will ensure that Subprocessors
only access and use Customer Data in accordance with Section 10.1 (Data
Location and Transfers) and terms of the Agreement and that they are
bound by written agreements that require them to provide at least the
level of data protection required by the following, as applicable
pursuant to Section 10.2 (Transfers of Data Out of the EEA): (a) any
Model Contract Clauses entered into by Google Inc. and Customer; and/or
(b) any Alternative Transfer Solution adopted by Google.

11.3 Consent to Subprocessing. Customer consents to Google
subcontracting the processing of Customer Data to Subprocessors in
accordance with the Agreement. If the Model Contract Clauses have been
entered into as described above, Customer consents to Google Inc.
subcontracting the processing of Customer Data in accordance with the
terms of the Model Contract Clauses.

11.4 Additional Information. Information about Third Party Subprocessors
is available at: https://cloud.google.com/terms/third-party-suppliers,
as such URL may be updated by Google from time to time. The information
available at this URL is accurate as at the time of publication. At the
written request of the Customer, Google will provide additional
information regarding Subprocessors and their locations. Any such
requests must be sent to Google’s Data Privacy Office for Google Cloud
Platform, the contact details of which are set out in Section 9 (Data
Privacy Office for Google Cloud Platform) above.

11.5 Termination. If the Model Contract Clauses have been entered into
by the parties: (i) Google will, at least 15 days before appointing any
new Third Party Subprocessor, inform Customer of the appointment
(including the name and location of such subprocessor and the activities
it will perform) either by sending an email to Customer or via the Admin
Console; and (ii) if Customer objects to Google's use of any new Third
Party Subprocessors, Customer may, as its sole and exclusive remedy,
terminate the Agreement by giving written notice to Google within 30
days of being informed by Google of the appointment of such
subprocessor.

**12. Liability Cap**

If Google Inc. and Customer enter into Model Contract Clauses as
described above, then, subject to the remaining terms of the Agreement
relating to liability (including any specific exclusions from any
limitation of liability), the total combined liability of Google and its
Affiliates, on the one hand, and Customer and its Affiliates, on the
other hand, under or in connection with the Agreement and all those MCCs
combined will be limited to the maximum monetary or payment-based
liability amount set out in the Agreement.

**13. Third Party Beneficiary**

13.1 Google Inc. Notwithstanding anything to the contrary in the
Agreement, where Google Inc. is not a party to the Agreement, Google
Inc. will be a third party beneficiary of Section 6.5 (Auditing Security
Compliance), Section 11.3 (Consent to Subprocessing), and Section 12
(Liability Cap) of these Terms.

13.2 Other Third Parties. Except as expressly provided herein and
subject to Section 13.1, no one other than a party to this Agreement
shall have any right to enforce any of its terms. For the avoidance of
doubt, this includes Customers, who shall not have any right to enforce
this Agreement.

**14. Priority**

Notwithstanding anything to the contrary in the Agreement, to the extent
of any conflict or inconsistency between these Terms and the remaining
terms of the Agreement, these Terms will govern.

**Appendix 1: Categories of Personal Data and Data Subjects**

1. Categories of Personal Data. Data relating to individuals provided
to Google via the Services, by (or at the direction of) Customer.

2. Data Subjects. Data subjects include the individuals about whom data
is provided to Google via the Services by (or at the direction of)
Customer.

**Appendix 2: Security Measures**

As of the Terms Effective Date, Google will take and implement the
Security Measures set out in this Appendix. Google may update or modify
such Security Measures from time to time provided that such updates and
modifications do not result in the degradation of the overall security
of the Services.

**1. Data Center and Network Security**

(a) Data Centers.

Infrastructure. Google maintains geographically distributed data
centers. Google stores all production data in physically secure data
centers.

Redundancy. Infrastructure systems have been designed to eliminate
single points of failure and minimize the impact of anticipated
environmental risks. Dual circuits, switches, networks or other
necessary devices help provide this redundancy. The Services are
designed to allow Google to perform certain types of preventative and
corrective maintenance without interruption. All environmental equipment
and facilities have documented preventative maintenance procedures that
detail the process for and frequency of performance in accordance with
the manufacturer’s or internal specifications. Preventative and
corrective maintenance of the data center equipment is scheduled through
a standard change process according to documented procedures.

Power. The data center electrical power systems are designed to be
redundant and maintainable without impact to continuous operations, 24
hours a day, 7 days a week. In most cases, a primary as well as an
alternate power source, each with equal capacity, is provided for
critical infrastructure components in the data center. Backup power is
provided by various mechanisms such as uninterruptible power supplies
(UPS) batteries, which supply consistently reliable power protection
during utility brownouts, blackouts, over voltage, under voltage, and
out-of-tolerance frequency conditions. If utility power is interrupted,
backup power is designed to provide transitory power to the data center,
at full capacity, for up to 10 minutes until the diesel generator
systems take over. The diesel generators are capable of automatically
starting up within seconds to provide enough emergency electrical power
to run the data center at full capacity typically for a period of days.

Server Operating Systems. Google servers use a Linux based
implementation customized for the application environment. Data is
stored using proprietary algorithms to augment data security and
redundancy. Google employs a code review process to increase the
security of the code used to provide the Services and enhance the
security products in production environments.

Businesses Continuity. Google replicates data over multiple systems to
help to protect against accidental destruction or loss. Google has
designed and regularly plans and tests its business continuity
planning/disaster recovery programs.

(b) Networks and Transmission.

Data Transmission. Data centers are typically connected via high-speed
private links to provide secure and fast data transfer between data
centers. This is designed to prevent data from being read, copied,
altered or removed without authorization during electronic transfer or
transport or while being recorded onto data storage media. Google
transfers data via Internet standard protocols.

External Attack Surface. Google employs multiple layers of network
devices and intrusion detection to protect its external attack surface.
Google considers potential attack vectors and incorporates appropriate
purpose built technologies into external facing systems.

Intrusion Detection. Intrusion detection is intended to provide insight
into ongoing attack activities and provide adequate information to
respond to incidents. Google intrusion detection involves:

(i) tightly controlling the size and make-up of Google’s attack surface
through preventative measures;

(ii) employing intelligent detection controls at data entry points; and

(iii) employing technologies that automatically remedy certain dangerous
situations.

Incident Response. Google monitors a variety of communication channels
for security incidents, and Google’s security personnel will react
promptly to known incidents.

Encryption Technologies. Google makes HTTPS encryption (also referred to
as SSL or TLS connection) available.

**2. Access and Site Controls**

(a) Site Controls.

On-site Data Center Security Operation. Google’s data centers maintain
an on-site security operation responsible for all physical data center
security functions 24 hours a day, 7 days a week. The on-site security
operation personnel monitor closed circuit TV (CCTV) cameras and all
alarm systems. On-site security operation personnel perform internal and
external patrols of the data center regularly.

Data Center Access Procedures. Google maintains formal access procedures
for allowing physical access to the data centers. The data centers are
housed in facilities that require electronic card key access, with
alarms that are linked to the on-site security operation. All entrants
to the data center are required to identify themselves as well as show
proof of identity to on-site security operations. Only authorized
employees, contractors and visitors are allowed entry to the data
centers. Only authorized employees and contractors are permitted to
request electronic card key access to these facilities. Data center
electronic card key access requests must be made through e-mail, and
requires the approval of the requestor’s manager and the data center
director. All other entrants requiring temporary data center access
must: (i) obtain approval in advance from the data center managers for
the specific data center and internal areas they wish to visit; (ii)
sign in at on-site security operations; and (iii) reference an approved
data center access record identifying the individual as approved.

On-site Data Center Security Devices. Google’s data centers employ an
electronic card key and biometric access control system that is linked
to a system alarm. The access control system monitors and records each
individual’s electronic card key and when they access perimeter doors,
shipping and receiving, and other critical areas. Unauthorized activity
and failed access attempts are logged by the access control system and
investigated, as appropriate. Authorized access throughout the business
operations and data centers is restricted based on zones and the
individual’s job responsibilities. The fire doors at the data centers
are alarmed. CCTV cameras are in operation both inside and outside the
data centers. The positioning of the cameras has been designed to cover
strategic areas including, among others, the perimeter, doors to the
data center building, and shipping/receiving. On-site security
operations personnel manage the CCTV monitoring, recording and control
equipment. Secure cables throughout the data centers connect the CCTV
equipment. Cameras record on site via digital video recorders 24 hours a
day, 7 days a week. The surveillance records are retained for up to 30
days based on activity.

(b) Access Control.

Infrastructure Security Personnel. Google has, and maintains, a security
policy for its personnel, and requires security training as part of the
training package for its personnel. Google’s infrastructure security
personnel are responsible for the ongoing monitoring of Google’s
security infrastructure, the review of the Services, and responding to
security incidents.

Access Control and Privilege Management. Customer’s administrators must
authenticate themselves via a central authentication system or via a
single sign on system in order to administer the Services.

Internal Data Access Processes and Policies – Access Policy. Google’s
internal data access processes and policies are designed to prevent
unauthorized persons and/or systems from gaining access to systems used
to process personal data. Google designs its systems to (i) only allow
authorized persons to access data they are authorized to access; and
(ii) ensure that personal data cannot be read, copied, altered or
removed without authorization during processing, use and after
recording. The systems are designed to detect any inappropriate access.
Google employs a centralized access management system to control
personnel access to production servers, and only provides access to a
limited number of authorized personnel. LDAP, Kerberos and a proprietary
system utilizing RSA keys are designed to provide Google with secure and
flexible access mechanisms. These mechanisms are designed to grant only
approved access rights to site hosts, logs, data and configuration
information. Google requires the use of unique user IDs, strong
passwords, two factor authentication and carefully monitored access
lists to minimize the potential for unauthorized account use. The
granting or modification of access rights is based on: the authorized
personnel’s job responsibilities; job duty requirements necessary to
perform authorized tasks; and a need to know basis. The granting or
modification of access rights must also be in accordance with Google’s
internal data access policies and training. Approvals are managed by
workflow tools that maintain audit records of all changes. Access to
systems is logged to create an audit trail for accountability. Where
passwords are employed for authentication (e.g., login to workstations),
password policies that follow at least industry standard practices are
implemented. These standards include password expiry, restrictions on
password reuse and sufficient password strength. For access to extremely
sensitive information (e.g. credit card data), Google uses hardware
tokens.

**3. Data**

(a) Data Storage, Isolation and Logging. Google stores data in a
multi-tenant environment on Google-owned servers. The data and file
system architecture are replicated between multiple geographically
dispersed data centers. Google also logically isolates the Customer’s
data. Customer will be given control over specific data sharing
policies. Those policies, in accordance with the functionality of the
Services, will enable Customer to determine the product sharing settings
applicable to Customer End Users for specific purposes. Customer may
choose to make use of certain logging capability that Google may make
available via the Services.

(b) Decommissioned Disks and Disk Erase Policy. Certain disks containing
data may experience performance issues, errors or hardware failure that
lead them to be decommissioned (“Decommissioned Disk”). Every
Decommissioned Disk is subject to a series of data destruction processes
(the “Disk Erase Policy”) before leaving Google’s premises either for
reuse or destruction. Decommissioned Disks are erased in a multi-step
process and verified complete by at least two independent validators.
The erase results are logged by the Decommissioned Disk’s serial number
for tracking. Finally, the erased Decommissioned Disk is released to
inventory for reuse and redeployment. If, due to hardware failure, the
Decommissioned Disk cannot be erased, it is securely stored until it can
be destroyed. Each facility is audited regularly to monitor compliance
with the Disk Erase Policy.

**4. Personnel Security**

Google personnel are required to conduct themselves in a manner
consistent with the company’s guidelines regarding confidentiality,
business ethics, appropriate usage, and professional standards. Google
conducts reasonably appropriate backgrounds checks to the extent legally
permissible and in accordance with applicable local labor law and
statutory regulations.

Personnel are required to execute a confidentiality agreement and must
acknowledge receipt of, and compliance with, Google’s confidentiality
and privacy policies. Personnel are provided with security training.
Personnel handling Customer Data are required to complete additional
requirements appropriate to their role (eg., certifications). Google’s
personnel will not process Customer Data without authorization.

**5. Subprocessor Security**

Prior to onboarding Subprocessors, Google conducts an audit of the
security and privacy practices of Subprocessors to ensure Subprocessors
provide a level of security and privacy appropriate to their access to
data and the scope of the services they are engaged to provide. Once
Google has assessed the risks presented by the Subprocessor, then
subject to the requirements set out in Section 11.2 (Subprocessing
Restrictions) of these Terms, the Subprocessor is required to enter into
appropriate security, confidentiality and privacy contract terms.

Note: By clicking on the box you are indicating you have read this
Agreement and agree to the Terms of Use above including the Terms
repeated
here:

<https://cloud.google.com/terms/services>

<http://www.google.com/dmca.html>

<https://cloud.google.com/terms/tssg>

<https://cloud.google.com/cloud/terms/deprecation>

<https://cloud.google.com/cloud/terms/aup>

https://cloud.google.com/docs

<https://cloud.google.com/skus>

<https://cloud.google.com/cloud/services>

<https://cloud.google.com/terms/service-terms>

<https://cloud.google.com/terms/sla>
`

class FreeTrialEulas extends Component {
  render() {
    const { pageTwo } = this.props
    return div({ style: { maxHeight: 500, maxWidth: 1500, overflowY: 'auto', lineHeight: 1.5, marginTop: '1rem', paddingRight: '1rem' } }, [
      h(Markdown, {
        renderers: {
          link: newWindowLinkRenderer,
          paragraph: text => {
            return `<p style="margin-top: 0">${text}</p>`
          }
        }
      }, [pageTwo ? onixEula : broadEula])
    ])
  }
}

export default FreeTrialEulas
