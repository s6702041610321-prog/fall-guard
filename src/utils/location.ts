import * as Location from "expo-location";

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const result = await Location.requestForegroundPermissionsAsync();
    return result.granted;
  } catch {
    return false;
  }
}

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([promise, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);

export type Coords = { latitude: number; longitude: number };

export const mapsLink = ({ latitude, longitude }: Coords) =>
  `https://maps.google.com/?q=${latitude},${longitude}`;

// Returns where the phone is now, or null if it can't be found
// (no permission, GPS off, timeout).
export async function getCoords(): Promise<Coords | null> {
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) return null;

    const current = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      8000
    );
    const position = current ?? (await Location.getLastKnownPositionAsync());
    if (!position) return null;

    const { latitude, longitude } = position.coords;
    return { latitude, longitude };
  } catch {
    return null;
  }
}
