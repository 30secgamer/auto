import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,

    email: {
      type: String,
      unique: true,
    },
    rewardBalance: {
  type: Number,
  default: 0,
},

rewardRides: {
  type: Number,
  default: 0,
},

    phone: {
      type: String,
      unique: true,
    },

    password: String,
  },
  
  {
    timestamps: true,
  },
  

);

export default mongoose.models.User ||
  mongoose.model("User", userSchema);