import { NextResponse } from "next/server";
import Ride from "@/models/Ride";
import Driver from "@/models/Driver";
import { connectDB } from "@/lib/db";

export async function POST(req) {

  try {

    await connectDB();

    const {
      rideId,
      driverId,
    } = await req.json();

    // 🚕 FIND RIDE
    const ride =
      await Ride.findById(rideId);

    if (!ride) {

      return NextResponse.json(
        {
          message:
            "Ride not found",
        },
        {
          status: 404,
        }
      );
    }

    // 🚫 PREVENT DOUBLE ACCEPT
    if (
      ride.status !== "searching"
    ) {

      return NextResponse.json(
        {
          message:
            "Ride already accepted",
        },
        {
          status: 400,
        }
      );
    }

    // 👨‍✈️ FIND DRIVER
    const driver =
      await Driver.findById(
        driverId
      );

    if (!driver) {

      return NextResponse.json(
        {
          message:
            "Driver not found",
        },
        {
          status: 404,
        }
      );
    }

    const driverActiveRide =
  await Ride.findOne({
    driverId,
    status: {
      $in: [
        "accepted",
        "arriving",
        "pickedup",
        "reached_drop",
      ],
    },
  });

if (driverActiveRide) {

  return NextResponse.json(
    {
      message:
        "Complete current ride first",
    },
    {
      status: 400,
    }
  );

}

    // ✅ UPDATE RIDE
    ride.status = "accepted";
    ride.preferredDriverExpiresAt =
  null;

    ride.driverId =
      driver._id;

    ride.driverName =
      driver.name;

    ride.driverPhone =
      driver.phone;

    ride.vehicleNumber =
      driver.vehicleNumber;

    ride.acceptedAt =
      new Date();

    await ride.save();

    return NextResponse.json({
      success: true,
      message:
        "Ride accepted successfully",
      ride,
    });

  } catch (error) {

    console.log(
      "ACCEPT RIDE ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Server error",
      },
      {
        status: 500,
      }
    );
  }
}