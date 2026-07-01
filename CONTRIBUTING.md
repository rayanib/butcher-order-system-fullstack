# Contributing

## Development workflow

1. Create a focused branch from `main`.
2. Install dependencies in `client` and, when needed, `server`.
3. Keep domain logic in `client/src/features` and route-level UI in
   `client/src/pages`.
4. Add or update tests when changing business rules.
5. Run all frontend quality checks before opening a pull request:

```bash
cd client
npm run lint
npm test
npm run build
```

## Pull requests

- Explain the user problem and the chosen solution.
- Keep unrelated formatting or cleanup out of feature changes.
- Include screenshots for visible interface changes.
- Document new environment variables.
- Never commit credentials, customer data, build output, or dependencies.

## Commit messages

Use short, imperative messages that describe one logical change:

```text
refactor: extract voice order parser
test: cover Arabic voice draft parsing
docs: document Supabase data flow
chore: remove tracked dependencies
```
