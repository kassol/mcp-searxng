# Release Guide

This fork is published as `@kassol/mcp-searxng`.

## Version Policy

Use normal semantic versioning for this scoped package:

- `patch` for bug fixes and documentation-only npm refreshes, for example `1.1.1`
- `minor` for backward-compatible features, for example `1.1.0`
- `major` for breaking config or behavior changes, for example `2.0.0`

The first stable fork release should use `1.1.0`. The existing `1.0.3-custom.x` versions are valid npm versions, but future releases should avoid the `custom` prerelease suffix.

## Privacy Check

Before publishing, scan for real credentials, personal domains, and copied secrets:

```bash
rg -n "CF-Access|Client-Secret|access|secret|token|password|PRIVATE|BEGIN " \
  README.md CONFIGURATION.md RELEASE.md package.json .mcp src __tests__
```

Expected matches should be placeholders or test fixtures only, such as:

- `your-client-id.access`
- `your-client-secret`
- `reader-token`
- `secret-token`

Do not commit real Cloudflare Access values, generated `SEARXNG_HEADERS_BASE64` values, npm tokens, or personal service URLs.
If you have used a private domain while testing, add that domain to the scan pattern locally before publishing.

## Prepare a Release

Set the next version:

```bash
npm pkg set version=1.1.0
npm install --package-lock-only
npm run sync-version
```

Review the changed files:

```bash
git diff -- package.json package-lock.json src/index.ts .mcp/server.json
```

## Validate

Run the full local checks:

```bash
npm run release:check
```

If npm cache permissions fail locally, use an explicit cache directory:

```bash
npm --cache /private/tmp/npm-cache pack --dry-run
```

## Publish

Publish as a public scoped package:

```bash
npm --cache /private/tmp/npm-cache publish --access public --tag latest
```

If npm asks for browser authentication, open the CLI URL, complete WebAuthn/passkey verification, then rerun the publish command.

## Verify

Confirm the registry version and dist-tag:

```bash
npm --cache /private/tmp/npm-cache --prefer-online view @kassol/mcp-searxng version dist-tags
```

Confirm install resolution:

```bash
npm --cache /private/tmp/npm-cache --prefer-online exec --yes --package @kassol/mcp-searxng -- mcp-searxng --help
```

## Commit and Tag

Commit release metadata and tag the release:

```bash
git add package.json package-lock.json src/index.ts .mcp/server.json README.md CONFIGURATION.md RELEASE.md
git commit -m "chore: release v1.1.0"
git tag v1.1.0
git push origin main --tags
```
