# Project instructions

- This repository is the GitHub + Vercel source of truth for the AND2BLE operations hub.
- Vercel serves `dist/`; there is no framework build or dependency installation.
- Preserve existing campaign copy and functionality unless the user requests changes.
- Keep Japanese sending templates and Korean review templates consistent.
- Never commit participant contact lists, gift-card codes, credentials, or private source attachments.
- Check relevant JavaScript with `node --check` and run `npm test` before pushing changes.
- `main` is connected to production on Vercel; commits there deploy automatically.
- Browser checkmarks and notes are local to the website origin, not shared operational data.
