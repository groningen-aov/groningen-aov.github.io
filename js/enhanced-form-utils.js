// enhanced-form-utils.js - Consistent form behavior for both pages

/**
 * Unit conversion functions
 */
export const Conversions = {
  // Height conversions
  cmToInches: (cm) => cm / 2.54,
  inchesToCm: (inches) => inches * 2.54,
  
  // Weight conversions
  kgToLbs: (kg) => kg * 2.20462,
  lbsToKg: (lbs) => lbs / 2.20462,
  
  // Age conversions to years
  convertToYears: (value, unit) => {
    const conversions = {
      'years': 1,
      'months': 1/12,
      'weeks': 1/52.18,
      'days': 1/365.25
    };
    return value * conversions[unit];
  }
};

/**
 * Universal Form Controller
 * Works on both landing page and results page
 */
export class UniversalFormController {
  constructor() {
    this.elements = {
      // Unit toggles
      metric: document.getElementById('metric'),
      imperial: document.getElementById('imperial'),
      
      // Form inputs
      sex: document.getElementById('sex'),
      ageValue: document.getElementById('age-value'),
      ageUnit: document.getElementById('age-unit'),
      height: document.getElementById('height'),
      weight: document.getElementById('weight'),
      measuredAAD: document.getElementById('measuredAAD'),
      
      // UI elements
      heightUnitLabel: document.getElementById('height-unit-label'),
      weightUnitLabel: document.getElementById('weight-unit-label'),
      heightConversion: document.getElementById('height-conversion'),
      weightConversion: document.getElementById('weight-conversion'),
      ageConversion: document.getElementById('age-conversion')
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateUnitLabels(); // Initial setup
  }

  setupEventListeners() {
    // Unit toggle listeners
    if (this.elements.metric) {
      this.elements.metric.addEventListener('change', () => {
        this.updateUnitLabels();
        this.updateAllConversions();
      });
    }

    if (this.elements.imperial) {
      this.elements.imperial.addEventListener('change', () => {
        this.updateUnitLabels();
        this.updateAllConversions();
      });
    }

    // Input listeners for real-time conversions
    if (this.elements.height) {
      this.elements.height.addEventListener('input', () => {
        this.updateHeightConversion();
      });
    }

    if (this.elements.weight) {
      this.elements.weight.addEventListener('input', () => {
        this.updateWeightConversion();
      });
    }

    if (this.elements.ageValue) {
      this.elements.ageValue.addEventListener('input', () => {
        this.updateAgeConversion();
      });
    }

    if (this.elements.ageUnit) {
      this.elements.ageUnit.addEventListener('change', () => {
        this.updateAgeConversion();
      });
    }
  }

  isMetric() {
    return this.elements.metric && this.elements.metric.checked;
  }

  /**
   * Update unit labels and placeholders (but NOT input values)
   */
  updateUnitLabels() {
    const isMetric = this.isMetric();
    
    // Height labels
    if (this.elements.heightUnitLabel) {
      this.elements.heightUnitLabel.textContent = isMetric ? '(cm)' : '(in)';
    }
    
    if (this.elements.height) {
      this.elements.height.placeholder = isMetric ? 'Height in cm' : 'Height in inches';
      this.elements.height.min = isMetric ? '30' : '11.8';   // 30cm = 11.8in
      this.elements.height.max = isMetric ? '236' : '92.9';  // 236cm = 92.9in
    }

    // Weight labels  
    if (this.elements.weightUnitLabel) {
      this.elements.weightUnitLabel.textContent = isMetric ? '(kg)' : '(lbs)';
    }
    
    if (this.elements.weight) {
      this.elements.weight.placeholder = isMetric ? 'Weight in kg' : 'Weight in lbs';
      this.elements.weight.min = isMetric ? '1.3' : '2.9';   // 1.3kg = 2.9lbs
      this.elements.weight.max = isMetric ? '352' : '776';   // 352kg = 776lbs
    }
  }

  /**
   * Update height conversion display
   */
  updateHeightConversion() {
    if (!this.elements.height || !this.elements.heightConversion) return;

    const heightValue = parseFloat(this.elements.height.value);
    
    if (heightValue && heightValue > 0) {
      const isMetric = this.isMetric();
      
      if (isMetric) {
        // Show imperial conversion
        const inches = Conversions.cmToInches(heightValue);
        this.elements.heightConversion.textContent = `(${inches.toFixed(1)} inches)`;
      } else {
        // Show metric conversion
        const cm = Conversions.inchesToCm(heightValue);
        this.elements.heightConversion.textContent = `(${cm.toFixed(1)} cm)`;
      }
    } else {
      this.elements.heightConversion.textContent = '';
    }
  }

  /**
   * Update weight conversion display
   */
  updateWeightConversion() {
    if (!this.elements.weight || !this.elements.weightConversion) return;

    const weightValue = parseFloat(this.elements.weight.value);
    
    if (weightValue && weightValue > 0) {
      const isMetric = this.isMetric();
      
      if (isMetric) {
        // Show imperial conversion
        const lbs = Conversions.kgToLbs(weightValue);
        this.elements.weightConversion.textContent = `(${lbs.toFixed(1)} lbs)`;
      } else {
        // Show metric conversion
        const kg = Conversions.lbsToKg(weightValue);
        this.elements.weightConversion.textContent = `(${kg.toFixed(1)} kg)`;
      }
    } else {
      this.elements.weightConversion.textContent = '';
    }
  }

  /**
   * Update age conversion display
   */
  updateAgeConversion() {
    if (!this.elements.ageValue || !this.elements.ageConversion) return;

    const ageValue = parseFloat(this.elements.ageValue.value);
    const ageUnit = this.elements.ageUnit ? this.elements.ageUnit.value : 'years';
    
    if (ageValue && ageValue > 0 && ageUnit !== 'years') {
      const years = Conversions.convertToYears(ageValue, ageUnit);
      this.elements.ageConversion.textContent = `(= ${years.toFixed(3)} years)`;
    } else {
      this.elements.ageConversion.textContent = '';
    }
  }

  /**
   * Update all conversion displays
   */
  updateAllConversions() {
    this.updateHeightConversion();
    this.updateWeightConversion();
    this.updateAgeConversion();
  }

  /**
   * Get canonical values (always in metric) for calculations
   */
  getCanonicalValues() {
    const isMetric = this.isMetric();
    const heightValue = parseFloat(this.elements.height?.value) || 0;
    const weightValue = parseFloat(this.elements.weight?.value) || 0;
    const ageValue = parseFloat(this.elements.ageValue?.value) || 0;
    const ageUnit = this.elements.ageUnit?.value || 'years';

    return {
      height: isMetric ? heightValue : Conversions.inchesToCm(heightValue),
      weight: isMetric ? weightValue : Conversions.lbsToKg(weightValue),
      age: Conversions.convertToYears(ageValue, ageUnit),
      sex: this.elements.sex?.value || '',
      measuredAAD: parseFloat(this.elements.measuredAAD?.value) || null
    };
  }

  /**
   * Check if all required fields have values
   */
  hasRequiredValues() {
    const values = this.getCanonicalValues();
    return values.sex && 
           !isNaN(values.age) && values.age > 0 &&
           !isNaN(values.height) && values.height > 0 &&
           !isNaN(values.weight) && values.weight > 0;
  }

  /**
   * Populate form from URL parameters (for results page)
   */
  populateFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Set unit toggle
    const units = urlParams.get('units') || 'metric';
    if (units === 'imperial' && this.elements.imperial) {
      this.elements.imperial.checked = true;
    } else if (this.elements.metric) {
      this.elements.metric.checked = true;
    }

    // Populate form fields with original values (not converted)
    if (this.elements.sex) {
      this.elements.sex.value = urlParams.get('sex') || '';
    }
    
    if (this.elements.ageValue) {
      this.elements.ageValue.value = urlParams.get('age') || '';
    }
    
    if (this.elements.ageUnit) {
      this.elements.ageUnit.value = urlParams.get('ageUnit') || 'years';
    }
    
    if (this.elements.height) {
      this.elements.height.value = urlParams.get('height') || '';
    }
    
    if (this.elements.weight) {
      this.elements.weight.value = urlParams.get('weight') || '';
    }
    
    if (this.elements.measuredAAD) {
      this.elements.measuredAAD.value = urlParams.get('measuredAAD') || '';
    }

    // Update UI to match populated values
    this.updateUnitLabels();
    this.updateAllConversions();
  }
}

// Auto-initialize when imported
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure DOM is fully ready
  setTimeout(() => {
    window.formController = new UniversalFormController();
    
    // If we're on results page (has URL params), populate form
    if (window.location.search) {
      window.formController.populateFromURL();
    }
    
  }, 50);
});