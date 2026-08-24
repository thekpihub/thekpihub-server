# Architecture

The assembled repository keeps the existing project boundaries instead of
inventing a monorepo framework.

```text
TheKPIHub.com
|
|-- apps/website                  live static/PHP marketing and tools site
|-- apps/platform                 canonical future Next.js + Supabase platform
|-- apps/legacy-app               archived app/backend/database reference
|-- apps/wingcommander-reference  related AI copilot reference app
|-- services/pipeline             KPI pipeline script
|-- tools/automated-website-builder
|-- database
|   |-- prisma
|   |-- migrations
|   `-- supabase
`-- docs
```

`apps/website` remains the live public website source. `apps/platform` is the
long-term product shell. `apps/legacy-app` preserves the prior backend,
database, and app implementation for migration reference. Supporting automation
and pipeline repositories are kept as separate tools/services.


Database files are not duplicated into a central folder. They remain at their source-owning paths: pps/legacy-app/prisma, pps/legacy-app/backend/migrations, pps/legacy-app/backend/supabase-schema.sql, pps/platform/supabase, and pps/website/docs/supabase-schema.sql.
