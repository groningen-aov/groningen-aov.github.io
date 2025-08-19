/**
 * results-calculator.js
 * Lightweight calculation module specifically for results page
 * No SPA dependencies, no real-time calculations
 */

class ResultsCalculator {
  constructor() {
    this.lookupData = null;
    this.isLoaded = false;
  }

  /**
   * Load the model data
   */
  async loadModel() {
    try {
      console.log('Loading calculation model...');
      
      const response = await fetch('/data/groningen_aad_lookup.json');
      if (!response.ok) {
        throw new Error(`Failed to load model: ${response.status}`);
      }

      this.lookupData = await response.json();
      this.isLoaded = true;
      
      console.log('Model loaded successfully');
      console.log('Grid dimensions:', this.lookupData.dimensions);
      
      return true;
    } catch (error) {
      console.error('Model loading failed:', error);
      throw error;
    }
  }

  /**
   * Find lower index for interpolation
   */
  findLowerIndex(vec, q) {
    const n = vec.length;
    if (q <= vec[0]) return 0;
    if (q >= vec[n - 1]) return n - 2;
    
    // Binary search for efficiency
    let left = 0;
    let right = n - 1;
    
    while (left < right - 1) {
      const mid = Math.floor((left + right) / 2);
      if (vec[mid] <= q) {
        left = mid;
      } else {
        right = mid;
      }
    }
    
    return left;
  }

  /**
   * Trilinear interpolation (simplified from original)
   */
  trilinearInterpolation(x, y, z, flatValues, xq, yq, zq, sq) {
    const nX = x.length;
    const nY = y.length;
    const nZ = z.length;

    // Get value from flat array (matching R's column-major order)
    const getValue = (i, j, k, s) => {
      const index = i + j * nX + k * nX * nY + s * nX * nY * nZ;
      return flatValues[index];
    };

    // Find interpolation indices
    const i = this.findLowerIndex(x, xq);
    const j = this.findLowerIndex(y, yq);
    const k = this.findLowerIndex(z, zq);
    const s = sq;

    // Bounds checking
    const i1 = Math.min(i + 1, nX - 1);
    const j1 = Math.min(j + 1, nY - 1);
    const k1 = Math.min(k + 1, nZ - 1);

    // Get interpolation bounds
    const x0 = x[i], x1 = x[i1];
    const y0 = y[j], y1 = y[j1];
    const z0 = z[k], z1 = z[k1];

    // Calculate weights
    const xd = x1 - x0 !== 0 ? (xq - x0) / (x1 - x0) : 0;
    const yd = y1 - y0 !== 0 ? (yq - y0) / (y1 - y0) : 0;
    const zd = z1 - z0 !== 0 ? (zq - z0) / (z1 - z0) : 0;

    // Get 8 corner values
    const c000 = getValue(i, j, k, s);
    const c100 = getValue(i1, j, k, s);
    const c010 = getValue(i, j1, k, s);
    const c110 = getValue(i1, j1, k, s);
    const c001 = getValue(i, j, k1, s);
    const c101 = getValue(i1, j, k1, s);
    const c011 = getValue(i, j1, k1, s);
    const c111 = getValue(i1, j1, k1, s);

    // Trilinear interpolation
    const c00 = c000 * (1 - xd) + c100 * xd;
    const c10 = c010 * (1 - xd) + c110 * xd;
    const c01 = c001 * (1 - xd) + c101 * xd;
    const c11 = c011 * (1 - xd) + c111 * xd;

    const c0 = c00 * (1 - yd) + c10 * yd;
    const c1 = c01 * (1 - yd) + c11 * yd;

    return c0 * (1 - zd) + c1 * zd;
  }

  /**
   * Calculate AOV prediction
   */
  calculatePrediction(age, weight, height, sex) {
    if (!this.isLoaded) {
      throw new Error('Model not loaded');
    }

    // Input validation
    if (age <= 0 || weight <= 0 || height <= 0 || !sex) {
      throw new Error('Invalid input parameters');
    }

    // Transform inputs (same as original model)
    const logWeight = Math.log(weight);
    const sqrtHeight = Math.sqrt(height);
    const logAge = Math.log(age + 1);

    // Convert sex to number
    const sexValue = sex === "male" ? 0 : 1;

    // Get grid axes
    const xGrid = this.lookupData.grid_axes.log_weight;
    const yGrid = this.lookupData.grid_axes.sqrt_height;
    const zGrid = this.lookupData.grid_axes.log_age_plus_1;

    // Calculate mean AAD
    const meanAAD = this.trilinearInterpolation(
      xGrid, yGrid, zGrid,
      this.lookupData.predictions.mean_aad,
      logWeight, sqrtHeight, logAge, sexValue
    );

    // Calculate standard deviation
    const stdDev = this.trilinearInterpolation(
      xGrid, yGrid, zGrid,
      this.lookupData.predictions.std_dev,
      logWeight, sqrtHeight, logAge, sexValue
    );

    return {
      meanAAD: meanAAD,
      stdDev: stdDev
    };
  }

  /**
   * Calculate complete results including Z-score if measured value provided
   */
  calculateResults(age, weight, height, sex, measuredAAD = null) {
    const prediction = this.calculatePrediction(age, weight, height, sex);
    
    const result = {
      meanAAD: prediction.meanAAD,
      stdDev: prediction.stdDev,
      lowerBound: prediction.meanAAD - 2 * prediction.stdDev,
      upperBound: prediction.meanAAD + 2 * prediction.stdDev,
      zScore: null
    };

    // Calculate Z-score if measured value provided
    if (measuredAAD && measuredAAD > 0) {
      result.zScore = (measuredAAD - prediction.meanAAD) / prediction.stdDev;
    }

    return result;
  }
}

// Export for use in results page
window.ResultsCalculator = ResultsCalculator;