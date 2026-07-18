# Production and submission checklist

## Supabase

- [ ] Dedicated ProofSkill project.
- [ ] Migration applied and listed.
- [ ] Security and Performance Advisors clean or documented.
- [ ] Email confirmation enabled.
- [ ] PKCE confirmation template configured.
- [ ] Google OAuth configured and tested.
- [ ] Production SITE_URL, localhost redirect, and exact Preview wildcard configured.
- [ ] User A cannot read or mutate User B's data.
- [ ] Direct score and evidence writes as authenticated fail.
- [ ] Judge account created, email-confirmed, and credentials stored only in Devpost private instructions.

## OpenAI

- [ ] OPENAI_API_KEY present only in local and Vercel secrets.
- [ ] OPENAI_MODEL equals gpt-5.6-sol.
- [ ] Live constraint smoke test.
- [ ] Live evaluation smoke test.
- [ ] Invalid evidence retry observed in test or fixture.
- [ ] No chain of thought stored.

## Vercel

- [ ] Git integration points to public main.
- [ ] Preview and Production variables scoped separately.
- [ ] Preview build passes npm run check.
- [ ] Incognito smoke: email login, Google, dashboard, live flow, saved report, public demo.
- [ ] Promote the verified Preview artifact to Production.
- [ ] Check runtime errors and logs after promotion.

## Submission

- [ ] Feature freeze July 21 at 1:00 p.m. Bogota.
- [ ] Final video 2:45–2:55, public YouTube, narration, real Production.
- [ ] README final URLs and setup verified.
- [ ] /feedback run from the task containing most core work.
- [ ] Devpost fields complete; private credentials not public.
- [ ] Submit by 4:00 p.m. Bogota; official close 7:00 p.m.

