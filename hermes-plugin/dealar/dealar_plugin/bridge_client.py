"""Python to Node CLI bridge for Dealar."""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from typing import Any

PLUGIN_DIR = Path(__file__).resolve().parents[1]
DEFAULT_REPO_ROOT = PLUGIN_DIR.parents[1]


def _repo_root() -> Path:
    return Path(os.environ.get("DEALAR_REPO_ROOT", DEFAULT_REPO_ROOT)).resolve()


def ok_json(result: Any) -> str:
    return json.dumps({"ok": True, "result": result})


def err_json(message: str) -> str:
    return json.dumps({"ok": False, "error": message})


def run_dealar_action(action: str, params: dict[str, Any] | None = None) -> str:
    """Execute Dealar's Node JSON bridge and return its JSON string output."""
    payload = {"action": action, "params": params or {}}
    root = _repo_root()
    cli_path = root / "bin" / "dealar-cli.js"

    if not cli_path.exists():
        return err_json(f"Dealar CLI not found at {cli_path}")

    try:
        result = subprocess.run(
            ["node", str(cli_path), json.dumps(payload)],
            cwd=str(root),
            capture_output=True,
            text=True,
            check=False,
        )
    except Exception as exc:  # pragma: no cover - defensive subprocess guard
        return err_json(f"Bridge execution error: {exc}")

    output = (result.stdout or result.stderr or "").strip()
    if not output:
        return err_json("Dealar CLI returned no output")

    try:
        parsed = json.loads(output)
    except json.JSONDecodeError:
        return err_json(f"Failed to parse Dealar CLI output: {output}")

    return json.dumps(parsed)
