from dataclasses import dataclass


@dataclass(frozen=True)
class PriceBreakdown:
    nights: int
    nightly_price: int
    subtotal: int
    cleaning_fee: int
    service_fee: int
    total_price: int


def _round_half_up_pct(amount: int, pct: int) -> int:
    """Integer-only `amount * pct / 100`, rounded half up (no float drift)."""
    return (amount * pct + 50) // 100


def calculate_price(nightly_price: int, cleaning_fee: int, service_fee_pct: int, nights: int) -> PriceBreakdown:
    """Compute a stay's price. All values are whole currency units.

    The service fee is a percentage of (nightly subtotal + cleaning fee), like Airbnb's guest fee.
    """
    if nights < 1:
        raise ValueError("nights must be >= 1")
    if nightly_price < 0 or cleaning_fee < 0 or service_fee_pct < 0:
        raise ValueError("prices must be non-negative")
    subtotal = nightly_price * nights
    service_fee = _round_half_up_pct(subtotal + cleaning_fee, service_fee_pct)
    return PriceBreakdown(
        nights=nights,
        nightly_price=nightly_price,
        subtotal=subtotal,
        cleaning_fee=cleaning_fee,
        service_fee=service_fee,
        total_price=subtotal + cleaning_fee + service_fee,
    )
