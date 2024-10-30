'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { Search, Moon, Sun } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { searchLocation, type Location } from '@/lib/weather'
import WeatherDashboard from '@/components/weather-dashboard'
import { useTheme } from '@/lib/theme-context'
import { motion } from 'framer-motion'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [mounted, setMounted] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const { darkMode, toggleDarkMode } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setLocations([])
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const results = await searchLocation(searchQuery)
      if (results && results.length > 0) {
        setLocations(results)
      } else {
        setLocations([])
        setError('No locations found')
      }
    } catch (err) {
      setError('Failed to search location')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch()
      } else {
        setLocations([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  if (!mounted) {
    return null
  }

  if (selectedLocation) {
    return <WeatherDashboard initialLocation={selectedLocation} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-md p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">WeatherWatch</h1>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleDarkMode}
                className="text-foreground"
              >
                {darkMode ? 
                  <Sun className="h-[1.2rem] w-[1.2rem]" /> : 
                  <Moon className="h-[1.2rem] w-[1.2rem]" />
                }
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input 
                  type="text" 
                  placeholder="Search city..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-background text-foreground placeholder:text-muted-foreground"
                />
                <Button 
                  disabled={loading}
                  onClick={handleSearch}
                  className="text-primary-foreground"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {locations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="mt-2">
                    <div className="p-2 space-y-1">
                      {locations.map((location) => (
                        <Button
                          key={`${location.latitude}-${location.longitude}`}
                          variant="ghost"
                          className="w-full justify-start font-normal hover:bg-accent"
                          onClick={() => setSelectedLocation(location)}
                        >
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{location.name}</span>
                            <span className="text-sm text-muted-foreground">{location.country}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 rounded-md">
                  {error}
                </div>
              )}

              <div className="text-center text-sm text-muted-foreground">
                Try searching for "London", "New York", or "Tokyo"
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
} 