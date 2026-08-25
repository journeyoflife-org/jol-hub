# Emergency Rollback Procedure — JOL frontend (Appendix B)

Severity-first response for the template-renderer fleet. This runbook is
the operational counterpart of `scripts/deploy.sh` / `scripts/rollback.sh`
and the abort rule in `WAVE0-CHECKLIST.md`.

## 1. STOP — assess severity

| Level | Definition | Response time |
| --- | --- | --- |
| **P0** | Site down, data at risk, security breach | immediate rollback, all hands |
| **P1** | Core flow broken (contact form, booking, auth) | rollback within 30 min |
| **P2** | Degradation (slow page, visual defect) | schedule fix; rollback optional |

Do not panic. One person owns the keyboard; everyone else communicates.

## 2. Snapshot

If no snapshot was taken before the failing deploy (it should have been —
deploy.sh refuses without `--confirm-snapshot`), take one now IF safe:

```bash
# Proxmox host — VM id per jol-infrastructure inventory
vzdump <vmid> --snapshot --notes-text "pre-rollback $(date -u +%FT%TZ)"
```

Skip only if snapshotting would extend an ongoing outage; record why.

## 3. Revert

```bash
# In the repo (branch feat/pages-step6 until merged):
git revert HEAD            # new commit — never force-push shared history
```

Or restore the release branch used for the last known-good deploy.

## 4. Deploy the revert

```bash
# Fast path — previous release is still on disk (keeps 5 releases):
frontend/apps/template-renderer/scripts/rollback.sh

# Full path — revert committed, rebuild from last good code:
frontend/apps/template-renderer/scripts/deploy.sh --env production --confirm-snapshot
```

If rollback.sh's own health check fails → restore the VM snapshot (step 2)
and escalate to ops.

## 5. Verify

- Health: `curl -fsS https://<host>/api/health` → expect 200 + `"status":"ok"`
- Smoke: home page of all 5 Wave-0 reference tenants returns 200 with titles
- Monitor: Grafana frontend dashboard — error rate < 1 %, no new P0 alerts,
  CWV panels stable. Keep watching for 2 hours (standing rule).

## 6. Communicate

- Notify: JOL dev, JOL ops, Diocese contact (per contact matrix)
- Update the incident log (GitHub issue, labels `incident` + `wave0`)
- rollback.sh already fired the alert webhook — confirm it arrived

## 7. Post-mortem

- Mandatory within **24 h** for P0/P1
- Blameless: timeline, root cause, detection gap, fix, prevention
- Output lands in `jol-infrastructure/incidents/` and updates this runbook
  if it revealed a gap
