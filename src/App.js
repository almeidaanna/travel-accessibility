import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css'; // Import the App.css file
import defaultIconUrl from './defaultIcon.png';
import selectedIconUrl from './selectedIcon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import spotsData from './locations.json'; // Import the JSON file

// Main loction icon
const defaultIcon = L.icon({
    iconUrl: defaultIconUrl,
    shadowUrl,
    iconSize: [40, 41],
    iconAnchor: [12, 41],
    popupAnchor: [8, -41],
    shadowSize: [41, 41],
});

// Selected location icon
const selectedIcon = L.icon({
    iconUrl: selectedIconUrl,
    shadowUrl,
    iconSize: [40, 41], // Same size as default icon, just different color
    iconAnchor: [12, 41],
    popupAnchor: [8, -41],
    shadowSize: [41, 41],
});

const AccessibleSpots = () => {
    const [spots, setSpots] = useState([]);
    const [filterAccessible, setFilterAccessible] = useState(false);
    const [minRating, setMinRating] = useState(0);
    const [travelPlan, setTravelPlan] = useState([]);
    const [notification, setNotification] = useState(""); // handle notification messages
    const [showModal, setShowModal] = useState(false); // control modal visibility
    const travelPlanEndRef = useRef(null); // scroll to the end of travel plan list

    useEffect(() => {
        setSpots(spotsData); // Data from Json file. Would ideally take larger data from a database
    }, []);

    useEffect(() => {
        // Scroll to the end of the travel plan list when a new spot is added
        if (travelPlan.length > 0) {
            travelPlanEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [travelPlan]);

    const handleRatingChange = (event) => {
        setMinRating(event.target.value);
    };

    const filteredSpots = spots.filter(spot => {
        return (
            (!filterAccessible || (spot.wheelchairAccessible && spot.accessibleRestroom)) &&
            spot.accessibilityRating >= minRating
        );
    });

    const MapBounds = ({ spots }) => {
        const map = useMap();
        useEffect(() => {
            if (spots.length) {
                const bounds = L.latLngBounds(spots.map(spot => [spot.lat, spot.lng]));
                map.fitBounds(bounds);
            }
        }, [map, spots]);
        return null;
    };

    const addToTravelPlan = (spot) => {
        if (!travelPlan.some(item => item.id === spot.id)) {
            setTravelPlan([...travelPlan, spot]);
        } else {
            setNotification(`${spot.name} is already in your travel plan.`); // Set notification message

            // hide the notification after 3 seconds
            setTimeout(() => {
                setNotification("");
            }, 3000);
        }
    };

    const removeFromTravelPlan = (spot) => {
        setTravelPlan(travelPlan.filter(item => item.id !== spot.id));
    };

    // Clear the entire travel plan list
    const clearTravelPlan = () => {
        setTravelPlan([]);
    };

    // Handle "Done" button click
    const handleDoneClick = () => {
        setShowModal(true); // Show the modal
    };

    return (
        <div className="page-container">
            {/* Notification Popup */}
            {notification && (
                <div className="notification-popup">
                    {notification}
                </div>
            )}

            {/* Modal Popup */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 style={{ color: "#DE007B" }}>Travel Plan Finalisation</h2>
                        <p style={{ color: "#333" }}>
                            This would go to a page that finalises and provides a curated plan along with pdf dowload option, offering discounts and optimised itineraries based on your trip duration.
                        </p>
                        <button className="button" onClick={() => setShowModal(false)}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Banner */}
            <div className="banner">
                <h1 className="banner-title">Accessible Tourist Spots</h1>
            </div>
            
            <div style={{ display: "flex", height: "calc(100vh - 140px)" }}>
                {/* Left Sidebar will display a list of locations from the locations.json file */}
                <div className="sidebar sidebar-left">
                    <h2>Tourist Spots</h2>
                    <label>
                        <input 
                            type="checkbox" 
                            checked={filterAccessible} 
                            onChange={() => setFilterAccessible(!filterAccessible)} 
                        />
                        Show only accessible-friendly spots
                    </label>
                    <div>
                        <label>
                            Minimum Accessibility Rating:
                            <input 
                                type="number" 
                                value={minRating} 
                                min="0" 
                                max="5" 
                                step="0.1"
                                onChange={handleRatingChange}
                            />
                        </label>
                    </div>
                    <button className="button button-large" onClick={() => { setFilterAccessible(false); setMinRating(0); }}>
                        Reset Filters
                    </button>
                    <ul>
                        {filteredSpots.map(spot => (
                            <li key={spot.id} className={`spot-list ${travelPlan.some(item => item.id === spot.id) ? 'highlighted-spot' : ''}`}>
                                <h3 className="spot-title">{spot.name}</h3>
                                <p>Accessibility Rating: {spot.accessibilityRating} / 5</p>
                                <button className="button" onClick={() => addToTravelPlan(spot)}>Add to Travel Plan</button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Map */}
                <div className="map-container">
                    <MapContainer style={{ height: "80vh", width: "100%" }}>
                        <MapBounds spots={filteredSpots} />
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        {filteredSpots.map(spot => (
                            <Marker 
                                key={spot.id} 
                                position={[spot.lat, spot.lng]} 
                                icon={travelPlan.some(item => item.id === spot.id) ? selectedIcon : defaultIcon}
                                zIndexOffset={travelPlan.some(item => item.id === spot.id) ? 1000 : 0}
                            >
                                <Popup autoPan={false} autoClose={false} closeOnClick={false}>
                                    <h2>{spot.name}</h2>
                                    <p>{spot.description}</p>
                                    <p>{spot.wheelchairAccessible ? "Wheelchair Accessible" : "Not Wheelchair Accessible"}</p>
                                    <p>{spot.accessibleRestroom ? "Accessible Restroom Available" : "No Accessible Restroom"}</p>
                                    <p>Accessibility Rating: {spot.accessibilityRating} / 5</p>
                                    <p>{spot.sensoryAids ? "Sensory Aids Available" : "No Sensory Aids"}</p>
                                    <p>Parking: {spot.parkingInfo}</p>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                {/* Right Sidebar for my Travel Plan */}
                <div className="sidebar sidebar-right">
                    <h2>My Travel Plan</h2>
                    <button className="button" onClick={clearTravelPlan}>
                        Clear List
                    </button>
                    {travelPlan.length === 0 ? (
                        <p className="spot-info">
                            Add spots to your itinerary to get an estimated travel time and optimise your travel plan for the best experience.
                        </p>
                    ) : (
                        <ul>
                            {travelPlan.map(spot => (
                                <li key={spot.id} className="spot-list">
                                    <h3 className="spot-title">{spot.name}</h3>
                                    <p>Accessibility Rating: {spot.accessibilityRating} / 5</p>
                                    <button className="button" onClick={() => removeFromTravelPlan(spot)}>Remove</button>
                                </li>
                            ))}
                            <div ref={travelPlanEndRef} /> {/* scroll to the end of list */}
                        </ul>
                    )}
                    {/* Show Done button only when travel plan has items */}
                    {travelPlan.length > 0 && (
                        <button className="button button-large" onClick={handleDoneClick}>
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccessibleSpots;
