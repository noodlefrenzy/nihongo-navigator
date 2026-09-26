# Security

This project is a development prototype. Security fixes target `main`; there
are no supported release branches yet.

## Reporting a vulnerability

Use GitHub's **Security → Report a vulnerability** for
[noodlefrenzy/nihongo-navigator](https://github.com/noodlefrenzy/nihongo-navigator/security/advisories/new).
The maintainer must enable private vulnerability reporting before publication.
If the private form is unavailable, open an issue asking for a private contact
channel without including vulnerability details, credentials, or exploit code.

Include the affected revision, reproduction steps, expected impact, and a
minimal example. Share sensitive details only through the private channel.

## Local development and deployment

The map and reading practice run without a model connection. Settings and
practice progress are stored in the browser's IndexedDB.

The optional Node content service binds to `127.0.0.1` and has no user
authentication. Its endpoints can invoke the configured model. It is intended
for local development; an internet deployment needs authentication, usage
controls, and a review of storage and provider access. The Vite development
server listens on all interfaces by default; use `pnpm dev --host 127.0.0.1`
when you only need access from the same machine.

Store API keys in an ignored `.env` file or the server environment. Never use
`VITE_` variables for secrets, since those are exposed to browser code. Keep
Codex CLI credentials in its normal external credential store. Reader and judge
requests may send generated text and learner answers to the configured provider;
inspect that provider's terms before using it with sensitive information.

Dependency quarantine and verification are documented in
[CONTRIBUTING.md](CONTRIBUTING.md). CI requires no model credentials.
