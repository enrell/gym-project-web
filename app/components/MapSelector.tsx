'use client'

import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import { Icon, divIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface MapSelectorProps {
  initialLat?: number
  initialLng?: number
  onLocationSelect: (lat: number, lng: number) => void
}

interface LocationSuggestion {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

const defaultCenter = { lat: -23.5505, lng: -46.6333 } // São Paulo

const customIcon = divIcon({
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 text-red-500">
      <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
    </svg>
  `,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
})

function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const map = useMap()
  
  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    }
    map.on('click', handleClick)
    return () => {
      map.off('click', handleClick)
    }
  }, [map, onLocationSelect])

  return null
}

export default function MapSelector({ initialLat, initialLng, onLocationSelect }: MapSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const mapRef = useRef<L.Map | null>(null)
  const [position, setPosition] = useState<[number, number]>([
    initialLat ?? defaultCenter.lat,
    initialLng ?? defaultCenter.lng
  ])

  useEffect(() => {
    if (initialLat && initialLng && !isNaN(initialLat) && !isNaN(initialLng)) {
      setPosition([initialLat, initialLng])
    }
  }, [initialLat, initialLng])

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition([lat, lng])
    onLocationSelect(lat, lng)
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length > 2) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json`)
        if (!response.ok) {
          throw new Error('Failed to fetch location suggestions')
        }
        const data: LocationSuggestion[] = await response.json()
        setSuggestions(data)
        setShowSuggestions(true)
      } catch (error) {
        console.error('Error fetching location suggestions:', error)
        setSuggestions([])
        setShowSuggestions(false)
      }
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    if (suggestion && suggestion.lat && suggestion.lon) {
      const newPosition: [number, number] = [parseFloat(suggestion.lat), parseFloat(suggestion.lon)]
      setPosition(newPosition)
      onLocationSelect(newPosition[0], newPosition[1])
      if (mapRef.current) {
        mapRef.current.setView(newPosition, 13)
      }
      setSearchQuery(suggestion.display_name)
      setShowSuggestions(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search for a location..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.place_id}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                {suggestion.display_name}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="relative z-0">
        {position[0] !== null && position[1] !== null && !isNaN(position[0]) && !isNaN(position[1]) ? (
          <MapContainer 
            center={position} 
            zoom={13} 
            style={{ height: '400px', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={position} icon={customIcon} />
            <MapEvents onLocationSelect={handleLocationSelect} />
          </MapContainer>
        ) : (
          <div className="h-[400px] w-full flex items-center justify-center bg-gray-100">
            <p>Invalid location. Please select a valid location.</p>
          </div>
        )}
      </div>
    </div>
  )
}