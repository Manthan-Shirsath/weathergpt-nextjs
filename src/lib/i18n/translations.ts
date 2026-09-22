export type SupportedLanguage = 'en' | 'mr';

export const translations = {
  en: {
    nav: {
      dashboard: "Dashboard",
      forecast: "Forecast Intelligence",
      chat: "AI Agents Hub",
      alerts: "Alerts",
      map: "Map",
    },
    common: {
      loading: "Loading...",
      error: "An error occurred",
      retry: "Retry",
      searchLocation: "Search location...",
      currentLocation: "Current Location",
      humidity: "Humidity",
      wind: "Wind",
      pressure: "Pressure",
      visibility: "Visibility",
    },
    chat: {
      placeholder: "Ask about the weather...",
      greetingTitle: "WeatherGPT",
      greetingSubtitle: "Ask me about the weather, forecasts, or agricultural advice for any location.",
      domainSelector: "Current Expert",
      suggestedPrompt1: "Will it rain tomorrow?",
      suggestedPrompt2: "Is it safe to travel?",
      suggestedPrompt3: "Any weather warnings?",
      suggestedPrompt4: "Explain today's forecast.",
    },
    domains: {
      general: "🌦 General",
      agriculture: "🌾 Agriculture",
      disaster: "🚨 Disaster",
      research: "🔬 Research",
      aviation: "✈️ Aviation",
      marine: "🌊 Marine",
      urban: "🏙 Urban",
    }
  },
  mr: {
    nav: {
      dashboard: "डॅशबोर्ड",
      forecast: "अंदाज इंटेलिजन्स",
      chat: "एआय एजंट्स हब",
      alerts: "इशारे",
      map: "नकाशा",
    },
    common: {
      loading: "लोड करत आहे...",
      error: "एक त्रुटी आली",
      retry: "पुन्हा प्रयत्न करा",
      searchLocation: "ठिकाण शोधा...",
      currentLocation: "सध्याचे ठिकाण",
      humidity: "आर्द्रता",
      wind: "वारा",
      pressure: "दाब",
      visibility: "दृश्यमानता",
    },
    chat: {
      placeholder: "हवामानाबद्दल विचारा...",
      greetingTitle: "वेदर-जीपीटी",
      greetingSubtitle: "मला कोणत्याही ठिकाणचे हवामान, अंदाज किंवा शेतीविषयक सल्ला विचारा.",
      domainSelector: "सध्याचे तज्ञ",
      suggestedPrompt1: "उद्या पाऊस पडेल का?",
      suggestedPrompt2: "प्रवास करणे सुरक्षित आहे का?",
      suggestedPrompt3: "हवामानाचे काही इशारे आहेत का?",
      suggestedPrompt4: "आजचा अंदाज समजावून सांगा.",
    },
    domains: {
      general: "🌦 सामान्य",
      agriculture: "🌾 शेती",
      disaster: "🚨 आपत्ती",
      research: "🔬 संशोधन",
      aviation: "✈️ विमानचालन",
      marine: "🌊 सागरी",
      urban: "🏙 शहरी",
    }
  }
};

export type TranslationKeys = typeof translations.en;
