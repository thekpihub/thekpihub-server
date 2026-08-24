# Source Provenance

The source manifest in `docs/provenance/source-manifest.md` records source
repository, branch, commit, destination, inclusion reason, and assembly notes.

Excluded during assembly:

- `.git` directories
- `node_modules`, `.next`, `dist`, `build`, caches
- real `.env` files
- `config.js`
- `credentials.md`
- private key/certificate patterns

Known secret-risk evidence:

- `hsharmagxi-debug/thekpihub_1554` contains a real `.env` with API and payment
  variable names. Values were not printed and the file was not copied.
- `thekpihub/thekpihub-app` contains `credentials.md`; it was not copied.
- `hsharmagxi-debug/kpihub-vault` contains credential-rotation documentation and
  Windows-invalid legacy paths; it was not checked out into assembly.

