## v1.0.2 - Dependable Google Tasks helper

Reworded the docs to highlight the compact helper and documented the resilient `{ ok, data, error }` response shape while aligning the published references with latest dependency tags. Keywords: Google Tasks, documentation, response handling.

### Added
- Noted that every API call now returns `{ ok, data, error }` with optional `status`/`body` fields so failures stay predictable.

### Changed
- Updated the README and docs copy to emphasize the compact helper experience.
- Published examples now reference `@latest` for `httpx`, `gauth`, `auth`, and `qs` so generated bundles match current dependencies.

## v1.0.1 - Google Tasks API Starter

Launched the npm module with OAuth-ready helpers for managing Google Tasks so workflows can access tasks securely. Keywords: Google Tasks, OAuth, workflow automation, API helper.

### Added
- initial CommonJS entry point, README, and self-test scaffolding for the Google Tasks API wrapper.
