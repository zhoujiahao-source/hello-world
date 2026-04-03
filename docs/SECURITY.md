# Security

## Threat Model

USB AI Workbench is designed for local use only. The server binds to `127.0.0.1` by default. It should NOT be exposed to the public internet.

## API Keys

- Never hardcode API keys in source code
- Keys are passed via environment variables (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`)
- Keys can be stored in `.env` file (not committed to git)
- `.env` is listed in `.gitignore`

## Process Spawning

- All engine CLIs are spawned using `spawn()` with argument arrays (never string concatenation)
- No `shell: true` is used
- Environment variables are passed explicitly

## Path Traversal Prevention

- Log file access validates filenames using `path.basename()`
- File operations validate paths are within expected root directories

## CORS

- Server allows only configured origins (default: localhost)
- Change `security.allowedOrigins` in `config/default.yaml` if needed

## Local Binding

The server binds to `127.0.0.1` by default. Change `server.host` in `config/default.yaml` to `0.0.0.0` only if you need network access (not recommended).

## Data at Rest

- SQLite database is stored in `portable-data/db/`
- Logs contain run output — be aware of sensitive data in prompts
- No encryption at rest is provided (MVP scope)

## Recommendations

- Keep `APP_ROOT` on encrypted storage if using a real USB drive
- Set API keys in `.env` or export them in your shell profile
- Don't run the server on a shared or untrusted machine
