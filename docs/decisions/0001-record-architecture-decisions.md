# 1. Record architecture decisions

**Status:** accepted

## Context

This build moves fast and is largely agent-driven. Decisions that were obvious the day they
were made become invisible three weeks later, and an agent reading the repo cannot infer
intent from code alone.

## Decision

Every non-obvious infrastructure, schema, or dependency decision gets a numbered file here.
Short — what was decided, why, and what breaks without it. Append-only: supersede rather than
edit.

## Consequences

A small tax per decision. In exchange, `docs/decisions/` becomes context Claude Code can read,
and the reasoning behind the invariants survives the person who wrote them.
