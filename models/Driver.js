import mongoose from "mongoose";

const DriverSchema = new mongoose.Schema({
  name: { type: String },

  phone: { type: String, required: true, unique: true },

  profilePhoto: String,
  aadhaar: String,
  license: String,
  vehicleNumber: String,
  rc: String,
  insurance: String,
  selfie: String,

  // ✅ ADD THIS
  isOnline: {
    type: Boolean,
    default: false,
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },

  rejectionReason: {
    type: String,
    default: "",
  },
  rewardBalance: {
  type: Number,
  default: 0,
},

rewardRides: {
  type: Number,
  default: 0,
},

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Driver ||
  mongoose.model("Driver", DriverSchema);