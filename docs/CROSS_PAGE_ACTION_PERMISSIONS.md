# Cross-page action permissions

Buttons that take the user to another page are shown only when the user's menu allows what the button is for on that page.

## How it works

- Based on the logged-in user's menu (the same one that builds the sidebar).
- Each button checks its target page, by URL, and one permission on it (for example `add` or `get`).
- Hidden when the target page isn't in the menu, the permission is `false`, or the menu is still loading or failed.
- `add` also counts when the menu says `create`, and `get` when it says `view`.
- Matched by URL, not by menu name: renaming a menu item changes nothing.
- Permission changes take effect after the user logs in again.
- Only hides buttons; the backend still checks permissions on every request.

## Adding an entry

- Copy an entry below.
- Fill in every field. Mark anything undecided as **Open**.

---

## Admission

### Enquiry List › Convert

- **Page:** Enquiry List, row action menu
- **Goes to:** Application Payment, with the enquiry filled in
- **Shown when:** Application Payment is in the menu with `add`
- **Why `add`:** with only `get`, the payment form opens but can't be saved
- **Open:** show it with `get` too? Options:
  - keep `add` (current)
  - use `get`
  - use `get`, and tell view-only users on the payment page that they need `add` to save
### Enquiry Follow-up Master › Convert / Enquiry Follow-up › Convert

- **Pages:** Enquiry Follow-up Master, Enquiry Follow-up, row action menu
- **Goes to:** Application Payment, with the enquiry filled in
- **Shown when:** Application Payment is in the menu with `add`
- **Same rule and open question as** Enquiry List › Convert
### Dashboard › New Application / New

- **Page:** Admission Dashboard, page header and Recent Applications card
- **Goes to:** Application Payment
- **Shown when:** Application Payment is in the menu with `add`
### Dashboard › View All

- **Page:** Admission Dashboard, Recent Applications card
- **Goes to:** All Applicants
- **Shown when:** All Applicants is in the menu with `get`
### Dashboard › Review →

- **Page:** Admission Dashboard, row action menu on a Submitted application
- **Goes to:** Vetting Desk
- **Shown when:** Vetting Desk is in the menu with `get`
- **Open:** require `approve` instead, so only people who can act on it see Review?
### Dashboard › Register →

- **Page:** Admission Dashboard, row action menu on a Vetted application
- **Goes to:** Registrar's Desk
- **Shown when:** Registrar's Desk is in the menu with `register`
### Dashboard › Vetting Queue: Open and row click

- **Page:** Admission Dashboard, Vetting Queue card
- **Goes to:** Vetting Desk
- **Shown when:** Vetting Desk is in the menu with `get`
- **Otherwise:** Open hidden; rows stay visible as plain information (not clickable)
### Dashboard › Ready to Register: Open and row click

- **Page:** Admission Dashboard, Ready to Register card
- **Goes to:** Registrar's Desk
- **Shown when:** Registrar's Desk is in the menu with `get`
- **Otherwise:** Open hidden; rows stay visible as plain information (not clickable)
### Dashboard / All Applicants › Student Profile

- **Pages:** Admission Dashboard, All Applicants, row action menu (registered applicants only)
- **Goes to:** Student Profile (Student module)
- **Shown when:** Student Profile is in the menu with `get`
### Application Payment › Proceed to Filing

- **Page:** Application Payment, saved receipt
- **Goes to:** Application Filing, with the applicant filled in
- **Shown when:** Application Filing is in the menu with `add`
### Application Filing › Stage 1

- **Page:** Application Filing, page header (back button)
- **Goes to:** Application Payment
- **Shown when:** Application Payment is in the menu with `get`
### Application Filing › Continue to Vetting

- **Page:** Application Filing, "Application Submitted!" pop-up
- **Goes to:** Vetting Desk
- **Shown when:** Vetting Desk is in the menu with `get`
- **Otherwise:** replaced by **File another application** (closes the pop-up and clears the page), so the pop-up always has a way out
### Registrar's Desk › Back to Dashboard

- **Page:** Registrar's Desk, pop-up after registering a student
- **Goes to:** Admission Dashboard
- **Shown when:** Admission Dashboard is in the menu with `get`
- **Otherwise:** replaced by **Done** (closes the pop-up)
### Back / Cancel / after-save redirects to Enquiry List

- **Where:** Enquiry Follow-up Master › Back; Cancel on the enquiry form, kiosk, on-desk and online enquiry pages; the redirect after saving an on-desk or online enquiry
- **Goes to:** Enquiry List
- **Issue:** a user who can add enquiries but can't see Enquiry List lands on a page they can't open
- **Fix needed:** send them to a page they can open, instead of hiding the button
- **Status:** **Open**
