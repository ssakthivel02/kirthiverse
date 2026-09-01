# KirthiVerse production rollback runbook

## Purpose

Restore the last known-good KirthiVerse application release when a confirmed production regression cannot be safely corrected within the release window.

## Do not use rollback for

- a local browser-cache problem affecting only one device;
- a monitoring runtime failure without matching user impact;
- a transient deployment propagation delay while the workflow is still running;
- an unrelated API or Cloudflare Worker issue when the static website is healthy;
- a certificate or DNS change without independent DNS and certificate evidence.

Do not change DNS, Cloudflare Workers, GitHub Pages custom-domain settings or certificates during a normal application rollback.

## Rollback triggers

Rollback is justified when one or more of these are confirmed on the production custom domain:

- homepage or core learning routes do not load for multiple clean browsers;
- compiled assets return persistent errors;
- learner progress is corrupted or reset unexpectedly;
- quiz completion or recovery is blocked;
- critical accessibility navigation is broken;
- the deployed commit does not match the intended release;
- privacy boundaries are violated;
- the production workflow cannot recover through a safe forward fix within the approved window.

## Evidence to capture first

- current time and tester;
- production URL;
- affected routes;
- browser and device;
- screenshots or recording;
- console/network error text;
- `release-status.json` content;
- `deployment-metadata.json` content;
- current main SHA;
- last known-good main SHA;
- deployment workflow run ID;
- live verification report.

## Preferred rollback method — revert the release commit

Use a normal Git revert so history remains auditable.

1. Identify the KVS-PLATFORM-001 squash-merge commit on `main`.
2. Confirm the parent commit is the last known-good production baseline.
3. In GitHub, open the merged PR and use **Revert** when available, or create a revert commit locally through an approved Git workflow.
4. Open the generated rollback PR against `main`.
5. Confirm the rollback PR changes only the intended release files.
6. Run all required GitHub Actions gates.
7. Merge the rollback PR only when the gates are green.
8. Allow the standard Pages workflow to deploy the reverted artifact.
9. Confirm the post-deployment live verification passes.
10. Record the rollback commit and workflow run.

## Emergency rollback method — move back through a reviewed PR

When GitHub cannot automatically create the revert PR:

1. create a new branch from `main`;
2. revert the identified release commit;
3. push the branch;
4. open a clearly titled rollback PR;
5. preserve the same validation and approval requirements;
6. never force-push `main`;
7. never delete production history.

Suggested title:

`revert: roll back KVS-PLATFORM-001 production release`

## Verification after rollback

Confirm all of the following:

- homepage returns HTTP 200;
- compiled JavaScript and CSS load;
- direct Learning Worlds, Search, Mathematics and Help routes recover;
- the release and deployment metadata identify the rollback commit;
- local-first remains true;
- cloud child profiles remain false;
- school rosters remain false;
- privacy, parent, security and accessibility pages are available;
- service-worker update does not leave clients stuck on the failed version;
- a private-window test shows the restored version;
- one previously open tab updates or reloads safely;
- live-site smoke evidence is retained.

## Service-worker consideration

A returning browser may temporarily hold the previous service worker. After rollback deployment:

1. wait for the new deployment to complete;
2. open the site in a private window to verify the network version;
3. reload an existing normal window;
4. use the in-app update prompt when shown;
5. do not instruct users to delete all browser data unless a verified cache defect remains.

## Communication record

Record:

- incident summary:
- rollback reason:
- affected release commit:
- restored baseline commit:
- rollback PR:
- rollback workflow run:
- live verification result:
- user impact duration:
- follow-up issue numbers:
- owner:
- completion time:

## Post-rollback action

- keep the failed feature branch and evidence;
- create a root-cause issue;
- reproduce the failure outside production;
- add a regression test before attempting the release again;
- do not re-merge the same commit unchanged;
- confirm no DNS or infrastructure setting was altered without separate evidence and approval.
