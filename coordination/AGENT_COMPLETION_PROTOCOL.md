# Agent Completion Update Protocol

Purpose
- Ensure every agent finishes with consistent, verifiable updates across coordination docs.

Who updates
- The agent who completed the work updates all docs below and cites artifacts/outputs.

Required updates (all three)
1) `coordination/SERVER_STATUS_TRACKER.md`
2) `coordination/LIVE_ACTIVITY_TRACKER.md`
3) `coordination/COMPOSITE_SANDBOX_TASKS.md`

Order of operations
1. Run your acceptance scripts (read-only unless instructed):
   - Viewer offline: `node scripts/test_offline_vendorization.cjs`
   - 404 audits: `node scripts/audit_404_composite.cjs`, `node scripts/audit_404_iframe.cjs`
   - Iframe autorigger: `node scripts/test_iframe_marker_skeleton.cjs`, `node scripts/test_iframe_marker_skeleton_full.cjs`
   - Save GLB roundtrip: `node scripts/test_save_glb_roundtrip.cjs`
   - Performance: `node scripts/agent5_simple_fps_test.cjs`, `node scripts/agent5_performance_test.cjs`, `node scripts/agent5_compare_composite_metrics.cjs --base http://localhost:3001/ --composite http://localhost:3001/legacy/legacy_composite_sandbox.html`
2. Update the docs using the templates below.
3. If you accessed the server in any way, record it in the Server Status Tracker.

Templates

1) Server Status Tracker entry
- Append under “SERVER ACCESS LOG”:

```
### **🕐 YYYY-MM-DDTHH:MM:SSZ - Agent X <Task Name> (Read-Only)**
- **Agent**: Agent X (Team)
- **Action**: <one-line summary>
- **Method**: <commands/scripts used>
- **Result**: <PASS/FAIL/PARTIAL + short numbers>
- **Artifacts**: <paths if any>
- **Notes**: <1–2 lines context>
- **Server Interaction**: Read-only to `http://localhost:3001`; no start/stop
```

2) Live Activity Tracker completion
- Add a time-stamped completion block and flip your status to DONE if you were the current active agent:

```
### 🕐 YYYY-MM-DDTHH:MMZ – Agent X Completion
- Status: DONE
- Acceptance:
  - <criteria 1>: PASS (<evidence>)
  - <criteria 2>: PASS (<evidence>)
- Artifacts: <paths>
- Follow-up (if any): <next agent + file link>
```

3) Tasks list update (`coordination/COMPOSITE_SANDBOX_TASKS.md`)
- Find your section and append a “Completion” sub-block:

```
### Completion – Agent X (YYYY-MM-DDTHH:MMZ)
- Status: COMPLETE
- Evidence:
  - <script> → <key result>
  - <script> → <key result>
- Artifacts: <paths>
- Notes: <brief>
```

Evidence requirements (examples)
- Offline vendorization: show `RESULT OK_NO_THIRD_PARTY` and FAIL_COUNT 0 for audits
- Autorigger: acceptance booleans (placed/skeleton/weights/idle/cleared)
- Save GLB: exported file path + successful reload of exported blob
- Performance: FPS average, frame time, triangles, quality level; comparator summary

Coordinator acceptance
- The Coordinator will append a verification entry in `SERVER_STATUS_TRACKER.md` and update `LIVE_ACTIVITY_TRACKER.md`.


