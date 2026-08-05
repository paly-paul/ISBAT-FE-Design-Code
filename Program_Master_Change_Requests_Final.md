# Program Master - Change Requests

## Programme Details Page

1.  **Specialization**
    -   The **Specialization** field is **not mandatory**.
    -   No validation is required for this field.
2.  **Date of Accreditation**
    -   The **Date of Accreditation** field is **not mandatory**.
    -   No validation is required for this field.
3.  **Intake**
    -   Remove the **Intake** dropdown.

------------------------------------------------------------------------

## Home Page

1.  **Specialization Option**
    -   When the user clicks the **three dots** for a programme and
        selects **Specialization**, display the specializations for the
        selected programme.
    -   Use the following API:
        -   `GET /api/v1/academic/specializations?programGuid={programGuid}`
    -   Bruno File:
        -   `Academic/Program-Structure/Specializations/List.bru`
2.  **Curriculum Option**
    -   When the user clicks the **three dots** for a programme and
        selects **Curriculum**, display the course units for the
        selected programme.
    -   Use the following API:
        -   `GET /api/v1/academic/program-course-units/{programGuid}`
    -   Bruno File:
        -   `Academic/Program-Course-Units/GetByProgram.bru`

------------------------------------------------------------------------

## Course Unit Allocation Page

1.  **Specialization Mapping**
    -   The **Specialization** should not be associated with the
        **Semester**.
    -   The **Specialization** should be associated with the **Course
        Unit**.
    -   The user should:
        -   Select a **Course Unit**.
        -   Select the **Unit Type** for the selected Course Unit.
        -   If the selected **Unit Category** is **Specialization**,
            display the **Specialization** dropdown.
    -   The **Specialization** dropdown should list all specializations
        added in the **Programme Details** page for the selected
        programme.
    -   The user should be able to select one specialization against the
        selected course unit.
    -   Refer to the **legacy system Program Course Unit** page for the
        expected behavior.
2.  **Course Unit Validation**
    -   The **No. of Course Units** field in the **Programme Details**
        page is **not mandatory**.
    -   If the **No. of Course Units** field is left blank, no
        validation is required in the **Course Unit Allocation** page.
    -   If the user enters a value for **No. of Course Units** in the
        **Programme Details** page, validate the number of course units
        added in the **Course Unit Allocation** page.
    -   Users should not be allowed to add fewer or more course units
        than the configured **No. of Course Units**.
3.  **Additional Feature**
    -   Display the **Syllabus Outline** and **Taught By** details for
        the selected course unit.
    -   These details can be retrieved using the **Get Course Unit
        API**.
