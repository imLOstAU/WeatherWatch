'use client'

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import { Moon, Sun, Search, Droplets, Wind, ThermometerSun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  fetchWeatherData, 
  searchLocation, 
  getWeatherCode, 
  getWeatherIcon, 
  getUVIndexDescription,
  type WeatherData, 
  type Location,
  getLocationFromCoords
} from '@/lib/weather'
import { useTheme } from '@/lib/theme-context'
import { cn } from '@/lib/utils'
import { LoadingScreen } from "@/components/ui/loading"
import { useClickOutside } from '@/hooks/use-click-outside'
import { motion } from 'framer-motion'

interface WeatherDashboardProps {
  initialLocation: Location;
}

export default function WeatherDashboard({ initialLocation }: WeatherDashboardProps) {
  const [unit, setUnit] = useState('C')
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { darkMode, toggleDarkMode } = useTheme()
  const [locations, setLocations] = useState<Location[]>([])
  const [showLocations, setShowLocations] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useClickOutside(searchContainerRef, () => setShowLocations(false))

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      handleLocationSelect(initialLocation)
    }
  }, [mounted, initialLocation])

  const handleLocationSelect = async (selectedLocation: Location) => {
    setLocation(selectedLocation)
    setLoading(true)
    setError(null)
    
    try {
      const data = await fetchWeatherData(selectedLocation.latitude, selectedLocation.longitude)
      setWeatherData(data)
    } catch (err) {
      setError('Failed to fetch weather data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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
        setShowLocations(true)
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

  const toggleUnit = () => {
    setUnit(unit === 'C' ? 'F' : 'C')
  }

  const convertTemp = (temp: number): number => {
    return unit === 'F' ? (temp * 9/5) + 32 : temp
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      hour12: true,
    })
  }

  const formatDay = (dateString: string, format: 'short' | 'long' = 'short') => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: format,
      timeZone: 'UTC'
    })
  }

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "sun": return <Sun className="h-full w-full text-yellow-500" />
      case "cloud-sun": return <CloudSun className="h-full w-full text-gray-500" />
      case "cloud": return <Cloud className="h-full w-full text-gray-500" />
      case "cloud-fog": return <CloudFog className="h-full w-full text-gray-500" />
      case "cloud-drizzle": return <CloudDrizzle className="h-full w-full text-blue-500" />
      case "cloud-rain": return <CloudRain className="h-full w-full text-blue-500" />
      case "cloud-snow": return <CloudSnow className="h-full w-full text-blue-300" />
      case "cloud-lightning": return <CloudLightning className="h-full w-full text-yellow-600" />
      default: return <Sun className="h-full w-full text-yellow-500" />
    }
  }

  const isCurrentHour = (timeString: string) => {
    const now = new Date();
    const timeDate = new Date(timeString);
    return now.getHours() === timeDate.getHours();
  };

  const formatSunTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!mounted || !weatherData || !location) {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground text-center sm:text-left">WeatherWatch</h1>
          <div className="flex items-center space-x-4">
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
            <Button 
              variant="outline" 
              onClick={toggleUnit}
              className="text-foreground"
            >
              °{unit}
            </Button>
          </div>
        </header>

        <div className="flex flex-col sm:flex-row items-center gap-2 mb-8">
          <div className="relative w-full" ref={searchContainerRef}>
            <Input 
              type="text" 
              placeholder="Search another city..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowLocations(true)}
              className="bg-background text-foreground placeholder:text-muted-foreground w-full"
            />
            {showLocations && locations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="absolute top-full mt-1 w-full z-50 max-h-[200px] overflow-auto">
                  <div className="p-2 space-y-1">
                    {locations.map((loc) => (
                      <Button
                        key={`${loc.latitude}-${loc.longitude}`}
                        variant="ghost"
                        className="w-full justify-start font-normal hover:bg-accent"
                        onClick={() => {
                          handleLocationSelect(loc)
                          setShowLocations(false)
                          setSearchQuery('')
                        }}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{loc.name}</span>
                          <span className="text-sm text-muted-foreground">{loc.country}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
          <Button 
            onClick={() => {
              handleSearch()
              setShowLocations(true)
            }}
            disabled={loading}
            className="text-primary-foreground w-full sm:w-auto"
          >
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
        </div>

        {loading && <LoadingScreen />}

        {error && (
          <div className="mb-8 p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 rounded-md">
            {error}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Current Weather</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">{location.name}</h2>
                  <p className="text-base text-muted-foreground mb-1">{location.country}</p>
                  <p className="text-xl text-muted-foreground">
                    {getWeatherCode(weatherData.current.weatherCode)}
                  </p>
                </div>
                <div className="text-5xl font-bold">
                  {Math.round(convertTemp(weatherData.current.temperature))}°{unit}
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <Droplets className="mx-auto h-8 w-8 text-blue-500" />
                  <p className="mt-2 font-semibold">Humidity</p>
                  <p>{weatherData.current.humidity}%</p>
                </div>
                <div>
                  <Wind className="mx-auto h-8 w-8 text-green-500" />
                  <p className="mt-2 font-semibold">Wind Speed</p>
                  <p>{Math.round(weatherData.current.windSpeed)} km/h</p>
                </div>
                <div>
                  <ThermometerSun className="mx-auto h-8 w-8 text-orange-500" />
                  <p className="mt-2 font-semibold">Feels Like</p>
                  <p>{Math.round(convertTemp(weatherData.current.apparentTemperature))}°{unit}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8-Day Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                {weatherData.daily.time.map((day, index) => (
                  <div key={day} className="text-center">
                    <p className="font-semibold">
                      {formatDay(day)}
                    </p>
                    <div className="w-8 h-8 mx-auto my-2">
                      {getIconComponent(getWeatherIcon(weatherData.daily.weatherCode[index]))}
                    </div>
                    <p className="font-medium">
                      {Math.round(convertTemp(weatherData.daily.temperature_2m_max[index]))}°{unit}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(convertTemp(weatherData.daily.temperature_2m_min[index]))}°{unit}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <Tabs defaultValue="hourly">
            <TabsList>
              <TabsTrigger value="hourly">Hourly Forecast</TabsTrigger>
              <TabsTrigger value="daily">Daily Details</TabsTrigger>
            </TabsList>
            <TabsContent value="hourly">
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex overflow-x-auto hourly-scroll pb-4 -mx-6 px-6">
                    <div className="flex space-x-6">
                      {weatherData.hourly.time.slice(0, 24).map((time, index) => (
                        <div 
                          key={time} 
                          className={cn(
                            "flex-none text-center w-[60px] rounded-lg p-2 transition-colors",
                            isCurrentHour(time) && "bg-accent"
                          )}
                        >
                          <p className="font-medium text-sm">
                            {formatTime(time)}
                          </p>
                          <div className="w-6 h-6 mx-auto my-2">
                            {getIconComponent(getWeatherIcon(weatherData.hourly.weatherCode[index]))}
                          </div>
                          <p className="font-medium">
                            {Math.round(convertTemp(weatherData.hourly.temperature_2m[index]))}°{unit}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="daily">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {weatherData.daily.time.map((day, index) => (
                      <div key={day} className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8">
                            {getIconComponent(getWeatherIcon(weatherData.daily.weatherCode[index]))}
                          </div>
                          <div>
                            <p className="font-medium">
                              {formatDay(day, 'long')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {getWeatherCode(weatherData.daily.weatherCode[index])}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {Math.round(convertTemp(weatherData.daily.temperature_2m_max[index]))}°{unit}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {Math.round(convertTemp(weatherData.daily.temperature_2m_min[index]))}°{unit}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sunrise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-yellow-500" />
                <span className="text-2xl font-bold">
                  {formatSunTime(weatherData.daily.sunrise[0])}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sunset</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold">
                  {formatSunTime(weatherData.daily.sunset[0])}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>UV Index</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-2xl font-bold">{Math.round(weatherData.current.uvIndex)}</p>
                    <p className="text-muted-foreground">
                      {getUVIndexDescription(weatherData.current.uvIndex).level}
                    </p>
                  </div>
                  <div className="sm:text-right sm:max-w-[60%]">
                    <p className="text-sm text-muted-foreground">
                      {getUVIndexDescription(weatherData.current.uvIndex).description}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Next 7 Days Max UV Index</p>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    {weatherData.daily.uvIndexMax.map((uv, index) => (
                      <div
                        key={weatherData.daily.time[index]}
                        className="absolute h-full transition-all"
                        style={{
                          left: `${(index / weatherData.daily.uvIndexMax.length) * 100}%`,
                          width: `${(1 / weatherData.daily.uvIndexMax.length) * 100}%`,
                          backgroundColor: (() => {
                            if (uv <= 2) return 'rgb(74, 222, 128)';
                            if (uv <= 5) return 'rgb(250, 204, 21)';
                            if (uv <= 7) return 'rgb(249, 115, 22)';
                            if (uv <= 10) return 'rgb(239, 68, 68)';
                            return 'rgb(139, 92, 246)';
                          })(),
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground overflow-x-auto pb-2">
                    {weatherData.daily.time.map((time) => (
                      <span key={time} className="flex-shrink-0 px-1">
                        {formatDay(time, 'short')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 