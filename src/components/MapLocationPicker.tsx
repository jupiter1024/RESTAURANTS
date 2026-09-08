import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

// Fix Leaflet marker icons in bundlers
const customIcon = L.divIcon({
  className: 'custom-map-marker',
  html: `<div style="
    background: #f97316;
    width: 32px;
    height: 32px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid #ffffff;
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="
      width: 10px;
      height: 10px;
      background: #ffffff;
      border-radius: 50%;
      transform: rotate(45deg);
    "></div>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface MapLocationPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number, addressName?: string) => void;
  height?: string;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  latitude,
  longitude,
  onChange,
  height = '300px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string>('');

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude || 30.0444, longitude || 31.2357],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([latitude || 30.0444, longitude || 31.2357], {
        icon: customIcon,
        draggable: true,
      }).addTo(map);

      // Handle marker drag
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        const lat = parseFloat(pos.lat.toFixed(6));
        const lng = parseFloat(pos.lng.toFixed(6));
        onChange(lat, lng);
        reverseGeocode(lat, lng);
      });

      // Handle map click
      map.on('click', (e: L.LeafletMouseEvent) => {
        const lat = parseFloat(e.latlng.lat.toFixed(6));
        const lng = parseFloat(e.latlng.lng.toFixed(6));
        marker.setLatLng([lat, lng]);
        onChange(lat, lng);
        reverseGeocode(lat, lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map when coordinates change externally
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (
        Math.abs(currentPos.lat - latitude) > 0.0001 ||
        Math.abs(currentPos.lng - longitude) > 0.0001
      ) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.setView([latitude, longitude], 15);
      }
    }
  }, [latitude, longitude]);

  // Reverse geocoding to display place name
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`
      );
      if (res.ok) {
        const data = (await res.json()) as { display_name?: string };
        if (data.display_name) {
          const shortName = data.display_name.split(',').slice(0, 3).join(', ');
          setDetectedAddress(shortName);
        }
      }
    } catch {
      /* ignore */
    }
  };


  // Live Location Search
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            val
          )}&limit=5`
        );
        if (res.ok) {
          const data: SearchResult[] = await res.json();
          setSearchResults(data);
          setShowResults(true);
        }
      } catch {
        /* ignore */
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectSearchResult = (result: SearchResult) => {
    const lat = parseFloat(parseFloat(result.lat).toFixed(6));
    const lng = parseFloat(parseFloat(result.lon).toFixed(6));
    const shortName = result.display_name.split(',').slice(0, 3).join(', ');

    setSearchQuery(shortName);
    setDetectedAddress(shortName);
    setShowResults(false);

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], 16);
    }

    onChange(lat, lng, shortName);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));

        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.setView([lat, lng], 16);
        }

        onChange(lat, lng);
        reverseGeocode(lat, lng);
      },
      (err) => {
        alert(`Could not fetch your location: ${err.message}`);
      }
    );
  };

  return (
    <div className="space-y-2 relative">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="🔍 Search address, area, or street (e.g. Maadi Road 9, Dokki, Nasr City)..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={() => {
                if (searchResults.length > 0) setShowResults(true);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500 placeholder:text-slate-500 shadow-inner"
            />
            {isSearching && (
              <span className="absolute right-3 top-2.5 text-xs text-orange-400 animate-spin">
                ⏳
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleUseMyLocation}
            className="px-3 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5 shrink-0"
            title="Use My Current GPS Location"
          >
            <span>🎯</span> Locate Me
          </button>
        </div>

        {/* Autocomplete Dropdown List */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[1000] overflow-hidden max-h-52 overflow-y-auto">
            {searchResults.map((item) => (
              <div
                key={item.place_id}
                onClick={() => handleSelectSearchResult(item)}
                className="p-2.5 hover:bg-orange-500/20 text-xs text-slate-200 border-b border-slate-800 last:border-0 cursor-pointer flex items-start gap-2 transition-colors"
              >
                <span className="text-orange-400 mt-0.5">📍</span>
                <span className="leading-snug">{item.display_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Map Container */}
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%' }}
        className="rounded-2xl overflow-hidden border border-slate-700 shadow-lg z-0"
      />

      {/* Coordinates & Instructions hint */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span className="flex items-center gap-1 text-slate-300">
          <span>📌</span> Click anywhere or drag pin to position
        </span>
        <span className="font-mono text-amber-400">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </span>
      </div>

      {detectedAddress && (
        <div className="text-[11px] text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 truncate">
          📍 <span className="font-semibold text-white">{detectedAddress}</span>
        </div>
      )}
    </div>
  );
};
