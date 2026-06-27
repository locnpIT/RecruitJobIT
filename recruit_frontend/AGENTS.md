<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Documentation Rule

- After implementing or changing any feature, update the related project docs.
- Frontend routes/components/services must be reflected in `recruit/docs/SOURCE_CODE_FEATURE_GUIDE.md` when they affect a feature flow.
- API contract changes must be reflected in `recruit/docs/api.md`.
- Completion status or known gaps must be reflected in `recruit/docs/PROJECT_COMPLETION_CHECKLIST.md`.
- If a UI feature cannot be fully implemented because current backend schema has no storage for it, document that limitation explicitly.
- Backend/database schema changes are allowed only after explicit confirmation from the project owner.
