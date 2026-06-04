import { NextResponse } from "next/server";
import Ride from "@/models/Ride";
import Driver from "@/models/Driver";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

export async function POST(req) {

  try {

    await connectDB();

    const { rideId } =
      await req.json();

    const ride =
      await Ride.findById(rideId);
      if (ride?.status === "completed") {
  return NextResponse.json({
    success: true,
    message: "Ride already completed",
  });
}

    if (!ride) {

      return NextResponse.json(
        {
          message: "Ride not found",
        },
        {
          status: 404,
        }
      );
    }

ride.status = "completed";
ride.completedAt = new Date();

await ride.save();

    // ✅ UPDATE DRIVER
   // ✅ REWARD CALCULATION

const rewardAmount =
  Number(ride.distance) >= 10
    ? 2
    : 1;

// ✅ UPDATE DRIVER

const updatedDriver =
  await Driver.findByIdAndUpdate(
    ride.driverId,
  ride.driverId,
  {
    $inc: {
      totalRides: 1,
      totalEarnings: ride.fare,

      rewardBalance: rewardAmount,
      rewardRides: 1,
    },
  }
);
console.log(
  "UPDATED DRIVER",
  updatedDriver
);
// ✅ UPDATE USER

await User.findOneAndUpdate(
  {
    phone: ride.passengerPhone,
  },
  {
    $inc: {
      rewardBalance: rewardAmount,
      rewardRides: 1,
    },
  }
);
    return NextResponse.json({
      success: true,
    });

  } catch (err) {

    console.log(err);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}