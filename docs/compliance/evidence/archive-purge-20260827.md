# Transcript Archive Purge Evidence — S-01 + MS-01 (D-028), 2026-08-27

Owner decisions verbatim: "jol-qoder-history (hub, S-01): PURGE" · "jol-m-qoder-history (marketplace, MS-01): PURGE" · "Standing rule: no transcript exports into any repo, either tree, going forward."

## Pre-purge verification (measured)

| Archive | Location | Remotes | Files (excl. .git) | In parent-tree history? |
|---|---|---|---|---|
| jol-qoder-history | /opt/jol/repos/ | **0** | 1111 | no (ls-files 0; log-all 0) |
| jol-m-qoder-history | /opt/jol-m/repos/ | **0** | 114 | n/a (separate tree; never referenced) |

No-remote state re-verified immediately before purge (both `git remote -v` empty).

## Execution

Both archive directories moved to `/tmp/jol-archive-purge-20260827/` (dated recovery window — recoverable until the owner confirms permanent deletion; after confirmation, the window contents are deleted). Original paths verified absent. Defensive gitignore entries added in BOTH parent trees: `*qoder-history*/` with the standing-rule comment. Post-purge archive counts at original locations: **0 and 0**.

**2026-08-28 UPDATE (D-033):** owner authorized permanent deletion; `/tmp/jol-archive-purge-20260827/` (both archives) deleted and verified absent (`ls`: No such file or directory). **Zero on-host copies remain.** The S-01/MS-01 purge is final.

## Git history — deliberately NOT rewritten

Change-control integrity: rewriting history (filter-branch/filter-repo) is outside this program's authority and unnecessary here — neither archive was ever committed to a parent tree (verified: zero tracked files, zero history references) and neither had a remote, so **no published or shared history contains the transcripts**. The purge eliminates the working-tree exposure completely.

**STANDING CAVEAT (recorded per task):** if a remote ever appears for either archive's content — or any copy surfaces elsewhere — the exposure assessment must be revisited immediately (at that point history-scrubbing and notification analysis become relevant).

## Residual exposure — honest statement

- Working trees: clean (0 archive files in either tree; gitignored against regrowth).
- Git history: never contained the archives (verified, not assumed).
- The dated `/tmp` recovery window holds the only remaining copies on this host until the owner confirms final deletion.
- Copies outside this host (e.g., the export tool's own storage, IDE sync, backups) are outside the program's visibility — the standing no-export rule prevents recurrence but cannot attest to prior tool-side storage; owner awareness recommended.
