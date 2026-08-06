# Application Payment - Change Requests

## UI Changes

1.  **Intake Dropdown**
    -   The **Intake** dropdown should appear first.
    -   Only after selecting an **Intake** should the **Enquiry**
        dropdown be enabled.
    -   The **Enquiry** dropdown must be populated based on the selected
        **Intake**.
2.  **Enquiry Dropdown**
    -   Use the following API to populate the **Enquiry** dropdown:
        -   `GET {{baseUrl}}/api/v1/admissions/application-payments/unconverted-enquiries?intakeGuid={intakeGuid}&page=1&pageSize=10`
    -   The API should return only enquiries that have **not yet been
        converted into students**.
    -   Once an enquiry is selected, automatically populate the relevant
        **Application Payment** fields using the enquiry details.
3.  **Remove Fields**
    -   Remove the **Application Source** dropdown.
    -   Remove the **Profile Photo** field.
4.  **Bank Dropdown**
    -   Populate the **Bank** dropdown using the **`m_proc_bank` API
        (Proc Bank Master API)**.
5.  **Exemption Type**
    -   If the user selects an **Exemption Type**, disable the following
        fields:
        -   Payment Method
        -   Receipt Book
        -   Amount
        -   Currency
        -   Bank Account
6.  **Receipt Details**
    -   Do not provide dropdowns for:
        -   Receipt Type
        -   Receipt / Reference No.
    -   Return these values in the **successful save response**.
7.  **Interested Programme**
    -   The **Interested Programme** dropdown should be populated based
        on the selected **Campus**.
    -   Use the following API to retrieve the programmes for the
        selected campus:
        -   `GET /api/v1/academic/program-master/by-campus/{campusGuid}`
    -   Display only the programmes returned by this API for the
        selected campus.
