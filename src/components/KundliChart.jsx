import React from 'react';

const KundliChart = ({ planets, houses, ascendant }) => {
    // North Indian Chart Layout
    // It's a square with diagonals and midpoints connected.
    // 12 Houses are fixed in position, Signs move.
    // House 1 is Top Center Diamond.

    // SVG ViewBox 0 0 400 400
    // Center is 200, 200

    // House Centers (approximate for text placement)
    const houseCenters = [
        { x: 200, y: 80 },   // H1
        { x: 100, y: 40 },   // H2
        { x: 40, y: 100 },   // H3
        { x: 80, y: 200 },   // H4
        { x: 40, y: 300 },   // H5
        { x: 100, y: 360 },  // H6
        { x: 200, y: 320 },  // H7
        { x: 300, y: 360 },  // H8
        { x: 360, y: 300 },  // H9
        { x: 320, y: 200 },  // H10
        { x: 360, y: 100 },  // H11
        { x: 300, y: 40 },   // H12
    ];

    // Function to get Sign Number for a House
    // House 1 Sign = Ascendant Sign
    // House N Sign = (Ascendant Sign + N - 1) % 12 (adjusted for 1-12 range)
    const getSignNumber = (houseIndex) => {
        // houseIndex is 0-11 (H1-H12)
        // Ascendant longitude determines H1 sign.
        const ascSignIndex = Math.floor(ascendant / 30); // 0 = Aries
        const currentSignIndex = (ascSignIndex + houseIndex) % 12;
        return currentSignIndex + 1; // 1 = Aries
    };

    // Get planets in a specific house
    // In North Indian chart, House 1 is always top diamond.
    // We need to find which planets are in the sign corresponding to that house.
    // Actually, in North Indian chart, the HOUSES are fixed.
    // H1 is always top. The Sign in H1 is the Ascendant Sign.
    // So we check which planets are in the Sign of H1, H2, etc.
    const getPlanetsInHouse = (houseIndex) => {
        const signIndex = (Math.floor(ascendant / 30) + houseIndex) % 12;
        return planets.filter(p => Math.floor(p.longitude / 30) === signIndex);
    };

    const renderHouseContent = (houseIndex) => {
        const signNum = getSignNumber(houseIndex);
        const planetsInHouse = getPlanetsInHouse(houseIndex);
        const { x, y } = houseCenters[houseIndex];

        return (
            <g key={houseIndex}>
                {/* Sign Number */}
                <text x={x} y={y} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="40" fontWeight="bold">
                    {signNum}
                </text>

                {/* Planets */}
                <text x={x} y={y} textAnchor="middle" fill="white" fontSize="12" dy="0">
                    {planetsInHouse.map((p, i) => (
                        <tspan key={i} x={x} dy={i === 0 ? 0 : 14} fill={p.name === 'Sun' || p.name === 'Mars' ? '#fca5a5' : '#e2e8f0'}>
                            {p.name.substring(0, 2)}
                        </tspan>
                    ))}
                </text>
            </g>
        );
    };

    return (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3>Lagna Chart</h3>
            <svg viewBox="0 0 400 400" width="100%" maxWidth="400px" style={{ maxHeight: '400px' }}>
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#c084fc" stopOpacity="0.5" />
                    </linearGradient>
                </defs>

                {/* Outer Box */}
                <rect x="2" y="2" width="396" height="396" fill="none" stroke="url(#lineGradient)" strokeWidth="2" />

                {/* Diagonals */}
                <line x1="0" y1="0" x2="400" y2="400" stroke="url(#lineGradient)" strokeWidth="2" />
                <line x1="400" y1="0" x2="0" y2="400" stroke="url(#lineGradient)" strokeWidth="2" />

                {/* Inner Diamond (Midpoints) */}
                <line x1="200" y1="0" x2="400" y2="200" stroke="url(#lineGradient)" strokeWidth="2" />
                <line x1="400" y1="200" x2="200" y2="400" stroke="url(#lineGradient)" strokeWidth="2" />
                <line x1="200" y1="400" x2="0" y2="200" stroke="url(#lineGradient)" strokeWidth="2" />
                <line x1="0" y1="200" x2="200" y2="0" stroke="url(#lineGradient)" strokeWidth="2" />

                {/* Render House Contents */}
                {[...Array(12)].map((_, i) => renderHouseContent(i))}
            </svg>
        </div>
    );
};

export default KundliChart;
