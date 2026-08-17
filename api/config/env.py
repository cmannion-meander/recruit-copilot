"""Load KEY=VALUE pairs from the repo-root .env into os.environ.

Parsed, not sourced, for the same reason db/setup-local.sh parses it: a stray word in a
config file must not become code. Only KEY=VALUE lines are recognised; anything else is
skipped. Values already in the environment win, which is what you want when overriding one
setting for a single run.
"""

import os
import re
from pathlib import Path

_LINE = re.compile(r"^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$")


def load() -> None:
    path = Path(__file__).resolve().parents[2] / ".env"
    if not path.exists():
        return
    for raw in path.read_text().splitlines():
        match = _LINE.match(raw)
        if not match:
            continue
        key, value = match.group(1), match.group(2).strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        os.environ.setdefault(key, value)
