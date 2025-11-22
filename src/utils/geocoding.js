import tzlookup from 'tz-lookup';

export const searchCity = async (query) => {
    if (!query || query.length < 3) return [];

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await response.json();
        return data.map(item => ({
            display_name: item.display_name,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
        }));
    } catch (error) {
        console.error("Geocoding error:", error);
        return [];
    }
};

export const getTimezone = (lat, lon) => {
    try {
        return tzlookup(lat, lon);
    } catch (e) {
        console.error("Timezone lookup failed:", e);
        return "UTC";
    }
};

export const getTimezoneOffset = (timezone) => {
    // Returns offset in hours (e.g., 5.5 for IST)
    // We can use Intl.DateTimeFormat to get the offset for a specific timezone
    const date = new Date();
    const str = date.toLocaleString('en-US', { timeZone: timezone, timeZoneName: 'longOffset' });
    // Extract offset, e.g., "GMT+05:30"
    const match = str.match(/GMT([+-]\d{2}):(\d{2})/);
    if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const sign = hours < 0 ? -1 : 1;
        return hours + (sign * minutes / 60);
    }
    return 0;
};
