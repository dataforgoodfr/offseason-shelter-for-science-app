export interface AppConfig {
  api: {
    baseURL: string;
    timeout: number;
    retryAttempts: number;
  };
  download: {
    chunkSize: number;
    progressUpdateInterval: number;
  };
}

// Utility function to get the API base URL
function getApiBaseUrl(): string {
  const isProduction = process.env.NODE_ENV === "production";
  
  if (isProduction) {
    return "https://us-climate-data-dispatcher.services.dataforgood.fr";
  }
  
  // Dev : return .env API_BASE_URL or default value
  return process.env.API_BASE_URL || "http://localhost:3000";
}

export const config: AppConfig = {
  api: {
    baseURL: getApiBaseUrl(),
    timeout: Number.parseInt(process.env.API_TIMEOUT || "30000", 10),
    retryAttempts: 3,
  },
  download: {
    chunkSize: Number.parseInt(process.env.CHUNK_SIZE || "1048576", 10),
    progressUpdateInterval: Number.parseInt(
      process.env.PROGRESS_UPDATE_INTERVAL || "500",
      10
    ),
  },
};

// Fonction utilitaire pour debug
export const logConfig = (): void => {
  console.log("📋 Current configuration:");
  console.log("  API Base URL:", config.api.baseURL);
  console.log("  API Timeout:", config.api.timeout);
  console.log("  Chunk Size:", config.download.chunkSize);
};
