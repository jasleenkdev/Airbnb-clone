"""Idempotent demo-data seeder.

Run manually with `python -m app.seed` (add `--reset` to drop and recreate everything).
The API also calls `seed_if_empty` on startup, so a fresh/ephemeral database is always populated.
"""

import random
import sys
from datetime import date, datetime, time, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import models  # noqa: F401
from app.database import Base, SessionLocal, engine
from app.models import Amenity, Booking, BookingStatus, Listing, ListingImage, PropertyType, Review, User, Wishlist
from app.seed_data import (
    BATHS,
    BEDROOMS,
    CLOSING,
    COVER_POOLS,
    KITCHENS,
    LISTINGS,
    LIVING,
    REVIEW_COMMENTS,
    TYPE_COPY,
    USERS,
    VIEWS,
    unsplash,
)
from app.services.catalog import AMENITIES
from app.services.pricing import calculate_price

BASE_AMENITIES = ["Wifi", "Kitchen", "Smoke alarm", "Hair dryer", "Iron"]
TYPE_AMENITIES = {
    "villa": ["Pool", "Air conditioning", "Free parking", "BBQ grill", "Patio or balcony", "Breakfast"],
    "house": ["Washer", "Dryer", "Free parking", "TV", "Heating", "Crib"],
    "cabin": ["Indoor fireplace", "Hot tub", "Heating", "Free parking", "Pets allowed"],
    "cottage": ["Indoor fireplace", "Heating", "Washer", "Patio or balcony"],
    "tiny_home": ["Heating", "Patio or balcony", "Free parking"],
    "treehouse": ["Patio or balcony", "Breakfast"],
    "beachfront": ["Beach access", "Air conditioning", "Patio or balcony", "BBQ grill"],
    "apartment": ["Air conditioning", "Dedicated workspace", "TV", "Washer", "Gym"],
}
CATEGORY_AMENITIES = {
    "amazing_pools": ["Pool"],
    "lakefront": ["Lake access"],
    "skiing": ["Ski-in/ski-out", "Hot tub"],
    "beachfront": ["Beach access"],
    "tropical": ["Pool", "Air conditioning"],
}


def _build_images(rng: random.Random, ptype: str, counters: dict[str, int], index: int) -> list[str]:
    pool = COVER_POOLS[ptype]
    cover = pool[counters[ptype] % len(pool)]
    counters[ptype] += 1
    extras = [
        LIVING[(index * 3 + 1) % len(LIVING)],
        BEDROOMS[index % len(BEDROOMS)],
        KITCHENS[index % len(KITCHENS)] if index % 2 else BATHS[index % len(BATHS)],
        BEDROOMS[(index * 7 + 3) % len(BEDROOMS)],
        VIEWS[index % len(VIEWS)] if ptype in ("cabin", "tiny_home", "treehouse") else LIVING[(index * 5 + 2) % len(LIVING)],
    ]
    photos = [cover] + [p for p in dict.fromkeys(extras) if p != cover]
    count = 4 + (index % 3)  # 4-6 images per listing
    return [unsplash(p) for p in photos[:count]]


def seed(db: Session) -> None:
    rng = random.Random(42)
    today = date.today()

    users = [
        User(name=n, email=e, avatar_url=a, is_host=h, is_superhost=s, bio=b,
             created_at=datetime(2019 + i % 5, 1 + (i * 3) % 12, 1 + i))
        for i, (n, e, a, h, s, b) in enumerate(USERS)
    ]
    db.add_all(users)

    amenities = {name: Amenity(name=name, icon=icon) for name, icon in AMENITIES}
    db.add_all(amenities.values())
    db.flush()

    # Shuffle insertion order so the default explore page mixes countries.
    order = list(range(len(LISTINGS)))
    rng.shuffle(order)
    counters = {k: 0 for k in COVER_POOLS}
    listings: list[Listing] = []
    for idx in order:
        (title, ptype, category, city, state, country, lat, lng, price, guests, bedrooms, beds, baths,
         host_idx, blurb) = LISTINGS[idx]
        host = users[host_idx]
        names = BASE_AMENITIES + TYPE_AMENITIES[ptype] + CATEGORY_AMENITIES.get(category, [])
        names += rng.sample([a for a, _ in AMENITIES if a not in names], k=rng.randint(1, 4))
        listing = Listing(
            host=host,
            title=title,
            description=f"{blurb}\n\nThe space\n{TYPE_COPY[ptype]}{CLOSING}",
            property_type=PropertyType(ptype),
            category=category,
            city=city,
            state=state,
            country=country,
            address=f"{rng.randint(2, 220)} {rng.choice(['Main', 'Hill', 'Lake', 'Garden', 'Ocean', 'Market', 'Old Mill'])} Road, {city}",
            latitude=lat,
            longitude=lng,
            price_per_night=price,
            cleaning_fee=max(15, round(price * rng.uniform(0.15, 0.3) / 5) * 5),
            service_fee_pct=14,
            max_guests=guests,
            bedrooms=bedrooms,
            beds=beds,
            bathrooms=baths,
            amenities=sorted({amenities[n] for n in names}, key=lambda a: a.id),
            images=[ListingImage(url=u, position=i) for i, u in enumerate(_build_images(rng, ptype, counters, idx))],
            created_at=datetime.combine(today - timedelta(days=rng.randint(200, 900)), time(12)),
        )
        listings.append(listing)
    db.add_all(listings)
    db.flush()

    guests = [u for u in users if not u.is_host]

    def make_booking(listing: Listing, guest: User, check_in: date, nights: int, status: BookingStatus) -> Booking:
        p = calculate_price(listing.price_per_night, listing.cleaning_fee, listing.service_fee_pct, nights)
        b = Booking(
            listing=listing, guest=guest, check_in=check_in, check_out=check_in + timedelta(days=nights),
            guests=rng.randint(1, min(listing.max_guests, 4)), nightly_price=p.nightly_price,
            cleaning_fee=p.cleaning_fee, service_fee=p.service_fee, total_price=p.total_price, status=status,
            created_at=datetime.combine(check_in - timedelta(days=rng.randint(10, 60)), time(9)),
        )
        db.add(b)
        return b

    # Past stays + reviews. Hosts also travel, so they can review other hosts' places.
    review_count = 0
    for listing in listings:
        cursor = today - timedelta(days=rng.randint(5, 20))
        for _ in range(rng.randint(1, 4)):
            nights = rng.randint(2, 6)
            cursor -= timedelta(days=nights + rng.randint(3, 25))
            author = rng.choice([u for u in users if u.id != listing.host_id])
            booking = make_booking(listing, author, cursor, nights, BookingStatus.completed)
            score = rng.choices([5, 4, 3], weights=[70, 25, 5])[0]

            def sub(base: int = score) -> int:
                return max(1, min(5, base + rng.choice([0, 0, 0, 1, -1])))

            db.add(Review(
                listing=listing, booking=booking, author=author, rating=score,
                cleanliness=sub(), accuracy=sub(), communication=sub(), location=sub(),
                check_in_rating=sub(), value=sub(),
                comment=rng.choice(REVIEW_COMMENTS).format(host=listing.host.name.split()[0], city=listing.city),
                created_at=datetime.combine(booking.check_out + timedelta(days=rng.randint(1, 5)), time(18)),
            ))
            review_count += 1

    # Each guest gets: one completed stay without a review (to demo "Leave a review"),
    # one cancelled trip and two upcoming trips.
    for gi, guest in enumerate(guests):
        pool = listings[gi * 5:(gi * 5) + 5]
        make_booking(pool[0], guest, today - timedelta(days=4 + gi), 3, BookingStatus.completed)
        make_booking(pool[1], guest, today + timedelta(days=20 + gi), 3, BookingStatus.cancelled)
        make_booking(pool[2], guest, today + timedelta(days=14 + gi * 4), 4, BookingStatus.confirmed)
        make_booking(pool[3], guest, today + timedelta(days=45 + gi * 3), 5, BookingStatus.confirmed)
        for listing in rng.sample(listings, 4):
            db.add(Wishlist(user_id=guest.id, listing_id=listing.id))

    # Additional future bookings by hosts on other hosts' places, so calendars have blocked dates.
    for listing in listings[15:35]:
        traveller = rng.choice([u for u in users if u.id != listing.host_id])
        make_booking(listing, traveller, today + timedelta(days=rng.randint(7, 70)), rng.randint(2, 6), BookingStatus.confirmed)

    db.commit()
    print(f"Seeded {len(users)} users, {len(listings)} listings, {review_count} reviews, "
          f"{db.scalar(select(func.count(Booking.id)))} bookings.")


def seed_if_empty(db: Session) -> bool:
    if db.scalar(select(func.count(User.id))):
        return False
    seed(db)
    return True


def main() -> None:
    if "--reset" in sys.argv:
        Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if not seed_if_empty(db):
            print("Database already has data; nothing to do. Use --reset to reseed.")


if __name__ == "__main__":
    main()
