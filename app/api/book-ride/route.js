import { NextResponse } from "next/server";

import Ride from "@/models/Ride";
import Driver from "@/models/Driver";
import FavoriteDriver from "@/models/FavoriteDriver";

import { connectDB } from "@/lib/db";

export async function POST(req) {

  try {

    await connectDB();

    // 📦 GET BODY
    const body =
      await req.json();

    const {
      passengerName,
      passengerPhone,

      pickup,
      drop,

      pickupLat,
      pickupLon,

      dropLat,
      dropLon,

      distance,
      fare,
    } = body;

    // 🚫 VALIDATION
    if (
      !passengerName ||
      !passengerPhone ||
      !pickup ||
      !drop
    ) {

      return NextResponse.json(
        {
          message:
            "Missing required fields",
        },
        {
          status: 400,
        }
      );
    }

    // 🚫 CHECK ACTIVE RIDE
    const existingRide =
      await Ride.findOne({
        passengerPhone,

        status: {
          $in: [
            "searching",
            "accepted",
            "arriving",
            "pickedup",
          ],
        },
      });

    if (existingRide) {

      return NextResponse.json(
        {
          message:
            "You already have an active ride",
        },
        {
          status: 400,
        }
      );
    }

    // ⭐ FIND FAVORITE DRIVER
    const favorite =
      await FavoriteDriver.findOne({
        passengerPhone,
      });

    let favoriteDriver =
      null;

    if (favorite) {

      favoriteDriver =
        await Driver.findOne({
          _id:
            favorite.driverId,

          isOnline: true,

          status: "approved",
        });
    }

    // 🔐 GENERATE OTP
    const otp =
      Math.floor(
        1000 +
          Math.random() *
            9000
      ).toString();

    // 🚕 CREATE RIDE
    const ride =
      await Ride.create({

        passengerName,
        passengerPhone,

        pickup,
        drop,

        pickupLat,
        pickupLon,

        dropLat,
        dropLon,

        distance,
        fare,

        otp,

        otpVerified: false,

        // ⭐ FAVORITE DRIVER
        preferredDriverId:
          favoriteDriver?._id ||
          null,

        preferredDriverExpiresAt:
          favoriteDriver
            ? new Date(
                Date.now() +
                  15000
              )
            : null,

        status: "searching",
         requestExpiresAt: new Date(
    Date.now() + 60000
  ), // 60 sec
      });

    return NextResponse.json({
      success: true,
      ride,
    });

  } catch (error) {

    console.log(
      "BOOK RIDE ERROR:",
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