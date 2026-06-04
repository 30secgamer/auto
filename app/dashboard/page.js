"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const RideMap = dynamic(
  () => import("@/app/components/RideMap"),
  {
    ssr: false,
  }
);

export default function Dashboard() {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [activeRide, setActiveRide] =
  useState(null);
  const [otp, setOtp] =
useState("");

 
  const [showSettings, setShowSettings] = useState(false);
  const [rides, setRides] =
  useState([]);

  const [completingRide, setCompletingRide] =
  useState(false);
  // 🚕 FETCH AVAILABLE RIDES
useEffect(() => {

  if (!online) return;

  const fetchRides = async () => {

    try {

    const res = await fetch(
  `/api/rides/available?driverId=${driver._id}`
);

      const data =
        await res.json();

      setRides(data);

    } catch (err) {
      console.log(err);
    }
  };

  fetchRides();

  const interval =
    setInterval(fetchRides, 5000);

  return () =>
    clearInterval(interval);

}, [online]);

  useEffect(() => {
    
    const fetchDriver = async () => {
      const token = localStorage.getItem("token");

      try {
        const res = await fetch("/api/auth/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

      if (!res.ok) {

  localStorage.removeItem("token");

  window.location.href = "/login";

  return;
}

        setDriver(data);
        setOnline(data.isOnline || false); // ✅ sync online state
      } catch {
        console.log("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDriver();
  }, []);

  useEffect(() => {

  if (!driver?._id) return;

  const fetchActiveRide =
    async () => {

      try {

        const res = await fetch(
          "/api/rides/driver-active",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              driverId:
                driver._id,
            }),
          }
        );

        const data =
          await res.json();

        setActiveRide(data);

      } catch (err) {
        console.log(err);
      }
    };

  fetchActiveRide();

  const interval =
    setInterval(
      fetchActiveRide,
      3000
    );

  return () =>
    clearInterval(interval);

}, [driver]);

useEffect(() => {

  if (!activeRide) return;

  const sendLocation = () => {

    navigator.geolocation.getCurrentPosition(
      async (position) => {

        await fetch(
          "/api/rides/update-location",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              rideId:
                activeRide._id,

              lat:
                position.coords
                  .latitude,

              lon:
                position.coords
                  .longitude,
            }),
          }
        );
      }
    );
  };

  sendLocation();

  const interval =
    setInterval(sendLocation, 3000);

  return () =>
    clearInterval(interval);

}, [activeRide]);
  

  // 🌀 Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!driver) return null;

  // 🚫 Block if not approved
 // 🟡 PENDING
if (driver.status === "pending") {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f4f5]">
      <div className="bg-white p-6 rounded-xl shadow text-center">
        <h2 className="text-lg font-semibold mb-2">Verification Pending</h2>
        <p className="text-sm text-gray-500">
          Your account is under review. Please wait for approval.
        </p>
      </div>
    </div>
  );
}

// 🔴 REJECTED
if (driver.status === "rejected") {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f4f5]">
      <div className="bg-white p-6 rounded-xl shadow text-center max-w-sm">
        
        <h2 className="text-lg font-semibold mb-2 text-red-600">
          Verification Rejected
        </h2>

        <p className="text-sm text-gray-600 mb-3">
          {driver.rejectionReason || "Your documents were rejected"}
        </p>

        <button
          onClick={() => (window.location.href = "/onboarding")}
          className="w-full bg-black text-white py-2 rounded-lg"
        >
          Re-upload Documents
        </button>

      </div>
    </div>
  );
}
  const statusColor =
    driver.status === "approved"
      ? "text-green-600"
      : driver.status === "rejected"
      ? "text-red-600"
      : "text-yellow-600";

  // 🔥 Toggle Online (REAL API)
  const toggleOnline = async () => {
    const token = localStorage.getItem("token");

    try {
      setToggling(true);

      const res = await fetch("/api/auth/toggle-online", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setOnline(data.isOnline);
      }
    } catch {
      console.log("Toggle failed");
    } finally {
      setToggling(false);
    }
  };
  const acceptRide = async (
  rideId
) => {

  try {

    const res = await fetch(
      "/api/rides/accept",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

       body: JSON.stringify({
  rideId,
  driverId: driver._id,
  driverName: driver.name,
}),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert("Ride accepted");

  } catch (err) {
    console.log(err);
  }
};

const verifyOtp = async () => {

  try {

    const res = await fetch(
      "/api/rides/verify-otp",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          rideId:
            activeRide._id,
          otp,
        }),
      }
    );

    const data =
      await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

  alert("OTP verified");

setActiveRide((prev) => ({
  ...prev,
  otpVerified: true,
  status: "pickedup",
}));

  } catch (err) {
    console.log(err);
  }
};
const completeRide = async () => {

  if (completingRide) return;

  try {

    setCompletingRide(true);

    const res = await fetch(
      "/api/rides/complete",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          rideId:
            activeRide._id,
        }),
      }
    );

    const data =
      await res.json();

   if (!res.ok) {
  alert(data.message);
  setCompletingRide(false);
  return;
}

alert("Ride completed");

setActiveRide(null);

setRides([]);

// force dashboard refresh
window.location.reload();

  } catch (err) {

    console.log(err);

  } finally {

    setCompletingRide(false);

  }
};
const rewardTarget = 15;

const completedRides =
  driver.rewardRides || 0;

const rewardProgress =
  completedRides % rewardTarget;
const rewardReady =
  completedRides >= 15;

const rewardAmount =
  driver.rewardBalance || 0;


  const claimReward = async () => {

  if (rewardAmount <= 0) {
    alert("No reward available");
    return;
  }

  const res = await fetch(
    "/api/rewards/claim",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        driverId: driver._id,
      }),
    }
  );

  const data = await res.json();

  if (data.success) {
    alert(
      "Reward withdrawal requested"
    );

    window.location.reload();
  }
};

 return (
  <div className="min-h-screen bg-[#f6f7f9]">

    {/* HEADER */}
    <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-md mx-auto px-4 h-[74px] flex items-center justify-between">

        {/* PROFILE */}
        <div className="flex items-center gap-3">

          <div className="relative">

            <img
              src={driver.profilePhoto}
              className="w-12 h-12 rounded-full object-cover border border-gray-200"
            />

            {/* ONLINE DOT */}
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                online
                  ? "bg-green-500"
                  : "bg-gray-400"
              }`}
            />

          </div>

          <div>

            {/* NAME */}
            <h2 className="text-[15px] font-semibold text-gray-900 leading-none">
              {driver.name}
            </h2>

            {/* VEHICLE + RIDES */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">

              <span className="text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-[4px] rounded-full tracking-wide">
                {driver.vehicleNumber}
              </span>

              <span className="text-xs text-gray-500">
                {driver.totalRides || 0} rides
              </span>

            </div>

          </div>

        </div>

        {/* SETTINGS */}
        <button
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center active:scale-95 transition-all duration-200 shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15.5A3.5 3.5 0 1012 8.5a3.5 3.5 0 000 7z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 005 15a1.65 1.65 0 00-1.51-1H3.4a2 2 0 110-4h.09A1.65 1.65 0 005 8a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 3.6V3.5a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019 10c.67 0 1.25.39 1.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
            />
          </svg>
        </button>

      </div>
    </div>

    {/* MAIN */}
    <div className="max-w-md mx-auto p-4 space-y-4">

      {/* ONLINE STATUS CARD */}
      <div
        className={`relative overflow-hidden rounded-[30px] p-5 transition-all duration-300 shadow-sm border ${
          online
            ? "bg-black border-black"
            : "bg-white border-gray-200"
        }`}
      >

        {/* GLOW */}
        <div
          className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${
            online
              ? "bg-green-400"
              : "bg-gray-300"
          }`}
        />

        <div className="relative flex items-center justify-between">

          {/* LEFT */}
          <div className="flex-1 pr-4">

            {/* BADGE */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                online
                  ? "bg-white/10 text-green-300 border border-white/10"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
              }`}
            >

              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  online
                    ? "bg-green-400"
                    : "bg-gray-400"
                }`}
              />

              {online ? "Driver Online" : "Driver Offline"}

            </div>

            {/* TITLE */}
            <h2
              className={`text-[26px] font-bold leading-tight tracking-tight ${
                online
                  ? "text-white"
                  : "text-gray-900"
              }`}
            >
              {online
                ? "Ready for rides"
                : "Go online now"}
            </h2>

            {/* DESC */}
            <p
              className={`text-sm mt-2 leading-relaxed ${
                online
                  ? "text-gray-300"
                  : "text-gray-500"
              }`}
            >
              {online
                ? "Passengers nearby can now send ride requests to you."
                : "Turn on availability to start receiving ride requests."}
            </p>

            {/* MINI STATS */}
            <div className="flex items-center gap-6 mt-5">

              <div>
                <p
                  className={`text-[11px] uppercase tracking-wide ${
                    online
                      ? "text-gray-400"
                      : "text-gray-400"
                  }`}
                >
                  Today
                </p>

                <p
                  className={`text-sm font-semibold ${
                    online
                      ? "text-white"
                      : "text-gray-900"
                  }`}
                >
                  0 rides
                </p>
              </div>

              <div>
                <p
                  className={`text-[11px] uppercase tracking-wide ${
                    online
                      ? "text-gray-400"
                      : "text-gray-400"
                  }`}

                >
                  Earnings
                </p>

                <p
                  className={`text-sm font-semibold ${
                    online
                      ? "text-white"
                      : "text-gray-900"
                  }`}
                >
                  ₹0
                </p>
              </div>

            </div>

          </div>

          {/* PREMIUM TOGGLE */}
          <button
            onClick={toggleOnline}
            disabled={toggling}
            className={`relative w-[74px] h-[40px] rounded-full transition-all duration-300 active:scale-95 ${
              online
                ? "bg-green-500 shadow-[0_0_25px_rgba(34,197,94,0.45)]"
                : "bg-gray-300"
            }`}
          >

            <div
              className={`absolute top-[4px] flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-lg transition-all duration-300 ${
                online
                  ? "left-[38px]"
                  : "left-[4px]"
              }`}
            >

              {toggling ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
              ) : (
                <div
                  className={`w-3 h-3 rounded-full ${
                    online
                      ? "bg-green-500"
                      : "bg-gray-400"
                  }`}
                />
              )}

            </div>

          </button>

        </div>

      </div>

      {/* EARNINGS */}
      <div className="bg-[#111111] rounded-[30px] p-5 text-white shadow-sm">

        <div className="flex items-start justify-between">

          <div>
            <p className="text-sm text-gray-400 mb-2">
              Total Earnings
            </p>

            <h1 className="text-4xl font-bold tracking-tight">
              ₹{driver.totalEarnings || 0}
            </h1>
          </div>

          <div className="bg-white/10 px-3 py-1 rounded-full text-xs">
            Lifetime
          </div>

        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-gray-400 mb-1">
              Today
            </p>

            <p className="text-lg font-semibold">
              ₹0
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-gray-400 mb-1">
              This Week
            </p>

            <p className="text-lg font-semibold">
              ₹0
            </p>
          </div>

        </div>

      </div>

      {/* DRIVER REWARDS */}

<div className="relative overflow-hidden bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 rounded-[30px] p-5 shadow-lg">

  {/* Glow */}
  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/30 rounded-full blur-3xl" />

  <div className="relative">

    <div className="flex items-center justify-between mb-4">

      <div>

        <p className="text-xs font-medium text-black/70 uppercase tracking-wider">
          Driver Rewards
        </p>

        <h2 className="text-2xl font-bold text-black mt-1">
          🎁 Rewards Hub
        </h2>

      </div>

      {/* Animated Gift */}

      <div className="relative">

        <div className="absolute inset-0 bg-white rounded-full blur-xl opacity-40 animate-pulse" />

        <div className="relative text-5xl animate-bounce">
          🎁
        </div>

      </div>

    </div>

    {/* Progress */}

    <div className="bg-black/10 rounded-2xl p-4">

      <div className="flex justify-between mb-2">

        <span className="text-sm font-semibold">
          Progress
        </span>

        <span className="text-sm font-bold">
          {Math.min(rewardProgress,15)}/15 rides
        </span>

      </div>

      <div className="w-full h-3 bg-white/40 rounded-full overflow-hidden">

        <div
          className="h-full bg-black rounded-full transition-all duration-700"
          style={{
            width: `${(rewardProgress / 15) * 100}%`,
          }}
        />

      </div>

      <p className="text-xs mt-2 text-black/70">
        Complete 15 rides to unlock reward.
      </p>

    </div>

    {/* Reward Amount */}

    <div className="mt-4 bg-white/40 backdrop-blur rounded-2xl p-4 flex items-center justify-between">

      <div>

        <p className="text-xs text-black/60">
          Available Reward
        </p>

        <h3 className="text-2xl font-bold text-black">
          ₹{rewardAmount}
        </h3>

      </div>

      {rewardReady ? (
     <button
  onClick={claimReward}
  className="bg-black text-white px-5 py-3 rounded-2xl font-semibold"
>
  Withdraw ₹{rewardAmount}
</button>
      ) : (
        <button
          disabled
          className="bg-black/30 text-black px-5 py-3 rounded-2xl font-semibold"
        >
          Locked
        </button>
      )}

    </div>

    {/* Milestone */}

    <div className="grid grid-cols-3 gap-2 mt-4">

      <div className="bg-white/30 rounded-xl p-3 text-center">

        <div className="text-lg">
          🚖
        </div>

        <p className="text-xs font-medium mt-1">
          15 Rides
        </p>

      </div>

      <div className="bg-white/30 rounded-xl p-3 text-center">

        <div className="text-lg">
          🏆
        </div>

        <p className="text-xs font-medium mt-1">
          Reward
        </p>

      </div>

      <div className="bg-white/30 rounded-xl p-3 text-center">

        <div className="text-lg">
          💸
        </div>

        <p className="text-xs font-medium mt-1">
          Withdraw
        </p>

      </div>

    </div>

  </div>

</div>
      {/* RIDE REQUESTS */}
{online &&
 !activeRide &&
 rides.length > 0 && (

  <div className="space-y-3">

    {rides.map((ride) => (

      <div
        key={ride._id}
        className="bg-white rounded-[30px] border border-gray-200 p-5 shadow-sm"
      >

        <div className="flex items-center justify-between">

          <div>

            <p className="text-xs text-gray-500 mb-2">
              New Ride Request
            </p>

            <h2 className="text-lg font-semibold text-gray-900">
              ₹{ride.fare}
            </h2>

          </div>

          <div className="bg-black text-white text-xs px-3 py-1 rounded-full">
            {ride.distance} km
          </div>

        </div>
        <div className="bg-gray-50 rounded-2xl p-4">

  <p className="text-xs text-gray-500 mb-2">
    Passenger Details
  </p>

  <div className="flex items-center justify-between">

    <div>
      <p className="text-sm font-semibold text-gray-900">
        {ride.passengerName}
      </p>

      <p className="text-sm text-gray-500 mt-1">
        {ride.passengerPhone}
      </p>
    </div>

    <a
      href={`tel:${ride.passengerPhone}`}
      className="w-11 h-11 rounded-full bg-black text-white flex items-center justify-center"
    >
      📞
    </a>

  </div>

</div>

        <div className="mt-4 space-y-3">

          <div>

            <p className="text-xs text-gray-500">
              Pickup
            </p>

            <p className="text-sm font-medium text-gray-900">
              {ride.pickup}
            </p>

          </div>

          <div>

            <p className="text-xs text-gray-500">
              Drop
            </p>

            <p className="text-sm font-medium text-gray-900">
              {ride.drop}
            </p>

          </div>

        </div>

        <button
          onClick={() =>
            acceptRide(
              ride._id
            )
          }
          className="w-full h-12 mt-5 rounded-2xl bg-black text-white font-medium"
        >
          Accept Ride
        </button>

      </div>
    ))}

  </div>
)}
{activeRide && (

<div className="bg-black text-white rounded-[30px] p-5 space-y-4">

  <h2 className="text-xl font-bold">
    Current Ride
  </h2>

  
{/* LIVE UBER STYLE MAP */}
<RideMap
  driverLat={Number(activeRide.driverLat)}
  driverLon={Number(activeRide.driverLon)}
  pickupLat={Number(activeRide.pickupLat)}
  pickupLon={Number(activeRide.pickupLon)}
  dropLat={Number(activeRide.dropLat)}
  dropLon={Number(activeRide.dropLon)}
  otpVerified={activeRide.otpVerified}
/>

  {/* PASSENGER */}
  <div>

    <p className="text-sm text-gray-300">
      Passenger
    </p>

    <p className="text-lg font-semibold">
      {activeRide.passengerName}
    </p>

  </div>

  {/* PICKUP */}
  <div>

    <p className="text-sm text-gray-300">
      Pickup Location
    </p>

    <p className="text-sm">
      {activeRide.pickup}
    </p>

  </div>

  {/* DROP */}
  <div>

    <p className="text-sm text-gray-300">
      Drop Location
    </p>

    <p className="text-sm">
      {activeRide.drop}
    </p>

  </div>

  {/* OTP SECTION */}
  {!activeRide.otpVerified && (

    <div className="bg-white/10 rounded-2xl p-4 space-y-3">

      <p className="text-sm font-medium">
        Ask passenger for OTP
      </p>

      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) =>
          setOtp(e.target.value)
        }
        className="w-full h-12 rounded-xl bg-white text-black px-4 outline-none"
      />

      <button
        onClick={verifyOtp}
        className="w-full h-12 rounded-xl bg-white text-black font-semibold"
      >
        Verify OTP
      </button>

    </div>

  )}

  {/* STATUS */}
  <div className="bg-white/10 rounded-2xl p-4">

    <p className="text-sm text-gray-300 mb-1">
      Ride Status
    </p>

    <p className="font-semibold">

      {activeRide.otpVerified
        ? "Passenger Picked Up"
        : "Going To Pickup"}

    </p>

  </div>

</div>

)}

{activeRide &&
 activeRide.status === "reached_drop" &&
 !completingRide && (
 <button
  onClick={completeRide}
  disabled={completingRide}
  className="w-full h-14 rounded-2xl bg-green-500 text-white font-bold text-lg"
>
  {completingRide
    ? "Completing..."
    : "Complete Ride"}
</button>
)}
      {/* STATS */}
      <div className="grid grid-cols-3 gap-3">

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-2">
            Rides
          </p>

          <h3 className="text-xl font-semibold text-gray-900">
            {driver.totalRides || 0}
          </h3>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-2">
            Rating
          </p>

          <h3 className="text-xl font-semibold text-gray-900">
            {driver.rating || 5.0}
          </h3>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-2">
            Approved
          </p>

          <h3
            className={`text-sm font-semibold ${
              driver.status === "approved"
                ? "text-green-600"
                : "text-yellow-600"
            }`}
          >
            {driver.status}
          </h3>
        </div>

      </div>

    </div>

    {/* SETTINGS MODAL */}
    {showSettings && (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">

        <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-5 animate-in slide-in-from-bottom duration-200">

          {/* TOP */}
          <div className="flex items-center justify-between mb-5">

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Settings
              </h2>

              <p className="text-sm text-gray-500">
                Driver documents & account
              </p>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
            >
              ✕
            </button>

          </div>

          {/* DOCUMENTS */}
          <div className="space-y-3">

            {[
              {
                label: "Driving License",
                link: driver.license,
              },
              {
                label: "Aadhaar Card",
                link: driver.aadhaar,
              },
              {
                label: "RC Book",
                link: driver.rc,
              },
              {
                label: "Vehicle Insurance",
                link: driver.insurance,
              },
            ].map((doc, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between"
              >

                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {doc.label}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Uploaded successfully
                  </p>
                </div>

                <a
                  href={doc.link}
                  target="_blank"
                  className="text-sm font-semibold text-black"
                >
                  View
                </a>

              </div>
            ))}

          </div>

          {/* LOGOUT */}
          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/";
            }}
            className="w-full h-12 mt-5 rounded-2xl bg-black text-white font-medium active:scale-[0.99] transition"
          >
            Logout
          </button>

        </div>

      </div>
    )}

  </div>
);
}