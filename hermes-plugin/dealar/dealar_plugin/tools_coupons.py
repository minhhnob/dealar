"""Coupon verification tools for Hermes Dealar plugin."""

from __future__ import annotations

from typing import Any

from dealar_plugin.bridge_client import run_dealar_action


def register_coupon_tools(ctx: Any) -> None:
    @ctx.tool(
        name="dealar_verify_coupon",
        description="Verify coupon metadata through Dealar's coupon intelligence dataset.",
    )
    def dealar_verify_coupon(merchant: str, code: str, region: str = "us") -> str:
        return run_dealar_action("coupon.verify", {"merchant": merchant, "code": code, "region": region})
