export async function geocodeAddress(
  city: string,
  state: string,
  zip: string,
  country = "USA"
): Promise<[number, number] | null> {
  try {
    const query = encodeURIComponent(`${city}, ${state} ${zip}, ${country}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    const response = await fetch(url, {
      headers: { "User-Agent": "TherapistDirectory/1.0" },
    });
    const data = (await response.json()) as Array<{ lat: string; lon: string }>;
    if (data.length === 0) return null;
    return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
  } catch {
    return null;
  }
}
