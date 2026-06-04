import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET(req) {

  try {

    await connectDB();

    const authHeader =
      req.headers.get(
        "authorization"
      );

    if (!authHeader) {

      return NextResponse.json(
        {
          message:
            "No token provided",
        },
        { status: 401 }
      );
    }

    const token =
      authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user =
      await User.findById(
        decoded.id
      ).select("-password");

    if (!user) {

      return NextResponse.json(
        {
          message:
            "User not found",
        },
        { status: 404 }
      );
    }

   return NextResponse.json({
  user: {
    ...user.toObject(),

    rewardBalance:
      user.rewardBalance || 0,

    rewardRides:
      user.rewardRides || 0,
  },
});

  } catch (err) {

    console.log(err);

    return NextResponse.json(
      {
        message:
          "Invalid token",
      },
      { status: 401 }
    );
  }
}