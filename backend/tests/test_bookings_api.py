from datetime import date, timedelta

GUEST_A, GUEST_B = 5, 6


def _future(days: int) -> str:
    return (date.today() + timedelta(days=days)).isoformat()


def _book(client, user_id, listing_id, ci, co, guests=1):
    return client.post(
        "/api/bookings",
        json={"listing_id": listing_id, "check_in": ci, "check_out": co, "guests": guests},
        headers={"X-User-Id": str(user_id)},
    )


def _bookable_listing(client):
    """A listing not hosted by either test guest."""
    return client.get("/api/listings", params={"page_size": 1}).json()["items"][0]


def test_booking_snapshots_server_side_price(client):
    listing = client.get(f"/api/listings/{_bookable_listing(client)['id']}").json()
    r = _book(client, GUEST_A, listing["id"], _future(300), _future(303))
    assert r.status_code == 201, r.text
    b = r.json()
    assert b["nights"] == 3
    assert b["nightly_price"] == listing["price_per_night"]
    expected_fee = ((listing["price_per_night"] * 3 + listing["cleaning_fee"]) * listing["service_fee_pct"] + 50) // 100
    assert b["service_fee"] == expected_fee
    assert b["total_price"] == listing["price_per_night"] * 3 + listing["cleaning_fee"] + expected_fee


def test_overlap_rejected_with_409_and_back_to_back_allowed(client):
    lid = _bookable_listing(client)["id"]
    assert _book(client, GUEST_A, lid, _future(320), _future(325)).status_code == 201
    # Overlapping stay by someone else -> conflict
    r = _book(client, GUEST_B, lid, _future(323), _future(327))
    assert r.status_code == 409
    # Starts the day the other one checks out -> fine (half-open interval)
    assert _book(client, GUEST_B, lid, _future(325), _future(327)).status_code == 201
    # Ends the day the first one checks in -> fine
    assert _book(client, GUEST_B, lid, _future(318), _future(320)).status_code == 201


def test_cancelled_booking_frees_dates(client):
    lid = _bookable_listing(client)["id"]
    r = _book(client, GUEST_A, lid, _future(340), _future(342))
    assert r.status_code == 201
    bid = r.json()["id"]
    assert client.patch(f"/api/bookings/{bid}/cancel", headers={"X-User-Id": str(GUEST_A)}).status_code == 200
    assert _book(client, GUEST_B, lid, _future(340), _future(342)).status_code == 201


def test_date_search_excludes_booked_listing(client):
    lid = _bookable_listing(client)["id"]
    assert _book(client, GUEST_A, lid, _future(360), _future(362)).status_code == 201
    ids = [i["id"] for i in client.get("/api/listings", params={"check_in": _future(361), "check_out": _future(365), "page_size": 48}).json()["items"]]
    assert lid not in ids
    ids = [i["id"] for i in client.get("/api/listings", params={"check_in": _future(362), "check_out": _future(365), "page_size": 48}).json()["items"]]
    assert lid in ids


def test_validation_errors(client):
    listing = client.get(f"/api/listings/{_bookable_listing(client)['id']}").json()
    lid = listing["id"]
    assert _book(client, GUEST_A, lid, _future(5), _future(5)).status_code == 422
    assert _book(client, GUEST_A, lid, "2001-01-01", "2001-01-03").status_code == 400
    assert _book(client, GUEST_A, lid, _future(400), _future(402), guests=listing["max_guests"] + 1).status_code == 400
    assert _book(client, listing["host_id"], lid, _future(400), _future(402)).status_code == 403
    assert client.post("/api/bookings", json={}).status_code == 401
