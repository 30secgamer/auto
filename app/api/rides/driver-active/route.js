import { NextResponse } from "next/server";
import Ride from "@/models/Ride";
import { connectDB } from "@/lib/db";

export async function POST(req) {
  try {
    await connectDB();

    const { driverId } =
      await req.json();

    if (!driverId) {
      return NextResponse.json(
        null
      );
    }

    const ride =
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
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    return NextResponse.json(
      ride || null
    );

  } catch (err) {

    console.log(
      "DRIVER ACTIVE ERROR:",
      err
    );

    return NextResponse.json(
      null
    );
  }
}