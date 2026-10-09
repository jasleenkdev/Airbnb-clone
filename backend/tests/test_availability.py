from datetime import date, timedelta

import pytest

from app.services.availability import ranges_overlap, validate_stay_dates
from app.services.errors import BadRequest

D = date(2030, 6, 1)


def d(n: int) -> date:
    return D + timedelta(days=n)


@pytest.mark.parametrize(
    "a,b,expected",
    [
        ((0, 3), (3, 5), False),  # back-to-back: checkout day == next check-in
        ((3, 5), (0, 3), False),  # back-to-back, reversed
        ((0, 3), (2, 5), True),  # partial overlap at the end
        ((2, 5), (0, 3), True),  # partial overlap at the start
        ((0, 10), (2, 4), True),  # b inside a
        ((2, 4), (0, 10), True),  # a inside b
        ((0, 3), (0, 3), True),  # identical
        ((0, 1), (5, 6), False),  # far apart
        ((0, 1), (0, 1), True),  # single identical night
    ],
)
def test_ranges_overlap_half_open(a, b, expected):
    assert ranges_overlap(d(a[0]), d(a[1]), d(b[0]), d(b[1])) is expected


def test_validate_stay_dates():
    today = date(2030, 1, 1)
    assert validate_stay_dates(date(2030, 1, 1), date(2030, 1, 4), today) == 3
    with pytest.raises(BadRequest):
        validate_stay_dates(date(2029, 12, 31), date(2030, 1, 2), today)  # in the past
    with pytest.raises(BadRequest):
        validate_stay_dates(date(2030, 1, 5), date(2030, 1, 5), today)  # zero nights
    with pytest.raises(BadRequest):
        validate_stay_dates(date(2030, 1, 1), date(2030, 6, 1), today)  # too long
