import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";

// Custom hook for Egypt detection
const useEgyptDetection = () => {
  const [geoError, setGeoError] = useState<string | null>(null);
  const setEgyptUser = useStore((state) => state.setEgyptUser);

  const checkIfEgypt = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data = await response.json();
      const isEgypt = data.address?.country === "Egypt";
      setEgyptUser(isEgypt);
      return isEgypt;
    } catch (err) {
      setGeoError("Failed to detect country.");
      return null;
    }
  };

  const detectEgypt = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported.");
      return Promise.resolve(null);
    }

    return new Promise<boolean | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const isEgypt = await checkIfEgypt(
            position.coords.latitude,
            position.coords.longitude,
          );
          resolve(isEgypt);
        },
        (err) => {
          setGeoError("Location access denied.");
          resolve(null);
        },
      );
    });
  };

  return { geoError, detectEgypt };
};

// Main Component
const GeolocationPopup = () => {
  const [showLocationRequest, setShowLocationRequest] = useState(true);
  const [showCurrencyReminder, setShowCurrencyReminder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { geoError, detectEgypt } = useEgyptDetection();
  const isEgyptUser = useAppStore((state) => state.isEgyptUser);

  const requestLocation = async () => {
    await detectEgypt();
    setShowLocationRequest(false);

    // Show currency reminder even if location was denied
    if (isEgyptUser === null) {
      setShowCurrencyReminder(true);
    }
  };

  const handleDeny = () => {
    setShowLocationRequest(false);
    setShowCurrencyReminder(true);
    setError(
      "You are viewing prices in USD by default. Enable location access for accurate local pricing.",
    );
  };

  const closeAllPopups = () => {
    setShowCurrencyReminder(false);
  };

  return (
    <>
      {/* Blur Overlay */}
      {(showLocationRequest || showCurrencyReminder) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50" />
      )}

      {/* Popup 1: Location Request */}
      {showLocationRequest && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg">
            <h3 className="text-2xl font-bold mb-4 text-center">
              Enable Location?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              Please allow the website to access your location to provide
              accurate pricing based on your country and currency.
            </p>

            <div className="flex justify-between gap-6">
              <button
                onClick={handleDeny}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
              >
                Deny
              </button>
              <button
                onClick={requestLocation}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup 2: Currency Reminder */}
      {showCurrencyReminder && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg">
            <h3 className="text-2xl font-bold mb-4 text-center">
              {isEgyptUser ? "Local Pricing Available" : "Prices in USD"}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              {isEgyptUser
                ? "You're now viewing prices in your local currency."
                : error || "You're viewing prices in USD by default."}
            </p>
            {geoError && (
              <p className="text-yellow-600 mb-4 text-center">{geoError}</p>
            )}

            <div className="flex justify-center">
              <button
                onClick={closeAllPopups}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GeolocationPopup;
