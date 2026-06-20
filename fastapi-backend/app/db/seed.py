"""
seed.py — populate Supabase with mock data matching the BundleLah schema.

Run with:
    python seed.py

Assumes tables already exist (i.e. you've run Base.metadata.create_all(engine)
or your reset_db.py script first).
"""

from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import get_settings  # <-- adjust import to your actual config module
from app.models import (  # <-- adjust import to your actual models module
    Company,
    Vehicle,
    TripListing,
    CargoRequest,
    CargoMatch,
    CostSplit,
    CarbonLog,
)

engine = create_engine(get_settings().database_uri)


def run():
    with Session(engine) as session:
        # ----- Companies -----
        company_a = Company(
            name="Borneo Freight Sdn Bhd",
            username="borneo_freight",
            password="placeholder_hash_1",
            ssm_number="SSM-100234",
            address="12 Jalan Pelabuhan, Port Klang, Selangor",
            wallet_balance=Decimal("500.00"),
        )
        company_b = Company(
            name="Kuala Lumpur Logistics Co",
            username="kl_logistics",
            password="placeholder_hash_2",
            ssm_number="SSM-100987",
            address="45 Jalan Sultan, Kuala Lumpur",
            wallet_balance=Decimal("1250.50"),
        )
        company_c = Company(
            name="Penang Express Cargo",
            username="penang_express",
            password="placeholder_hash_3",
            ssm_number="SSM-100555",
            address="8 Lebuh Pantai, George Town, Penang",
            wallet_balance=Decimal("0.00"),
        )

        session.add_all([company_a, company_b, company_c])
        session.flush()  # get IDs assigned before referencing them

        # ----- Vehicles -----
        vehicle_a1 = Vehicle(
            company=company_a,
            vehicle_type="10-tonne lorry",
            license_plate="WXY1234",
            max_payload_kg=Decimal("10000.00"),
        )
        vehicle_b1 = Vehicle(
            company=company_b,
            vehicle_type="Box van",
            license_plate="VBC5678",
            max_payload_kg=Decimal("3000.00"),
        )
        vehicle_c1 = Vehicle(
            company=company_c,
            vehicle_type="Container truck",
            license_plate="PNG9012",
            max_payload_kg=Decimal("15000.00"),
        )

        session.add_all([vehicle_a1, vehicle_b1, vehicle_c1])
        session.flush()

        # ----- Trip Listings (spare capacity offers) -----
        trip_1 = TripListing(
            company=company_a,
            vehicle=vehicle_a1,
            origin_region="Port Klang",
            destination_region="Kuala Lumpur",
            route_json={"waypoints": ["Port Klang", "Shah Alam", "KL"]},
            departure_window_start=datetime.utcnow() + timedelta(days=1),
            available_weight_kg=Decimal("4000.00"),
            available_volume_m3=Decimal("20.00"),
            status="open",
        )
        trip_2 = TripListing(
            company=company_c,
            vehicle=vehicle_c1,
            origin_region="George Town",
            destination_region="Kuala Lumpur",
            route_json={"waypoints": ["George Town", "Ipoh", "KL"]},
            departure_window_start=datetime.utcnow() + timedelta(days=2),
            available_weight_kg=Decimal("8000.00"),
            available_volume_m3=Decimal("40.00"),
            status="locked",
        )

        session.add_all([trip_1, trip_2])
        session.flush()

        # ----- Cargo Requests (demand for capacity) -----
        cargo_1 = CargoRequest(
            company=company_b,
            pickup_address="45 Jalan Sultan, Kuala Lumpur",
            pickup_lat=3.1478,
            pickup_lng=101.6953,
            dropoff_address="12 Jalan Pelabuhan, Port Klang, Selangor",
            dropoff_lat=3.0044,
            dropoff_lng=101.3925,
            weight_kg=Decimal("1500.00"),
            volume_m3=Decimal("8.00"),
            pickup_window_start=datetime.utcnow() + timedelta(days=1, hours=1),
            pickup_window_end=datetime.utcnow() + timedelta(days=1, hours=4),
            status="matched",
            priority_flag=False,
        )
        cargo_2 = CargoRequest(
            company=company_b,
            pickup_address="8 Lebuh Pantai, George Town, Penang",
            pickup_lat=5.4141,
            pickup_lng=100.3288,
            dropoff_address="45 Jalan Sultan, Kuala Lumpur",
            dropoff_lat=3.1478,
            dropoff_lng=101.6953,
            weight_kg=Decimal("3000.00"),
            volume_m3=Decimal("15.00"),
            pickup_window_start=datetime.utcnow() + timedelta(days=2, hours=1),
            pickup_window_end=datetime.utcnow() + timedelta(days=2, hours=5),
            status="open",
            priority_flag=True,
        )

        session.add_all([cargo_1, cargo_2])
        session.flush()

        # ----- Cargo Matches (handshake between trip and cargo request) -----
        match_1 = CargoMatch(
            trip_listing=trip_1,
            cargo_request=cargo_1,
            initiated_by="shipper",
            status="accepted",
            agreed_price_rm=Decimal("350.00"),
        )
        match_2 = CargoMatch(
            trip_listing=trip_2,
            cargo_request=cargo_2,
            initiated_by="carrier",
            status="pending",
            agreed_price_rm=Decimal("780.00"),
        )

        session.add_all([match_1, match_2])
        session.flush()

        # ----- Cost Splits (who owes whom for each match) -----
        cost_split_1 = CostSplit(
            match=match_1,
            payer=company_b,  # shipper pays
            payee=company_a,  # carrier gets paid
            amount_rm=Decimal("350.00"),
            platform_fee_rm=Decimal("17.50"),
            payment_status="paid",
            paid_at=datetime.utcnow() - timedelta(hours=2),
        )
        cost_split_2 = CostSplit(
            match=match_2,
            payer=company_b,
            payee=company_c,
            amount_rm=Decimal("780.00"),
            platform_fee_rm=Decimal("39.00"),
            payment_status="pending",
            paid_at=None,
        )

        session.add_all([cost_split_1, cost_split_2])

        # ----- Carbon Logs (emissions/credits tied to trips & cargo) -----
        carbon_1 = CarbonLog(
            trip_listing=trip_1,
            cargo_request=cargo_1,
            co2_emitted_kg=Decimal("45.20"),
            co2_avoided_kg=Decimal("60.00"),
            credits_awarded=Decimal("14.80"),
        )
        carbon_2 = CarbonLog(
            trip_listing=trip_2,
            cargo_request=cargo_2,
            co2_emitted_kg=Decimal("120.75"),
            co2_avoided_kg=Decimal("95.00"),
            credits_awarded=Decimal("0.00"),
        )

        session.add_all([carbon_1, carbon_2])

        session.commit()

    print("Mock data inserted successfully.")


if __name__ == "__main__":
    run()