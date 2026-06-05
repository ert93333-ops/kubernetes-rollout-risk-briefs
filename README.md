# Kubernetes Rollout Risk Briefs

Static browser-local MVP for turning public-safe Kubernetes rollout notes or scrubbed manifest excerpts into a reviewer-ready rollout risk brief, missing-context checklist, rollback handoff, validation path, and secret/cluster-data privacy flags.

## Public pages

- Landing: `https://ert93333-ops.github.io/kubernetes-rollout-risk-briefs/`
- Checklist: `https://ert93333-ops.github.io/kubernetes-rollout-risk-briefs/kubernetes-rollout-checklist.html`

## Scope

- No kubectl execution, kubeconfig, cluster credentials, Kubernetes API calls, raw logs, secret manifests, rollout execution, rollback execution, remediation, backend, or external database.
- Shared marketing and notification credentials stay in the private root `.env` of the Hermes playbook, not in this public site directory.

## Verification

From the Hermes playbook root:

```powershell
npm run workflow:kubernetes-rollout-risk
```
