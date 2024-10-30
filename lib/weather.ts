export interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    apparentTemperature: number;
    weatherCode: number;
    uvIndex: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weatherCode: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weatherCode: number[];
    uvIndexMax: number[];
    sunrise: string[];
    sunset: string[];
  };
}

export interface Location {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export const getWeatherCode = (code: number): string => {
  // WMO Weather interpretation codes (WW)
  const weatherCodes: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    95: 'Thunderstorm',
  };
  
  return weatherCodes[code] || 'Unknown';
};

export const fetchWeatherData = async (latitude: number, longitude: number): Promise<WeatherData> => {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}`
    + `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index`
    + `&hourly=temperature_2m,weather_code`
    + `&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset`
    + `&timezone=auto&forecast_days=8`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }

  const data = await response.json();
  
  // Get current date and time
  const now = new Date();
  const currentHour = now.getHours();
  
  // Find the index of the current hour in the hourly data
  const currentIndex = data.hourly.time.findIndex((time: string) => {
    const timeDate = new Date(time);
    return timeDate.getHours() >= currentHour;
  });
  
  return {
    current: {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      apparentTemperature: data.current.apparent_temperature,
      weatherCode: data.current.weather_code,
      uvIndex: data.current.uv_index,
    },
    hourly: {
      time: data.hourly.time.slice(currentIndex, currentIndex + 24),
      temperature_2m: data.hourly.temperature_2m.slice(currentIndex, currentIndex + 24),
      weatherCode: data.hourly.weather_code.slice(currentIndex, currentIndex + 24),
    },
    daily: {
      time: data.daily.time,
      temperature_2m_max: data.daily.temperature_2m_max,
      temperature_2m_min: data.daily.temperature_2m_min,
      weatherCode: data.daily.weather_code,
      uvIndexMax: data.daily.uv_index_max,
      sunrise: data.daily.sunrise,
      sunset: data.daily.sunset,
    },
  };
};

export const searchLocation = async (query: string): Promise<Location[]> => {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch location data');
  }

  const data = await response.json();
  
  return data.results?.map((result: any) => ({
    name: result.name,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude,
  })) || [];
};

export const getWeatherIcon = (code: number) => {
  // Clear
  if (code === 0) return "sun";
  // Partly cloudy
  if (code === 1 || code === 2) return "cloud-sun";
  // Overcast
  if (code === 3) return "cloud";
  // Fog
  if (code === 45 || code === 48) return "cloud-fog";
  // Drizzle
  if (code >= 51 && code <= 55) return "cloud-drizzle";
  // Rain
  if (code >= 61 && code <= 65) return "cloud-rain";
  // Snow
  if (code >= 71 && code <= 75) return "cloud-snow";
  // Thunderstorm
  if (code >= 95 && code <= 99) return "cloud-lightning";
  
  return "sun";
};

export const getUVIndexDescription = (uvIndex: number): { level: string; description: string } => {
  if (uvIndex <= 2) {
    return { 
      level: "Low", 
      description: "No protection required. You can safely stay outside."
    };
  } else if (uvIndex <= 5) {
    return { 
      level: "Moderate",
      description: "Protection required. Seek shade during midday hours."
    };
  } else if (uvIndex <= 7) {
    return { 
      level: "High",
      description: "Protection essential. Reduce time in the sun between 11am and 4pm."
    };
  } else if (uvIndex <= 10) {
    return { 
      level: "Very High",
      description: "Extra precautions needed. Try to avoid being outside during midday hours."
    };
  } else {
    return { 
      level: "Extreme",
      description: "Take all precautions. Avoid being outside during midday hours."
    };
  }
};

export const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = "Failed to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
};

export const getLocationFromCoords = async (latitude: number, longitude: number): Promise<Location> => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}`
      + `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,uv_index`
      + `&hourly=temperature_2m,weather_code`
      + `&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset`
      + `&timezone=auto&forecast_days=8`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }

    // Get city name from reverse geocoding
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&format=json`
    );

    if (!geoResponse.ok) {
      throw new Error('Failed to get location name');
    }

    const geoData = await geoResponse.json();
    const locationInfo = geoData.results?.[0] || {
      name: 'Unknown Location',
      country: 'Unknown Country'
    };

    return {
      name: locationInfo.name,
      country: locationInfo.country,
      latitude: latitude,
      longitude: longitude,
    };
  } catch (error) {
    console.error('Error in getLocationFromCoords:', error);
    throw error;
  }
}; 