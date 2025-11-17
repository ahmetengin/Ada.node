import React, { useEffect, useRef } from 'react';
import { RouteData } from '../types';
import { Map, PlaneTakeoff } from 'lucide-react';

// Since Leaflet is loaded via a script tag, we need to assert its type.
declare const L: any;

interface MapPanelProps {
  route: RouteData;
}

const MapPanel: React.FC<MapPanelProps> = ({ route }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Initialize the map
      const map = L.map(mapContainerRef.current).setView([39.0, 35.0], 5); // Center on Turkey
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      mapRef.current = map;
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !route) return;

    // Clear previous route layer if it exists
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
    }

    // Create a new layer group for the route
    const routeLayer = L.layerGroup();

    const fromLatLng = [route.from.coords.lat, route.from.coords.lng];
    const toLatLng = [route.to.coords.lat, route.to.coords.lng];

    // Add markers
    const fromMarker = L.marker(fromLatLng).bindPopup(`<b>Kalkış:</b> ${route.from.name}`);
    const toMarker = L.marker(toLatLng).bindPopup(`<b>Varış:</b> ${route.to.name}`);
    
    // Add a line for the route
    const polyline = L.polyline([fromLatLng, toLatLng], { 
        color: '#06b6d4', // cyan-500
        weight: 3,
        opacity: 0.8,
        dashArray: '5, 10'
    });

    routeLayer.addLayer(fromMarker);
    routeLayer.addLayer(toMarker);
    routeLayer.addLayer(polyline);

    // Add the new layer to the map and store a reference to it
    routeLayer.addTo(map);
    routeLayerRef.current = routeLayer;

    // Fit map to the route bounds
    map.fitBounds([fromLatLng, toLatLng], { padding: [50, 50] });

  }, [route]);

  return (
    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 flex flex-col gap-4">
      <h4 className="text-md font-semibold text-cyan-300 flex items-center gap-2">
        <Map size={18} />
        <span>Planlanan Rota</span>
      </h4>
      <div 
        ref={mapContainerRef} 
        className="h-64 w-full rounded-md z-0" // z-0 is important for leaflet
      ></div>
       <div className="flex justify-around text-center text-sm">
            <div>
                <p className="text-gray-400">Kalkış</p>
                <p className="font-bold text-lg text-white">{route.from.name}</p>
            </div>
            <div className="flex items-center text-cyan-400">
                <PlaneTakeoff size={24} />
            </div>
            <div>
                <p className="text-gray-400">Varış</p>
                <p className="font-bold text-lg text-white">{route.to.name}</p>
            </div>
        </div>
    </div>
  );
};

export default MapPanel;
