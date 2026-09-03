export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export interface DistanceEstimate {
  origin: GeoCoordinate;
  destination: GeoCoordinate;
  distanceKilometers: number;
  durationMinutes?: number;
}

/**
 * Contract for a maps / distance provider.
 *
 * NOTE: no concrete provider is implemented yet. Sprint 0 only establishes the
 * boundary so matching and net-realization logic can depend on this interface.
 * A provider (e.g. one backed by MAPS_API_KEY) is added in a later sprint.
 */
export interface MapsService {
  getDistance(origin: GeoCoordinate, destination: GeoCoordinate): Promise<DistanceEstimate>;
}
