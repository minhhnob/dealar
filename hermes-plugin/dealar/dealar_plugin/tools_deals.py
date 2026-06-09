"""Deal intelligence tools for Hermes Dealar plugin."""

from __future__ import annotations

from typing import Any

from dealar_plugin.bridge_client import run_dealar_action


def register_deal_tools(ctx: Any) -> None:
    @ctx.tool(
        name="dealar_search_deals",
        description="Search Dealar's USDC-paywalled deal intelligence dataset for merchant/product deals.",
    )
    def dealar_search_deals(query: str = "whoop", regions: str = "us,eu") -> str:
        region_list = [item.strip() for item in regions.split(",") if item.strip()]
        return run_dealar_action("deal.search", {"query": query, "regions": region_list})

    @ctx.tool(
        name="dealar_list_retailers",
        description="List Dealar retail intelligence sources by category and market.",
    )
    def dealar_list_retailers(category: str = "beauty", markets: str = "us,eu") -> str:
        market_list = [item.strip() for item in markets.split(",") if item.strip()]
        return run_dealar_action("retailers.list", {"category": category, "markets": market_list})
