# KirthiVerse India Launch Compliance Checklist

This checklist is a release-control artefact, not legal advice.

## Governance

- [ ] Product owner identified
- [ ] Data protection/privacy owner identified
- [ ] Security owner identified
- [ ] Grievance contact identified
- [ ] India legal review completed against laws and rules in force on launch date
- [ ] No unsupported compliance wording in product or marketing

## Data inventory and purpose

- [ ] Every personal-data field inventoried
- [ ] Purpose recorded for every field
- [ ] Child-data fields minimised
- [ ] No Aadhaar, APAAR, precise location or photograph required for normal learning
- [ ] Data-flow diagram approved
- [ ] Processor/sub-processor register approved

## Notice and consent

- [ ] Adult privacy notice available
- [ ] Child-readable privacy notice available
- [ ] Consent purpose is specific and understandable
- [ ] Parent/guardian or school authority verification implemented
- [ ] Consent version and timestamp recorded
- [ ] Withdrawal workflow tested
- [ ] Correction workflow tested
- [ ] Export workflow tested
- [ ] Erasure workflow tested
- [ ] Grievance workflow tested

## Child-safety design

- [ ] No public child profiles
- [ ] No public child search
- [ ] No open direct messaging
- [ ] No behavioural advertising
- [ ] No sale of child data
- [ ] No precise geolocation
- [ ] No facial recognition
- [ ] Private/pseudonymous competitions only
- [ ] Wellbeing and daily-use controls reviewed
- [ ] Dark-pattern review completed

## Security

- [ ] Passkeys/MFA for privileged adults
- [ ] Secure HTTP-only session cookies
- [ ] Role and tenant checks on every protected API
- [ ] Rate limiting and abuse controls
- [ ] Encryption in transit and at rest
- [ ] Audit logging
- [ ] Secret scanning
- [ ] Dependency scanning
- [ ] SAST
- [ ] Penetration test
- [ ] Backup restore test
- [ ] Incident-response exercise
- [ ] Key rotation procedure

## Retention and deletion

- [ ] Retention schedule approved
- [ ] Inactive account workflow approved
- [ ] Child-profile deletion verified in primary systems
- [ ] Backup expiry/deletion documented
- [ ] Security and audit retention justified
- [ ] Data is not retained indefinitely by default

## School and tutor controls

- [ ] School tenant isolation tested
- [ ] Teacher class scope tested
- [ ] Tutor assignment approval tested
- [ ] Tutor access revocation tested
- [ ] CSV import validation tested
- [ ] Admin actions audited
- [ ] School contract/data-processing terms reviewed

## Accessibility and quality

- [ ] WCAG 2.2 AA audit target assessed
- [ ] Keyboard navigation tested
- [ ] Screen-reader flows tested
- [ ] Reduced-motion mode tested
- [ ] Larger-text mode tested
- [ ] Mobile/tablet/desktop tested
- [ ] No critical console errors
- [ ] Performance budget met

## Launch approval

- [ ] Product approval
- [ ] Security approval
- [ ] Privacy approval
- [ ] Legal approval
- [ ] Operations approval
- [ ] Rollback tested
- [ ] Live smoke test passed
