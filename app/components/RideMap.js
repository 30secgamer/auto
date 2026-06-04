"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function RideMap({
  driverLat,
  driverLon,
  pickupLat,
  pickupLon,
  dropLat,
  dropLon,
  otpVerified,
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  const driverMarker = useRef(null);
  const pickupMarker = useRef(null);
  const dropMarker = useRef(null);

  const mapLoaded = useRef(false);

  useEffect(() => {
    const dLat = parseFloat(driverLat);
    const dLon = parseFloat(driverLon);

    if (
      !mapContainer.current ||
      isNaN(dLat) ||
      isNaN(dLon)
    ) {
      return;
    }

    if (!mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: mapContainer.current,
        style:
          "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: [dLon, dLat],
        zoom: 15,
      });

      mapRef.current.addControl(
        new maplibregl.NavigationControl(),
        "top-right"
      );

      mapRef.current.on("load", () => {
        mapLoaded.current = true;
        updateMap();
      });

      return;
    }

    if (mapLoaded.current) {
      updateMap();
    }

    async function updateMap() {
      const map = mapRef.current;

      const pLat = parseFloat(pickupLat);
      const pLon = parseFloat(pickupLon);

      const drLat = parseFloat(dropLat);
      const drLon = parseFloat(dropLon);

      let targetLat = null;
      let targetLon = null;

      if (
        otpVerified &&
        !isNaN(drLat) &&
        !isNaN(drLon)
      ) {
        targetLat = drLat;
        targetLon = drLon;
      }

      if (
        !otpVerified &&
        !isNaN(pLat) &&
        !isNaN(pLon)
      ) {
        targetLat = pLat;
        targetLon = pLon;
      }
// DRIVER MARKER

if (!driverMarker.current) {
  const el = document.createElement("div");

  el.innerHTML = `
    <div
      class="driver-arrow"
      style="
        width:34px;
        height:34px;
        display:flex;
        align-items:center;
        justify-content:center;
        transition:transform .5s ease;
      "
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="#FFB300"
        xmlns="http://www.w3.org/2000/svg"
        style="
          filter:drop-shadow(0 0 8px rgba(26,115,232,.6));
        "
      >
        <path d="M12 2L22 22L12 17L2 22L12 2Z"/>
      </svg>
    </div>
  `;

  driverMarker.current = new maplibregl.Marker({
    element: el,
    anchor: "center",
  })
    .setLngLat([dLon, dLat])
    .addTo(map);
} else {
  driverMarker.current.setLngLat([dLon, dLat]);

  if (
    targetLat !== null &&
    targetLon !== null
  ) {
    const bearing =
  Math.atan2(
    targetLat - dLat,
    targetLon - dLon
  ) *
  (180 / Math.PI) + 90;

    const arrow =
      driverMarker.current
        ?.getElement()
        ?.querySelector(".driver-arrow");

    if (arrow) {
      arrow.style.transform =
        `rotate(${bearing}deg)`;
    }
  }
}

      // PICKUP MARKER
      if (
        !otpVerified &&
        !isNaN(pLat) &&
        !isNaN(pLon)
      ) {
        if (!pickupMarker.current) {
          const el = document.createElement("div");

          el.style.width = "16px";
          el.style.height = "16px";
          el.style.background = "#3b82f6";
          el.style.border = "3px solid white";
          el.style.borderRadius = "50%";

          pickupMarker.current = new maplibregl.Marker(el)
            .setLngLat([pLon, pLat])
            .addTo(map);
        } else {
          pickupMarker.current.setLngLat([pLon, pLat]);
        }
      }

      // DROP MARKER
      if (
        otpVerified &&
        !isNaN(drLat) &&
        !isNaN(drLon)
      ) {
        if (!dropMarker.current) {
          const el = document.createElement("div");

          el.style.width = "16px";
          el.style.height = "16px";
          el.style.background = "#ef4444";
          el.style.border = "3px solid white";
          el.style.borderRadius = "50%";

          dropMarker.current = new maplibregl.Marker(el)
            .setLngLat([drLon, drLat])
            .addTo(map);
        } else {
          dropMarker.current.setLngLat([drLon, drLat]);
        }
      }

      if (
        targetLat === null ||
        targetLon === null
      ) {
        return;
      }

      try {
        const response = await fetch(
          "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
          {
            method: "POST",
            headers: {
              Authorization:
                process.env.NEXT_PUBLIC_ORS_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              coordinates: [
                [dLon, dLat],
                [targetLon, targetLat],
              ],
            }),
          }
        );

        const routeData = await response.json();

        if (!routeData.features?.length) return;

        const routeGeoJson = routeData.features[0];

        if (map.getSource("route")) {
          const routeSource = map.getSource("route");

if (routeSource) {
  routeSource.setData(routeGeoJson);
}
        } else {
          map.addSource("route", {
            type: "geojson",
            data: routeGeoJson,
          });

          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
           paint: {
  "line-color": "#1A73E8",
  "line-width": 7,
  "line-opacity": 0.9,
},
          });
        }

        const bounds = new maplibregl.LngLatBounds();

        routeGeoJson.geometry.coordinates.forEach(
          (coord) => bounds.extend(coord)
        );

        map.fitBounds(bounds, {
          padding: 70,
          duration: 1200,
        });
      } catch (err) {
        console.error(
          "Route Fetch Error:",
          err
        );
      }
    }
  }, [
    driverLat,
    driverLon,
    pickupLat,
    pickupLon,
    dropLat,
    dropLon,
    otpVerified,
  ]);

  return (
    <div
      ref={mapContainer}
      className="h-[320px] w-full rounded-3xl overflow-hidden"
    />
  );
}