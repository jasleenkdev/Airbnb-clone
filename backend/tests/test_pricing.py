import pytest

from app.services.pricing import calculate_price


def test_basic_breakdown():
    p = calculate_price(nightly_price=100, cleaning_fee=40, service_fee_pct=14, nights=3)
    assert p.subtotal == 300
    assert p.service_fee == 48  # 14% of (300 + 40) = 47.6 -> 48
    assert p.total_price == 300 + 40 + 48


def test_rounds_half_up_with_integer_math():
    # 10% of 105 = 10.5 -> 11 (banker's rounding would give 10)
    assert calculate_price(100, 5, 10, 1).service_fee == 11
    assert calculate_price(100, 4, 10, 1).service_fee == 10


def test_zero_fees():
    p = calculate_price(250, 0, 0, 2)
    assert (p.subtotal, p.cleaning_fee, p.service_fee, p.total_price) == (500, 0, 0, 500)


def test_cleaning_fee_is_charged_once_per_stay():
    one = calculate_price(100, 50, 0, 1)
    seven = calculate_price(100, 50, 0, 7)
    assert seven.total_price - one.total_price == 600


@pytest.mark.parametrize("nights", [0, -1])
def test_rejects_non_positive_nights(nights):
    with pytest.raises(ValueError):
        calculate_price(100, 10, 14, nights)


def test_rejects_negative_prices():
    with pytest.raises(ValueError):
        calculate_price(-1, 0, 14, 1)
