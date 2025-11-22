import SwissEph from 'swisseph-wasm';

// Singleton promise to ensure initialization happens only once
let swePromise = null;

export const initAstrology = () => {
    if (!swePromise) {
        swePromise = (async () => {
            console.log("Initializing SwissEph...");

            const swe = new SwissEph({
                locateFile: (path, scriptDirectory) => {
                    console.log(`locateFile called for: ${path}, scriptDirectory: ${scriptDirectory}`);
                    const origin = typeof window !== 'undefined' ? window.location.origin : '';
                    if (path.endsWith('.wasm')) return `${origin}/swisseph.wasm`;
                    if (path.endsWith('.data')) return `${origin}/swisseph.data`;
                    return path;
                },
                print: (text) => console.log("SwissEph stdout:", text),
                printErr: (text) => console.error("SwissEph stderr:", text),
                onAbort: (what) => console.error("SwissEph aborted:", what),
            });
            await swe.initSwissEph();
            console.log("SwissEph initialized.");
            return swe;
        })();
    }
    return swePromise;
};

export const calculatePlanetaryPositions = async (date, time, timezone, lat, lon) => {
    const swe = await initAstrology();

    // Validate inputs
    if (isNaN(lat) || isNaN(lon) || isNaN(timezone)) {
        throw new Error("Invalid location or timezone data.");
    }

    // Parse date and time
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    if ([year, month, day, hours, minutes].some(isNaN)) {
        throw new Error("Invalid date or time format.");
    }

    // Convert to UT
    const decimalTime = hours + minutes / 60.0 - timezone;

    console.log("Calculation Inputs:", { year, month, day, decimalTime, timezone, lat, lon });

    // Calculate Julian Day
    const calendarFlag = swe.SE_GREG_CAL !== undefined ? swe.SE_GREG_CAL : 1;
    const jd = swe.julday(year, month, day, decimalTime, calendarFlag);

    if (isNaN(jd)) {
        throw new Error("Julian Day calculation failed (returned NaN).");
    }

    // Set Sidereal Mode (Lahiri Ayanamsa)
    const sidMode = swe.SE_SIDM_LAHIRI !== undefined ? swe.SE_SIDM_LAHIRI : 1;
    swe.set_sid_mode(sidMode, 0, 0);

    const planets = [
        { id: swe.SE_SUN, name: 'Sun' },
        { id: swe.SE_MOON, name: 'Moon' },
        { id: swe.SE_MARS, name: 'Mars' },
        { id: swe.SE_MERCURY, name: 'Mercury' },
        { id: swe.SE_JUPITER, name: 'Jupiter' },
        { id: swe.SE_VENUS, name: 'Venus' },
        { id: swe.SE_SATURN, name: 'Saturn' },
        { id: swe.SE_RAHU, name: 'Rahu' },
        { id: swe.SE_KETU, name: 'Ketu' }
    ];

    const positions = [];

    // Flags: Sidereal (64*1024), Speed (256), Moshier (4)
    const SEFLG_MOSEPH = 4;
    const SEFLG_SIDEREAL = 64 * 1024;
    const SEFLG_SPEED = 256;

    let flags = (swe.SEFLG_SPEED || SEFLG_SPEED) | (swe.SEFLG_MOSEPH || SEFLG_MOSEPH) | (swe.SEFLG_SIDEREAL || SEFLG_SIDEREAL);

    for (const p of planets) {
        let planetId = p.id;

        if (p.name === 'Rahu') {
            planetId = swe.SE_TRUE_NODE !== undefined ? swe.SE_TRUE_NODE : 11;
        }
        if (p.name === 'Ketu') continue;

        if (planetId === undefined) {
            console.warn(`Planet ID for ${p.name} is undefined. Skipping.`);
            continue;
        }

        try {
            const result = swe.calc_ut(jd, planetId, flags);
            if (!result || result.length === 0) {
                console.error(`Calculation failed for ${p.name}`);
                continue;
            }
            positions.push({
                name: p.name,
                longitude: result[0],
                speed: result[3]
            });
        } catch (e) {
            console.error(`Error calculating ${p.name}:`, e);
            throw new Error(`Failed to calculate ${p.name}: ${e.message}`);
        }
    }

    // Add Ketu
    const rahu = positions.find(p => p.name === 'Rahu');
    if (rahu) {
        positions.push({
            name: 'Ketu',
            longitude: (rahu.longitude + 180) % 360,
            speed: rahu.speed
        });
    }

    // Calculate Ascendant Manually
    // Because swe.houses is broken in this WASM wrapper (returns 0 instead of data)
    let ascendant = 0;
    try {
        // 1. Get Obliquity (Epsilon)
        // SE_ECL_NUT = -1
        const SE_ECL_NUT = -1;
        const ecl = swe.calc_ut(jd, SE_ECL_NUT, flags); // Use same flags (Sidereal?) No, Ecliptic is tropical usually? 
        // Actually for Ascendant calculation we need True Obliquity of Date.
        // calc_ut with SE_ECL_NUT returns [eps_true, eps_mean, dpsi, deps]
        // We should probably use Tropical for the triangle calculation, then convert Ascendant to Sidereal?
        // Or calculate Ascendant in Tropical then subtract Ayanamsa?
        // Yes, standard practice: Calculate Tropical Ascendant, then subtract Ayanamsa.

        // Calculate Tropical Obliquity
        const tropFlags = (swe.SEFLG_SPEED || SEFLG_SPEED) | (swe.SEFLG_MOSEPH || SEFLG_MOSEPH); // No Sidereal flag
        const eclTrop = swe.calc_ut(jd, SE_ECL_NUT, tropFlags);
        const eps = eclTrop[0];

        // 2. Get Sidereal Time (Greenwich)
        const gmst = swe.sidtime(jd);

        // 3. Calculate RAMC (Right Ascension of MC)
        // RAMC = GMST * 15 + Longitude
        const ramc = (gmst * 15 + lon + 360) % 360;

        // 4. Calculate Ascendant (Tropical)
        const rad = Math.PI / 180;
        const ramcRad = ramc * rad;
        const epsRad = eps * rad;
        const latRad = lat * rad;

        // Formula: tan(Asc) = cos(RAMC) / (-sin(RAMC) * cos(Eps) - tan(Lat) * sin(Eps))
        // Note: signs depend on quadrant.
        // Let's use:
        // y = cos(RAMC)
        // x = -sin(RAMC) * Math.cos(epsRad) - Math.tan(latRad) * Math.sin(epsRad)
        // asc = atan2(y, x)

        const y = Math.cos(ramcRad);
        const x = -Math.sin(ramcRad) * Math.cos(epsRad) - Math.tan(latRad) * Math.sin(epsRad);

        let ascTrop = Math.atan2(y, x) / rad;
        if (ascTrop < 0) ascTrop += 360;

        // 5. Convert to Sidereal
        // Get Ayanamsa
        const ayanamsa = swe.get_ayanamsa_ut(jd);
        ascendant = (ascTrop - ayanamsa + 360) % 360;

        console.log("Manual Ascendant Calculation:", { gmst, ramc, eps, ascTrop, ayanamsa, ascendant });

    } catch (e) {
        console.error("Error calculating Ascendant manually:", e);
        // Fallback to 0 if fails, but log error
        throw new Error("Failed to calculate Ascendant.");
    }

    // Dummy houses array (Whole Sign)
    // 1st House starts at 0 deg of Ascendant Sign
    const ascSignStart = Math.floor(ascendant / 30) * 30;
    const houses = Array.from({ length: 12 }, (_, i) => (ascSignStart + i * 30) % 360);

    return {
        ascendant,
        planets: positions,
        houses: houses
    };
};
