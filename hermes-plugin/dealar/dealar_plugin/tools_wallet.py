"""Wallet and dashboard tools for Hermes Dealar plugin."""

from __future__ import annotations

from typing import Any

from dealar_plugin.bridge_client import run_dealar_action


def register_wallet_tools(ctx: Any) -> None:
    @ctx.tool(
        name="dealar_wallet_policy",
        description="Return Dealar's Circle-style agent wallet policy controls and spend limits.",
    )
    def dealar_wallet_policy(api_base_url: str = "http://127.0.0.1:8787", daily_limit_usdc: str = "1.00", per_request_limit_usdc: str = "0.25") -> str:
        return run_dealar_action("wallet.policy", {
            "apiBaseUrl": api_base_url,
            "dailyLimitUsdc": daily_limit_usdc,
            "perRequestLimitUsdc": per_request_limit_usdc,
        })

    @ctx.tool(
        name="dealar_dashboard_summary",
        description="Return Dealar dashboard summary data for agents and demos.",
    )
    def dealar_dashboard_summary(api_base_url: str = "http://127.0.0.1:8787") -> str:
        return run_dealar_action("dashboard.summary", {"apiBaseUrl": api_base_url})
