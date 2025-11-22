import React from 'react';

const PlanetaryDetails = ({ planets }) => {
    // Helper to convert decimal degrees to DMS
    const toDMS = (deg) => {
        const d = Math.floor(deg);
        const m = Math.floor((deg - d) * 60);
        const s = Math.round(((deg - d) * 60 - m) * 60);
        return `${d}° ${m}' ${s}"`;
    };

    // Helper to get Rashi (Sign) name
    const getRashi = (deg) => {
        const rashis = [
            'Aries', 'Taurus', 'Gemini', 'Cancer',
            'Leo', 'Virgo', 'Libra', 'Scorpio',
            'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
        ];
        return rashis[Math.floor(deg / 30)];
    };

    return (
        <div className="glass-card" style={{ marginTop: '2rem' }}>
            <h3>Planetary Positions</h3>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Planet</th>
                            <th style={{ padding: '1rem' }}>Rashi (Sign)</th>
                            <th style={{ padding: '1rem' }}>Degree</th>
                            <th style={{ padding: '1rem' }}>Speed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {planets.map((planet, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem', fontWeight: '500' }}>{planet.name}</td>
                                <td style={{ padding: '1rem' }}>{getRashi(planet.longitude)}</td>
                                <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{toDMS(planet.longitude % 30)}</td>
                                <td style={{ padding: '1rem', color: planet.speed < 0 ? '#f87171' : 'inherit' }}>
                                    {planet.speed < 0 ? 'Retrograde' : 'Direct'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PlanetaryDetails;
