// Production Data Configuration
// This file controls whether mock data should be used in different environments

export const dataConfig = {
  // Use mock data only in development
  USE_MOCK_DATA: import.meta.env.DEV,
  
  // In production, require real authentication and data
  REQUIRE_REAL_DATA: import.meta.env.PROD,
  
  // Show development indicators
  SHOW_DEV_INDICATORS: import.meta.env.DEV,
  
  // Environment-specific messages
  EMPTY_STATE_MESSAGES: {
    development: {
      title: "No listings found",
      description: "Try adjusting your filters or search criteria. In development mode, mock data is available as fallback."
    },
    production: {
      title: "No listings available yet",
      description: "Be the first to create a listing and help build our university housing community! Connect with fellow students looking for housing."
    }
  },
  
  // Data source priority
  DATA_SOURCES: import.meta.env.PROD 
    ? ['supabase'] // Production: Only real data
    : ['supabase', 'mock'] // Development: Real data first, mock as fallback
};

export const getEmptyStateConfig = () => {
  return import.meta.env.PROD 
    ? dataConfig.EMPTY_STATE_MESSAGES.production
    : dataConfig.EMPTY_STATE_MESSAGES.development;
};

export const shouldUseMockData = () => {
  return dataConfig.USE_MOCK_DATA;
};

export const shouldShowDevIndicators = () => {
  return dataConfig.SHOW_DEV_INDICATORS;
};
