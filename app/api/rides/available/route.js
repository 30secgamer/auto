import { NextResponse } from "next/server";
import Ride from "@/models/Ride";
import { connectDB } from "@/lib/db";
import Driver from "@/models/Driver";

export async function GET(req) {

  try {

    await connectDB();
    await Ride.updateMany(
  {
    status: "searching",
    requestExpiresAt: {
      $lt: new Date(),
    },
  },
  {
    $set: {
      status: "cancelled",
    },
  }
);

    // ✅ GET DRIVER ID FROM URL
    const { searchParams } =
      new URL(req.url);

    const driverId =
      searchParams.get("driverId");

const activeRide = await Ride.findOne({
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

if (activeRide) {
  return NextResponse.json([]);
}

    // ⏱️ 15 SECONDS PRIORITY
    const priorityTime =
      new Date(
        Date.now() - 15000
      );

    /*
      LOGIC:

      1. Normal rides
         → show to everyone

      2. Favourite driver rides
         → show ONLY to favourite driver
           for first 15 seconds

      3. After 15 sec
         → show to all drivers
    */

    const rides = await Ride.find({

      status: "searching",

requestExpiresAt: {
  $gt: new Date(),
},

      $or: [

        // ✅ NORMAL RIDE
        {
          preferredDriverId: null,
        },

        // ✅ FAV DRIVER ONLY
        {
          preferredDriverId:
            driverId,

          createdAt: {
            $gte: priorityTime,
          },
        },

        // ✅ AFTER 15 SEC
        {
          preferredDriverId: {
            $ne: null,
          },

          createdAt: {
            $lt: priorityTime,
          },
        },
      ],
    })
      .sort({
        createdAt: -1,
      })
      .limit(5);

    return NextResponse.json(
      rides
    );

  } catch (error) {

    console.log(error);

    return NextResponse.json(
      {
        message: "Server error",
      },
      {
        status: 500,
      }
    );
  }
}