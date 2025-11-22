import React, { useState, useEffect } from 'react';
import InputForm from './components/InputForm';
import KundliChart from './components/KundliChart';
import PlanetaryDetails from './components/PlanetaryDetails';
import { calculatePlanetaryPositions, initAstrology } from './utils/astrology';

function App() {
  const [kundliData, setKundliData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize astrology engine on mount
    initAstrology().catch(err => {
      console.error("Failed to initialize astrology engine:", err);
      setError("Failed to load astrology engine. Please refresh.");
    });
  }, []);

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      // formData now contains calculated timezone offset
      const data = await calculatePlanetaryPositions(
        formData.date,
        formData.time,
        formData.timezone,
        parseFloat(formData.latitude),
        parseFloat(formData.longitude)
      );
      setKundliData(data);
    } catch (err) {
      console.error("Calculation error:", err);
      setError(`Failed to calculate Kundli: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', background: 'linear-gradient(to right, #c084fc, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Mystic Kundli
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Vedic Astrology Chart Generator</p>
      </header>

      {!kundliData ? (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <InputForm onSubmit={handleFormSubmit} />
          {loading && <p style={{ textAlign: 'center', marginTop: '1rem' }}>Calculating planetary positions...</p>}
          {error && <p style={{ textAlign: 'center', color: '#ef4444', marginTop: '1rem' }}>{error}</p>}
        </div>
      ) : (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2>Your Kundli</h2>
            <button
              className="btn-primary"
              onClick={() => setKundliData(null)}
              style={{ background: 'transparent', border: '1px solid var(--accent)' }}
            >
              New Calculation
            </button>
          </div>

          <div className="grid-2">
            <KundliChart
              planets={kundliData.planets}
              houses={kundliData.houses}
              ascendant={kundliData.ascendant}
            />
            <PlanetaryDetails planets={kundliData.planets} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
