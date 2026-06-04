"use client";

import { useEffect, useState } from "react";


export default function BookingPage() {
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");

  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);

  const [showPickupSuggestions, setShowPickupSuggestions] =
    useState(false);

  const [showDropSuggestions, setShowDropSuggestions] =
    useState(false);

  const [fareData, setFareData] = useState(null);

  const [loadingFare, setLoadingFare] = useState(false);
  const [userLocation, setUserLocation] =
  useState(null);

  const [user, setUser] =
  useState(null);
  const [activeRide, setActiveRide] =
  useState(null);
  const [driverDistance,
setDriverDistance] =
useState(0);

const [eta,
setEta] =
useState(0);
  const [showFavoritePopup,
  setShowFavoritePopup] =
  useState(false);
  const [loadingCurrentLocation, setLoadingCurrentLocation] =
  useState(false);
  const useCurrentLocation = () => {

  setLoadingCurrentLocation(true);

  navigator.geolocation.getCurrentPosition(

    async (position) => {

      try {

        const lat =
          position.coords.latitude;

        const lon =
          position.coords.longitude;

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );

        const data =
          await res.json();

        setPickup(
          data.display_name
        );

      } catch (err) {

        console.log(err);

      } finally {

        setLoadingCurrentLocation(false);

      }

    },

    (err) => {

      console.log(err);

      setLoadingCurrentLocation(false);

    }

  );

};

  // 🚕 FETCH FARE
  const calculateFare = async () => {
    if (!pickup || !drop) return;

    try {
      setLoadingFare(true);

      const res = await fetch("/api/fare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickup,
          drop,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed");
        return;
      }

      setFareData(data);

    } catch (err) {
      console.log(err);
    } finally {
      setLoadingFare(false);
    }
  };

 // 📍 SMART LOCATION SUGGESTIONS
const getSuggestions = async (
  query,
  type
) => {

  if (!query || query.length < 2) return;

  try {

    let url = "";

    // 🔥 USE GPS BIAS
    if (userLocation) {

      url =
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&addressdetails=1&limit=15&countrycodes=in&viewbox=${
          userLocation.lon - 0.08
        },${userLocation.lat + 0.08},${
          userLocation.lon + 0.15
        },${userLocation.lat - 0.15}&bounded=1`;

    } else {

      url =
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&addressdetails=1&limit=10&countrycodes=in`;

    }

    const res = await fetch(url);

    const data = await res.json();

    const search =
  query.toLowerCase();

const sortedResults = data
  .map((item) => {

    const name =
      item.display_name.toLowerCase();

    let score = 0;

    if (
      name.startsWith(search)
    ) {
      score += 100;
    }

    if (
      name.includes(search)
    ) {
      score += 50;
    }

    if (
      item.address?.road
        ?.toLowerCase()
        ?.includes(search)
    ) {
      score += 30;
    }

    if (
      item.address?.suburb
        ?.toLowerCase()
        ?.includes(search)
    ) {
      score += 20;
    }

    return {
      ...item,
      score,
    };
  })

  .sort(
    (a, b) =>
      b.score - a.score
  );

    if (type === "pickup") {
      setPickupSuggestions(
        sortedResults
      );
    } else {
      setDropSuggestions(
        sortedResults
      );
    }

  } catch (err) {
    console.log(err);
  }
};

  // 🔥 PICKUP SEARCH
  useEffect(() => {
    const timeout = setTimeout(() => {
      getSuggestions(pickup, "pickup");
    }, 400);

    return () => clearTimeout(timeout);
  }, [pickup]);

  // 🔥 DROP SEARCH
  useEffect(() => {
    const timeout = setTimeout(() => {
      getSuggestions(drop, "drop");
    }, 400);

    return () => clearTimeout(timeout);
  }, [drop]);

  // 💰 AUTO CALCULATE FARE
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (pickup && drop) {
        calculateFare();
      }
    }, 700);

    return () => clearTimeout(timeout);
  }, [pickup, drop]);

  // 👤 FETCH USER
useEffect(() => {

  const fetchUser = async () => {

    try {

      const token =
        localStorage.getItem(
          "userToken"
        );

      // 🚫 NOT LOGGED IN
      if (!token) {

        window.location.href =
          "/user-login";

        return;
      }

      const res = await fetch(
        "/api/user-profile",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await res.json();

      if (!res.ok) {

        localStorage.removeItem(
          "userToken"
        );

        window.location.href =
          "/user-login";

        return;
      }

      setUser(data.user);

    } catch (err) {

      console.log(err);

    }
  };

  fetchUser();

}, []);

  // 📍 GET REAL USER LOCATION
useEffect(() => {

  navigator.geolocation.getCurrentPosition(

    async (position) => {

      const lat =
        position.coords.latitude;

      const lon =
        position.coords.longitude;

      setUserLocation({
        lat,
        lon,
      });

      try {

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );

        const data =
          await res.json();

        setPickup(
          data.display_name
        );

      } catch (err) {

        console.log(err);

      }

    }

  );

}, []);

// 👤 LOAD USER
useEffect(() => {

  const storedUser =
    localStorage.getItem("user");

  if (storedUser) {
    setUser(JSON.parse(storedUser));
  }

}, []);

useEffect(() => {

  if (!user?.phone) return;

  const fetchRide = async () => {

    try {

      const res = await fetch(
        "/api/rides/user-active",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            passengerPhone:
              user.phone,
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

  fetchRide();

  const interval =
    setInterval(fetchRide, 3000);

  return () =>
    clearInterval(interval);

}, [user]);

useEffect(() => {

  if (
    activeRide?.status ===
      "completed" &&

    activeRide?.driverId
  ) {

    setShowFavoritePopup(true);

  }

}, [activeRide]);
useEffect(() => {

  if (
    !activeRide?.driverLat ||
    !activeRide?.pickupLat
  ) return;

  const distance =
    calculateDistance(
      activeRide.driverLat,
      activeRide.driverLon,
      activeRide.pickupLat,
      activeRide.pickupLon
    );

  setDriverDistance(
    distance.toFixed(1)
  );

  setEta(
    Math.max(
      1,
      Math.ceil(distance / 0.4)
    )
  );

}, [activeRide]);

const calculateDistance = (
  lat1,
  lon1,
  lat2,
  lon2
) => {

  const R = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos(
      (lat1 * Math.PI) / 180
    ) *
      Math.cos(
      (lat2 * Math.PI) / 180
    ) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
};

// 🚕 BOOK RIDE
const bookRide = async () => {

  try {

    const res = await fetch(
      "/api/book-ride",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          passengerName: user?.name,
passengerPhone: user?.phone,
          pickup,
          drop,

          pickupLat:
            fareData.pickupLat,

          pickupLon:
            fareData.pickupLon,

          dropLat:
            fareData.dropLat,

          dropLon:
            fareData.dropLon,

          distance:
            fareData.distance,

          fare:
            fareData.totalFare,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert(
      "Searching nearby drivers..."
    );

  } catch (err) {
    console.log(err);
  }
};
const saveFavoriteDriver =
  async (favorite) => {

    try {

      const res = await fetch(
        "/api/rides/favorite-driver",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            passengerPhone:
              user.phone,

            driverId:
              activeRide.driverId,

            favorite,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {

        alert(data.message);

        return;
      }

      setShowFavoritePopup(false);

      alert(
        favorite
          ? "Driver added to favorites"
          : "Okay"
      );

    } catch (err) {

      console.log(err);

    }
};

  return (
    <div className="min-h-screen bg-[#f6f7f9] pb-10">

     {/* HEADER */}
<div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200">

  <div className="max-w-md mx-auto h-[74px] px-4 flex items-center justify-between">

    {/* LEFT */}
    <div>

      <p className="text-xs text-gray-500">
        Welcome back
      </p>

      <h1 className="text-[20px] font-bold text-gray-900 mt-[2px]">
        {user?.name || "User"}
      </h1>

    </div>

    {/* PROFILE */}
    <div className="flex items-center gap-3">

      <div className="w-11 h-11 rounded-full bg-black text-white flex items-center justify-center text-lg font-semibold shadow-sm">

        {user?.name
          ?.charAt(0)
          ?.toUpperCase() || "U"}

      </div>

    </div>

  </div>

</div>

      {/* MAIN */}
      <div className="max-w-md mx-auto p-4 space-y-4">

        {/* REWARDS CARD */}

<div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-[30px] p-5 text-white shadow-lg overflow-hidden relative">

  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />

  <div className="relative z-10">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-white/80 text-sm">
          Gift Rewards
        </p>

        <h2 className="text-4xl font-bold">
          ₹{user?.rewardBalance || 0}
        </h2>

      </div>

      <div className="text-5xl">
        🎁
      </div>

    </div>

    <div className="mt-5">

      <div className="flex justify-between text-sm mb-2">

        <span>
          Progress to next milestone
        </span>

        <span>
          {user?.rewardRides || 0}/15
        </span>

      </div>

      <div className="h-3 bg-white/20 rounded-full overflow-hidden">

        <div
          className="h-full bg-white rounded-full transition-all"
          style={{
            width: `${Math.min(
              ((user?.rewardRides || 0) /
                15) *
                100,
              100
            )}%`,
          }}
        />

      </div>

      <p className="text-xs text-white/80 mt-3">

        Earn ₹1 for rides under 10km
        and ₹2 for rides above 10km.

      </p>

    </div>

  </div>

</div>

driverLat={activeRide?.driverLat}
driverLon={activeRide?.driverLon}

pickupLat={activeRide?.pickupLat}
pickupLon={activeRide?.pickupLon}

dropLat={activeRide?.dropLat}
dropLon={activeRide?.dropLon}

        {activeRide?.driverId && (

<div className="bg-white rounded-[30px] border border-gray-200 p-5 shadow-sm">

  <div className="flex items-center justify-between">

    <div>

      <p className="text-xs text-gray-500">
        Driver Status
      </p>

      <h2 className="text-lg font-bold text-gray-900">

        {activeRide.driverName}

      </h2>

    </div>

    <div className="text-right">

      <p className="text-green-600 font-semibold">

        {driverDistance} km away

      </p>

      <p className="text-xs text-gray-500">

        ETA {eta} min

      </p>

    </div>

  </div>

</div>

)}

        {/* LOCATION CARD */}
        <div className="bg-white rounded-[30px] border border-gray-200 p-5 shadow-sm">

          <div className="space-y-4">

            {/* PICKUP */}
            <div className="relative">

              <div className="flex gap-3">

                <div className="pt-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>

                <div className="flex-1">

                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Pickup Location
                  </p>

                  <input
                    type="text"
                    placeholder="Enter pickup location"
                    value={pickup}
                    onFocus={() =>
                      setShowPickupSuggestions(true)
                    }
                    onChange={(e) =>
                      setPickup(e.target.value)
                    }
                    className="w-full outline-none text-[15px] font-medium text-gray-900 placeholder:text-gray-400"
                  />
                  <button
  onClick={useCurrentLocation}
  className="
  mt-2
  flex
  items-center
  gap-2
  text-sm
  font-medium
  text-blue-600
"
>
  📍
  {loadingCurrentLocation
    ? "Getting location..."
    : "Use Current Location"}
</button>

                </div>

              </div>

              {/* PICKUP SUGGESTIONS */}
              {showPickupSuggestions &&
                pickupSuggestions.length > 0 && (
                  <div className="mt-3 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">

                    {pickupSuggestions
                      .slice(0, 5)
                      .map((place, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setPickup(place.display_name);
                            setShowPickupSuggestions(false);
                          }}
                          className="w-full text-left p-4 hover:bg-gray-50 border-b last:border-b-0 border-gray-100"
                        >

                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {place.display_name}
                          </p>

                        </button>
                      ))}

                  </div>
                )}

            </div>

            {/* LINE */}
            <div className="ml-[5px] h-6 border-l-2 border-dashed border-gray-300" />

            {/* DROP */}
            <div className="relative">

              <div className="flex gap-3">

                <div className="pt-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                </div>

                <div className="flex-1">

                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Drop Location
                  </p>

                  <input
                    type="text"
                    placeholder="Where do you want to go?"
                    value={drop}
                    onFocus={() =>
                      setShowDropSuggestions(true)
                    }
                    onChange={(e) =>
                      setDrop(e.target.value)
                    }
                    className="w-full outline-none text-[15px] font-medium text-gray-900 placeholder:text-gray-400"
                  />

                </div>

              </div>

              {/* DROP SUGGESTIONS */}
              {showDropSuggestions &&
                dropSuggestions.length > 0 && (
                  <div className="mt-3 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg">

                    {dropSuggestions
                      .slice(0, 5)
                      .map((place, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setDrop(place.display_name);
                            setShowDropSuggestions(false);
                          }}
                          className="w-full text-left p-4 hover:bg-gray-50 border-b last:border-b-0 border-gray-100"
                        >

                          <div>

  <p className="font-semibold text-gray-900">

    {place.display_name
      .split(",")[0]}

  </p>

  <p className="text-xs text-gray-500">

    {place.display_name}

  </p>

</div>

                        </button>
                      ))}

                  </div>
                )}

            </div>

          </div>

        </div>

        {/* FARE CARD */}
        <div className="bg-[#111111] text-white rounded-[30px] p-5 shadow-sm relative overflow-hidden">

          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" />

          <div className="relative z-10">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-sm text-gray-400 mb-2">
                  Estimated Fare
                </p>

                <h1 className="text-5xl font-bold tracking-tight">

                  {loadingFare
                    ? "..."
                    : `₹${fareData?.totalFare || 0}`}

                </h1>

              </div>

              <div className="bg-white/10 px-3 py-1 rounded-full text-xs border border-white/10">
                Auto
              </div>

            </div>

            {/* DETAILS */}
            <div className="mt-6 pt-5 border-t border-white/10 space-y-3">

              <div className="flex items-center justify-between text-sm">

                <p className="text-gray-400">
                  Distance
                </p>

                <p className="font-medium">
                  {fareData?.distance || 0} km
                </p>

              </div>

              <div className="flex items-center justify-between text-sm">

                <p className="text-gray-400">
                  Auto Fare
                </p>

                <p className="font-medium">
                  ₹{fareData?.autoFare || 0}
                </p>

              </div>

              <div className="flex items-center justify-between text-sm">

                <p className="text-gray-400">
                  Platform Fee
                </p>

                <p className="font-medium">
                  ₹{fareData?.platformFee || 0}
                </p>

              </div>

            </div>

          </div>

        </div>

     <button
  onClick={bookRide}
  
  disabled={
  !pickup ||
  !drop ||
  loadingFare ||
  activeRide
}
  className="w-full h-14 rounded-2xl bg-black text-white font-semibold text-[15px] transition-all active:scale-[0.99] disabled:opacity-50"
>

  {loadingFare
    ? "Calculating..."
    : activeRide
  ? activeRide.status ===
    "searching"
    ? "Searching nearby drivers..."
    : `Driver ${
    activeRide.driverName || "assigned"
  } accepted`
  : "Book Auto"}

</button>
{/* ACTIVE RIDE DETAILS */}
{activeRide && (

  <div className="bg-white rounded-[30px] border border-gray-200 p-5 shadow-sm mt-4 space-y-4">

    <h2 className="text-xl font-bold text-gray-900">
      Active Ride
    </h2>

    {/* DRIVER */}
    <div>
      <p className="text-xs text-gray-500">
        Driver
      </p>

      <p className="text-sm font-semibold text-gray-900">
        {activeRide.driverName || "Searching..."}
      </p>
    </div>

    {/* PICKUP */}
    <div>
      <p className="text-xs text-gray-500">
        Pickup
      </p>

      <p className="text-sm font-medium text-gray-900">
        {activeRide.pickup}
      </p>
    </div>

    {/* DROP */}
    <div>
      <p className="text-xs text-gray-500">
        Drop
      </p>

      <p className="text-sm font-medium text-gray-900">
        {activeRide.drop}
      </p>
    </div>

    {/* OTP */}
    {activeRide.driverId && !activeRide.otpVerified && (

      <div className="bg-black text-white rounded-2xl p-5 text-center">

        <p className="text-sm text-gray-300 mb-2">
          Share this OTP with driver
        </p>

        <h1 className="text-5xl font-bold tracking-[10px]">
          {activeRide.otp}
        </h1>

      </div>

    )}

    {/* PICKED UP */}
    {activeRide.otpVerified && (

      <div className="bg-green-100 text-green-700 rounded-2xl p-4 text-center font-semibold">

        Passenger Picked Up Successfully

      </div>

    )}

  </div>

)}

      </div>
      {/* FAVORITE DRIVER POPUP */}
{showFavoritePopup && (

  <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">

    <div className="bg-white w-full max-w-sm rounded-[30px] p-6">

      <div className="text-center">

        <div className="text-5xl mb-4">
          ⭐
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Favorite this driver?
        </h2>

        <p className="text-sm text-gray-500 mb-6">

          Next time we will prioritize this driver first if available.

        </p>

      </div>

      <div className="flex gap-3">

        <button
          onClick={() =>
            saveFavoriteDriver(true)
          }
          className="flex-1 h-12 rounded-2xl bg-black text-white font-semibold"
        >
          Yes
        </button>

        <button
          onClick={() =>
            saveFavoriteDriver(false)
          }
          className="flex-1 h-12 rounded-2xl border border-gray-300 text-gray-700 font-semibold"
        >
          No
        </button>

      </div>

    </div>

  </div>

)}

    </div>
  );
}