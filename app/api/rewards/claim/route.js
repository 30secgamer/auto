import { NextResponse } from "next/server";
import Driver from "@/models/Driver";
import { connectDB } from "@/lib/db";

export async function POST(req) {

  await connectDB();

  const { driverId } =
    await req.json();

  const driver =
    await Driver.findById(driverId);

  if (!driver) {

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 404,
      }
    );
  }

  if (driver.rewardRides < 15) {

    return NextResponse.json(
      {
        success: false,
        message:
          "15 rides required",
      },
      {
        status: 400,
      }
    );
  }

  driver.rewardBalance = 0;
  driver.rewardRides = 0;

  await driver.save();

  return NextResponse.json({
    success: true,
  });
}