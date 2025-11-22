import React, { useState, useEffect, useRef } from 'react';
import { searchCity, getTimezone, getTimezoneOffset } from '../utils/geocoding';
import { MapPin, Navigation, Calendar, Clock, User } from 'lucide-react';

const InputForm = ({ onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        gender: 'male',
        day: '',
        month: '',
        year: '',
        hrs: '',
        min: '',
        sec: '00',
        ampm: 'AM',
        place: '',
        latitude: '',
        longitude: '',
        timezone: ''
    });

    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const searchTimeout = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePlaceChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, place: value }));

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (value.length > 2) {
            searchTimeout.current = setTimeout(async () => {
                const results = await searchCity(value);
                setSuggestions(results);
                setShowSuggestions(true);
            }, 500);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectPlace = (place) => {
        const tz = getTimezone(place.lat, place.lon);
        setFormData(prev => ({
            ...prev,
            place: place.display_name.split(',')[0], // Just city name for display
            latitude: place.lat,
            longitude: place.lon,
            timezone: tz
        }));
        setShowSuggestions(false);
    };

    const handleCurrentLocation = () => {
        if (navigator.geolocation) {
            setLoadingLocation(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const tz = getTimezone(latitude, longitude);
                    setFormData(prev => ({
                        ...prev,
                        latitude,
                        longitude,
                        timezone: tz,
                        place: `Current Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`
                    }));
                    setLoadingLocation(false);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setLoadingLocation(false);
                    alert("Could not get location. Please enter manually.");
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    const handleNow = () => {
        const now = new Date();
        let hrs = now.getHours();
        const ampm = hrs >= 12 ? 'PM' : 'AM';
        hrs = hrs % 12;
        hrs = hrs ? hrs : 12; // the hour '0' should be '12'

        setFormData(prev => ({
            ...prev,
            day: now.getDate(),
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            hrs: hrs,
            min: now.getMinutes(),
            sec: now.getSeconds(),
            ampm: ampm
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Convert 12hr time to 24hr for calculation
        let hours = parseInt(formData.hrs);
        if (formData.ampm === 'PM' && hours !== 12) hours += 12;
        if (formData.ampm === 'AM' && hours === 12) hours = 0;

        // Calculate timezone offset
        const tzOffset = formData.timezone ? getTimezoneOffset(formData.timezone) : 5.5; // Default IST

        const submitData = {
            name: formData.name,
            date: `${formData.year}-${String(formData.month).padStart(2, '0')}-${String(formData.day).padStart(2, '0')}`,
            time: `${String(hours).padStart(2, '0')}:${String(formData.min).padStart(2, '0')}`,
            latitude: formData.latitude,
            longitude: formData.longitude,
            timezone: tzOffset
        };

        if (!submitData.latitude || !submitData.longitude) {
            alert("Please select a valid Place of Birth");
            return;
        }

        onSubmit(submitData);
    };

    return (
        <div className="glass-card">
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Get Your Kundli by Date of Birth</h2>

            <form onSubmit={handleSubmit}>
                {/* Name and Gender */}
                <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                    <div>
                        <label>Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Name"
                            required
                        />
                    </div>
                    <div>
                        <label>Gender</label>
                        <div style={{ display: 'flex', border: '1px solid var(--glass-border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                            <button
                                type="button"
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    border: 'none',
                                    background: formData.gender === 'male' ? 'var(--accent)' : 'transparent',
                                    color: formData.gender === 'male' ? 'white' : 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
                            >
                                Male
                            </button>
                            <button
                                type="button"
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    border: 'none',
                                    background: formData.gender === 'female' ? '#ec4899' : 'transparent',
                                    color: formData.gender === 'female' ? 'white' : 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
                            >
                                Female
                            </button>
                        </div>
                    </div>
                </div>

                {/* Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label>Day</label>
                        <input type="number" name="day" value={formData.day} onChange={handleChange} placeholder="DD" min="1" max="31" required />
                    </div>
                    <div>
                        <label>Month</label>
                        <input type="number" name="month" value={formData.month} onChange={handleChange} placeholder="MM" min="1" max="12" required />
                    </div>
                    <div>
                        <label>Year</label>
                        <input type="number" name="year" value={formData.year} onChange={handleChange} placeholder="YYYY" min="1900" max="2100" required />
                    </div>
                </div>

                {/* Time */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label>Hrs</label>
                        <input type="number" name="hrs" value={formData.hrs} onChange={handleChange} placeholder="HH" min="1" max="12" required />
                    </div>
                    <div>
                        <label>Min</label>
                        <input type="number" name="min" value={formData.min} onChange={handleChange} placeholder="MM" min="0" max="59" required />
                    </div>
                    <div>
                        <label>Sec</label>
                        <input type="number" name="sec" value={formData.sec} onChange={handleChange} placeholder="SS" min="0" max="59" />
                    </div>
                    <div>
                        <label>AM/PM</label>
                        <select name="ampm" value={formData.ampm} onChange={handleChange}>
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                        </select>
                    </div>
                </div>

                {/* Place of Birth */}
                <div style={{ marginBottom: '2rem', position: 'relative' }}>
                    <label>Place of Birth</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                type="text"
                                name="place"
                                value={formData.place}
                                onChange={handlePlaceChange}
                                placeholder="Enter City Name"
                                autoComplete="off"
                                required
                            />
                            {showSuggestions && suggestions.length > 0 && (
                                <ul style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '0.5rem',
                                    listStyle: 'none',
                                    padding: 0,
                                    margin: 0,
                                    zIndex: 10,
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                                }}>
                                    {suggestions.map((place, idx) => (
                                        <li
                                            key={idx}
                                            onClick={() => selectPlace(place)}
                                            style={{
                                                padding: '0.75rem',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                fontSize: '0.9rem'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            {place.display_name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                        {/* Settings button placeholder - functionality implied by advanced fields being hidden/auto */}
                        <button type="button" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--glass-border)', fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                            [+] SETTINGS
                        </button>
                        <button
                            type="button"
                            onClick={handleCurrentLocation}
                            className="btn-primary"
                            style={{ background: 'transparent', border: '1px solid var(--accent)', fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {loadingLocation ? 'Locating...' : <><Navigation size={14} /> CURRENT LOCATION</>}
                        </button>
                        <button
                            type="button"
                            onClick={handleNow}
                            className="btn-primary"
                            style={{ background: 'transparent', border: '1px solid var(--glass-border)', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                        >
                            NOW
                        </button>
                    </div>
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', background: 'linear-gradient(to right, #f97316, #ea580c)' }}>
                    SHOW KUNDLI
                </button>
            </form>
        </div>
    );
};

export default InputForm;
