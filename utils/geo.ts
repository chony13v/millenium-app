const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

const LAT_RANGE: [number, number] = [-90, 90];
const LON_RANGE: [number, number] = [-180, 180];

const MAX_PRECISION = 12;

function validateCoordinate(value: number, min: number, max: number, label: string): void {
  if (value === null || value === undefined) {
    throw new Error(`${label} is required`);
  }
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  if (value < min || value > max) {
    throw new Error(`${label} must be between ${min} and ${max}`);
  }
}

function validatePrecision(precision: number): void {
  if (precision === null || precision === undefined) {
    throw new Error('precision is required');
  }
  if (!Number.isInteger(precision)) {
    throw new Error('precision must be an integer');
  }
  if (precision <= 0 || precision > MAX_PRECISION) {
    throw new Error(`precision must be between 1 and ${MAX_PRECISION}`);
  }
}

function encode(latitude: number, longitude: number, precision: number): string {
  let latRange: [number, number] = [...LAT_RANGE];
  let lonRange: [number, number] = [...LON_RANGE];
  let hash = '';
  let isEven = true;
  let bit = 0;
  let ch = 0;

  while (hash.length < precision) {
    if (isEven) {
      const mid = (lonRange[0] + lonRange[1]) / 2;
      if (longitude >= mid) {
        ch |= 1 << (4 - bit);
        lonRange = [mid, lonRange[1]];
      } else {
        lonRange = [lonRange[0], mid];
      }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (latitude >= mid) {
        ch |= 1 << (4 - bit);
        latRange = [mid, latRange[1]];
      } else {
        latRange = [latRange[0], mid];
      }
    }

    isEven = !isEven;

    if (bit < 4) {
      bit += 1;
    } else {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return hash;
}

/**
 * Convert latitude/longitude into a geohash string.
 */
export function toGeohash(lat: number, lon: number, precision = 7): string {
  validateCoordinate(lat, LAT_RANGE[0], LAT_RANGE[1], 'latitude');
  validateCoordinate(lon, LON_RANGE[0], LON_RANGE[1], 'longitude');
  validatePrecision(precision);

  return encode(lat, lon, precision);
}