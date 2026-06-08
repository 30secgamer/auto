import { NextResponse } from "next/server";
import Ride from "@/models/Ride";
import Driver from "@/models/Driver";
import User from "@/models/User";
import { connectDB } from "@/lib/db";

export async function POST(req) {
  try {
    await connectDB();

    const { rideId } = await req.json();

    // ✅ Atomic completion
    const ride = await Ride.findOneAndUpdate(
      {
        _id: rideId,
        status: { $ne: "completed" },
      },
      {
        $set: {
          status: "completed",
          completedAt: new Date(),
        },
      },
      {
        new: true,
      }
    );

    // Already completed
    if (!ride) {
      return NextResponse.json({
        success: true,
        message: "Ride already completed",
      });
    }

    const rewardAmount =
      Number(ride.distance) >= 10
        ? 2
        : 1;

    // ✅ Update Driver
    await Driver.findByIdAndUpdate(
      ride.driverId,
      {
        $inc: {
          totalRides: 1,
          totalEarnings: Number(
            ride.fare || 0
          ),
          rewardBalance: rewardAmount,
          rewardRides: 1,
        },
      }
    );

    // ✅ Update User
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