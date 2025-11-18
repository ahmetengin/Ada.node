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

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
    }

    const routeLayer = L.layerGroup();
    const fromLatLng = [route.from.coords.lat, route.from.coords.lng];
    const toLatLng = [route.to.coords.lat, route.to.coords.lng];

    const fromMarker = L.marker(fromLatLng).bindPopup(`<b>Departure:</b> ${route.from.name}`);
    const toMarker = L.marker(toLatLng).bindPopup(`<b>Arrival:</b> ${route.to.name}`);
    
    const polyline = L.polyline([fromLatLng, toLatLng], { 
        color: 'var(--color-primary)',
        weight: 3,
        opacity: 0.8,
        dashArray: '5, 10'
    });

    routeLayer.addLayer(fromMarker);
    routeLayer.addLayer(toMarker);
    routeLayer.addLayer(polyline);
    routeLayer.addTo(map);
    routeLayerRef.current = routeLayer;

    map.fitBounds([fromLatLng, toLatLng], { padding: [50, 50] });

  }, [route]);

  return (
    <div className="panel-glow p-3 flex flex-col gap-2">
      <h4 className="text-md font-semibold text-[var(--color-primary)] flex items-center gap-2">
        <Map size={18} />
        <span>Planned Route</span>
      </h4>
      <div 
        ref={mapContainerRef} 
        className="h-40 w-full rounded-md z-0"
      ></div>
    </div>
  );
};

export default MapPanel;