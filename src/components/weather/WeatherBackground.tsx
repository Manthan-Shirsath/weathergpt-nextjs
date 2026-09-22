"use client";

import React, { useMemo } from 'react';
import './weather-animations.css';
import { type TimeOfDay, type VisualCondition } from '@/lib/weather-visuals';

interface WeatherBackgroundProps {
  condition: string | undefined;
  timeOfDay: TimeOfDay;
}

export function WeatherBackground({ condition, timeOfDay }: WeatherBackgroundProps) {
  const visualCondition = useMemo((): VisualCondition => {
    if (!condition) return 'cloudy';
    const c = condition.toLowerCase();
    if (c.includes('storm') || c.includes('thunder')) return 'storm';
    if (c.includes('snow') || c.includes('ice') || c.includes('blizzard')) return 'snow';
    if (c.includes('fog') || c.includes('mist') || c.includes('haze')) return 'fog';
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return 'rain';
    if (c.includes('clear') || c.includes('sunny') || c.includes('sun')) return 'clear';
    return 'cloudy';
  }, [condition]);

  const gradientClass = useMemo(() => {
    if (['rain', 'storm', 'snow', 'fog'].includes(visualCondition)) {
      return `bg-gradient-${visualCondition}`;
    }
    return `bg-gradient-${visualCondition}-${timeOfDay}`;
  }, [visualCondition, timeOfDay]);

  const renderParticles = () => {
    if (visualCondition === 'rain' || visualCondition === 'storm') {
      return (
        <div className="weather-particle-overlay pointer-events-none">
          {Array.from({ length: 40 }).map((_, i) => (
            <div 
              key={`rain-${i}`} 
              className={`rain-drop animate-fall-rain${i % 3 === 0 ? '-slow' : ''}`}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.2 + Math.random() * 0.5
              }}
            />
          ))}
        </div>
      );
    }
    if (visualCondition === 'snow') {
      return (
        <div className="weather-particle-overlay pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div 
              key={`snow-${i}`} 
              className={`snow-flake animate-fall-snow${i % 2 === 0 ? '-slow' : ''}`}
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: 0.4 + Math.random() * 0.6,
                transform: `scale(${0.5 + Math.random()})`
              }}
            />
          ))}
        </div>
      );
    }
    return null;
  };

  const getBackgroundImage = () => {
    switch(visualCondition) {
      case 'clear':
        return timeOfDay === 'night' 
          ? 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1920&auto=format&fit=crop' 
          : 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?q=80&w=1920&auto=format&fit=crop'; 
      case 'cloudy':
        return 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1920&auto=format&fit=crop';
      case 'rain':
        return 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=1920&auto=format&fit=crop';
      case 'storm':
        return 'https://images.unsplash.com/photo-1605727216801-e27ce1d0ce30?q=80&w=1920&auto=format&fit=crop';
      case 'snow':
        return 'https://images.unsplash.com/photo-1478265409131-1f65c88f965c?q=80&w=1920&auto=format&fit=crop';
      case 'fog':
        return 'https://images.unsplash.com/photo-1487621167305-5d248087c724?q=80&w=1920&auto=format&fit=crop';
      default:
        return 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?q=80&w=1920&auto=format&fit=crop';
    }
  };

  const renderClouds = () => {
    if (visualCondition === 'cloudy' || visualCondition === 'fog' || visualCondition === 'rain' || visualCondition === 'storm') {
      return (
        <div className="weather-particle-overlay pointer-events-none">
          <div className="cloud-layer animate-drift-clouds" style={{ opacity: visualCondition === 'fog' ? 0.6 : 0.3 }} />
          <div className="cloud-layer animate-drift-clouds-fast" style={{ top: '-10%', left: '50%', opacity: visualCondition === 'fog' ? 0.4 : 0.15, transform: 'scale(1.5)' }} />
        </div>
      );
    }
    return null;
  };

  const renderSun = () => {
    if (visualCondition === 'clear' && timeOfDay !== 'night') {
      return (
        <div className="weather-particle-overlay flex items-center justify-center pointer-events-none">
          <div className="w-100 h-100 rounded-full bg-yellow-200/30 blur-[100px] animate-pulse-sun mix-blend-overlay" />
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`absolute inset-0 w-full h-full z-0 overflow-hidden`}>
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-1000 transform scale-105"
        style={{ backgroundImage: `url(${getBackgroundImage()})` }}
      />
      <div className={`absolute inset-0 w-full h-full transition-colors duration-1000 ${gradientClass} mix-blend-overlay opacity-80`} />
      <div className="absolute inset-0 bg-black/20" />

      {renderSun()}
      {renderClouds()}
      {renderParticles()}
    </div>
  );
}
