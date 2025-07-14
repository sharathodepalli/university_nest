interface GoogleMapsLoaderOptions {
  libraries?: string[];
  timeout?: number;
}

class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private isLoading = false;
  private isLoaded = false;
  private loadPromise: Promise<boolean> | null = null;

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  async loadGoogleMaps(options: GoogleMapsLoaderOptions = {}): Promise<boolean> {
    const { libraries = ['places'], timeout = 5000 } = options;

    // If already loaded, return true
    if (this.isLoaded && window.google?.maps?.places) {
      return true;
    }

    // If currently loading, return the existing promise
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // Start loading
    this.isLoading = true;
    this.loadPromise = this.loadScript(libraries, timeout);

    try {
      const result = await this.loadPromise;
      this.isLoaded = result;
      this.isLoading = false;
      return result;
    } catch (error) {
      this.isLoading = false;
      throw error;
    }
  }

  private async loadScript(libraries: string[], timeout: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google?.maps?.places) {
        resolve(true);
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        resolve(false);
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Wait for it to load
        const checkLoaded = () => {
          if (window.google?.maps?.places) {
            resolve(true);
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}&loading=async`;
      script.async = true;
      script.defer = true;

      // Set up timeout
      const timeoutId = setTimeout(() => {
        reject(new Error('Google Maps API loading timeout'));
      }, timeout);

      script.onload = () => {
        clearTimeout(timeoutId);
        // Wait a bit for the API to initialize
        setTimeout(() => {
          if (window.google?.maps?.places) {
            resolve(true);
          } else {
            resolve(false);
          }
        }, 100);
      };

      script.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });
  }
}

export const googleMapsLoader = GoogleMapsLoader.getInstance();