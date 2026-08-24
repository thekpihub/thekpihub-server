# Recovery

Recovery decisions were based on repository metadata, documentation, branches,
package files, deployment files, and source contents.

Important recovery findings:

- `thekpihub/thekpihub` is archived and explicitly says its parts were split
  into `thekpihub-app` and `thekpihub-website`.
- `thekpihub/thekpihub-platform` identifies itself as the migration-safe
  canonical app foundation.
- `thekpihub/thekpihub-website` is the live public site source for
  `thekpihub.com`.
- `hsharmagxi-debug/kpihub-vault` could not be checked out on Windows because
  of a legacy path named `Deploying...`; the Git object database was available
  for provenance.
- `hsharmagxi-debug/ditto-wingman` is empty.

