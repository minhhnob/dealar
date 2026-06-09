"""Hermes plugin entrypoint for Dealar."""

from __future__ import annotations

from typing import Any

from dealar_plugin.tools_coupons import register_coupon_tools
from dealar_plugin.tools_deals import register_deal_tools
from dealar_plugin.tools_wallet import register_wallet_tools


def register(ctx: Any) -> None:
    register_deal_tools(ctx)
    register_coupon_tools(ctx)
    register_wallet_tools(ctx)
