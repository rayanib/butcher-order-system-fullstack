# Security Policy

## Reporting a vulnerability

Please do not open a public issue containing credentials, customer information,
or exploit details. Contact the maintainer privately through the email listed on
the GitHub profile and include:

- The affected feature
- Steps to reproduce the problem
- The potential impact
- Any suggested mitigation

## Supported version

Security fixes are applied to the latest version on the `main` branch.

## Sensitive data

- Never commit `.env` files, passwords, Supabase service-role keys, or customer
  exports.
- The Supabase anonymous key is intended for browser use, but Row Level Security
  must remain enabled.
- Local browser storage may contain customer and order information. Use the
  application only on trusted devices.
