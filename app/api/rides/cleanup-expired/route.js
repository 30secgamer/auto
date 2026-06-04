import { NextResponse } from "next/server";
import Ride from "@/models/Ride";
import { connectDB } from "@/lib/db";

export async function GET() {
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

    return NextResponse.json({
      success: true,
    });

  } catch (err) {

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );

  }
}