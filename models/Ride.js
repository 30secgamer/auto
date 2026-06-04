import mongoose from "mongoose";

const RideSchema = new mongoose.Schema(
  {
    // 👤 PASSENGER
    passengerName: String,
    passengerPhone: String,

    // 📍 LOCATIONS
    pickup: String,
    drop: String,

    pickupLat: Number,
    pickupLon: Number,

    dropLat: Number,
    dropLon: Number,

    // 💰 RIDE INFO
    distance: Number,
    fare: Number,

    // 🔐 OTP
    otp: {
      type: String,
    },
    requestExpiresAt: {
  type: Date,
},

    otpVerified: {
      type: Boolean,
      default: false,
    },

    // 🚕 RIDE STATUS
    status: {
      type: String,
     enum: [
  "searching",
  "accepted",
  "arriving",
  "pickedup",
  "reached_drop",
  "completed",
  "cancelled",
],
      default: "searching",
    },

    // 👨‍✈️ DRIVER
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },

    driverName: String,
    driverPhone: String,
    vehicleNumber: String,

    // ⭐ FAVORITE DRIVER SYSTEM
    preferredDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },

    preferredDriverExpiresAt: {
      type: Date,
      default: null,
    },

    // 📡 LIVE DRIVER LOCATION
    driverLat: Number,
    driverLon: Number,

    // ⏰ TIMES
    acceptedAt: Date,
    pickedUpAt: Date,
    completedAt: Date,
  },
  

  {
    timestamps: true,
  }

);

export default mongoose.models.Ride ||
  mongoose.model("Ride", RideSchema);