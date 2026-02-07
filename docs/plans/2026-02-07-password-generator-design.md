# Password Generator with bcrypt — Design Document

**Date:** 2026-02-07
**Stack:** Python, Streamlit, bcrypt
**Deployment:** Streamlit Community Cloud

## Overview

A web-based password generator that creates secure passwords and bcrypt hashes, deployed as a portfolio utility.

## Project Structure

```
PasswordGenerator/
├── app.py                 # Main Streamlit application
├── generator.py           # Password generation logic
├── hasher.py              # bcrypt hashing
├── strength.py            # Password strength evaluation
├── requirements.txt       # Dependencies
├── .streamlit/
│   └── config.toml        # Theme configuration
└── docs/plans/
    └── 2026-02-07-password-generator-design.md
```

## Features

### Tab 1: Generate Password
- Password length slider (8–128, default 16)
- Character type checkboxes (uppercase, lowercase, numbers, symbols)
- Generated password display with copy button
- Password strength meter (color-coded progress bar)
- bcrypt hash output with copy button
- "Generate New" button

### Tab 2: Hash Your Own Password
- Text input for user-provided password
- "Hash It" button
- bcrypt hash display with copy button
- Password strength meter

## Core Logic

- **generator.py:** Uses `secrets` module. Guarantees at least one character from each selected type. Shuffles output.
- **strength.py:** Scores on length, character diversity, and absence of common patterns. Returns label + score (0–100).
- **hasher.py:** Uses `bcrypt.gensalt()` with 12 rounds. Returns UTF-8 hash string.

## Design Decisions

- `secrets` over `random` for cryptographic security
- Stateless — no storage, no database, no accounts
- bcrypt 12 rounds (default) — not user-configurable
- Minimal UI — clean, professional, portfolio-ready

## Deployment

- GitHub repo connected to Streamlit Community Cloud
- Public URL linked from portfolio site
- Theme customizable via `.streamlit/config.toml`
