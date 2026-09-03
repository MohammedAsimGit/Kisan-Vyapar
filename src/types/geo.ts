export interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface PostalAddress {
  line?: string;
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface LocationReference {
  geo?: GeoPoint;
  label?: string;
  address?: PostalAddress;
}
