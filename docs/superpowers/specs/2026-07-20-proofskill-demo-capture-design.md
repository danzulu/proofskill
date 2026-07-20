# ProofSkill demo capture design

Date: July 20, 2026  
Status: approved approach; awaiting written-spec review

## Goal

Produce clean, real-product video clips for the OpenAI Build Week submission. The clips will show the deployed ProofSkill experience working in Production and will be ready for a separate editing and AI-voiceover pass.

## Selected approach

Use a hybrid capture workflow:

1. Use the Codex in-app browser to stage and visually verify every scene against the real Production application.
2. Use a dedicated Playwright recording context to export clean 1920x1080 WebM clips without the Codex interface, desktop notifications, bookmarks, or unrelated windows.
3. Use the same Production URL and the existing judge account. Credentials must be loaded from local environment variables, never printed, committed, displayed in a final clip, or stored in browser-state files on disk.

This approach was selected over recording the full Codex window, which would expose editor chrome and could capture unrelated desktop content, and over a screenshot montage, which would provide weaker evidence that the product works.

## Capture sequence

The recording pass will produce these files under `submission-video/raw/`:

1. `01-dashboard.webm` — authenticated dashboard, private history, score/status summary, and New assessment entry point.
2. `02-guided-strategy.webm` — real Live AI assessment, scenario framing, guided decision cards, selected states, and strategy submission.
3. `03-adaptive-constraint.webm` — visible processing state followed by the GPT-5.6 adaptive constraint and affected fields.
4. `04-guided-revision.webm` — revision decision cards, keep/remove choices, success measurement, and Lock revision processing.
5. `05-critical-decision.webm` — the four guided critical-decision groups and Submit for evaluation processing.
6. `06-evidence-report.webm` — completed score, seven competencies, verified evidence, contradictions, gap, next challenge, and model/rubric metadata.
7. `07-persistence.webm` — return to the dashboard and reopen the saved report to prove persistence.

The clips may be recorded from one controlled end-to-end assessment and split afterward. Final usable clips must not contain login credential entry, long idle waits, error states, or personal browser data.

## Interaction and data handling

- Use `https://proofskill-blond.vercel.app` only.
- Authenticate before starting usable capture. Session state may be held in memory for the recording process but must not be written to a committed file.
- Create at most one new Live AI assessment for the capture.
- Choose coherent guided answers so the generated constraint and report are credible.
- Show processing indicators briefly, then trim long model latency while preserving honest before/after continuity.
- Do not expose passwords, API keys, Supabase secrets, cookies, access tokens, personal email inboxes, or Devpost private instructions.
- Stop if authentication, Production, OpenAI, or persistence behaves unexpectedly; retain previously completed clips and report the exact blocker.

## Visual standard

- Landscape 1920x1080, 16:9.
- Production UI at a readable browser zoom with no developer tools.
- Cursor movement should be deliberate; avoid rapid scrolling and accidental hover noise.
- Each clip should establish one clear focal action.
- Preserve one to two seconds around important selected states and processing indicators so the editor has clean handles.
- Record without narration; AI voiceover, captions, music, and branded transitions belong to the editing pass.

## Output and verification

- Save only final usable clips in `submission-video/raw/`.
- Keep temporary recordings outside the repository and remove them after verified clips are produced.
- Verify every output with FFprobe: codec, dimensions, frame rate, duration, and absence of embedded sensitive metadata.
- Render representative frames for visual inspection.
- Confirm the seven clips collectively show a working project and explicitly support the later narration about Codex and GPT-5.6.
- Do not upload to YouTube or update Devpost during this capture task; those are separate external actions requiring the finished edit.

## Completion criteria

The capture task is complete when all seven clips exist, open successfully, contain no credentials or unrelated desktop content, and cover the end-to-end ProofSkill story needed for a sub-three-minute demo.
