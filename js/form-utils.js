// form-utils.js - Pure utility functions for unit conversions

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
 * Form value getters for canonical conversion
 */
export class FormValueReader {
  constructor() {
    // Cache DOM elements for performance
    this.elements = {
      metric: document.getElementById('metric'),
      height: document.getElementById('height'),
      weight: document.getElementById('weight'),
      ageValue: document.getElementById('age-value'),
      ageUnit: document.getElementById('age-unit'),
      sex: document.getElementById('sex'),
      measuredAAD: document.getElementById('measuredAAD')
    };
  }

  /**
   * Get canonical values (cm, kg, years) from current form state
   */
  getCanonicalValues() {
    const isMetric = this.elements.metric.checked;
    const heightValue = parseFloat(this.elements.height.value) || 0;
    const weightValue = parseFloat(this.elements.weight.value) || 0;
    const ageValue = parseFloat(this.elements.ageValue.value) || 0;
    const ageUnit = this.elements.ageUnit.value;

    return {
      height: isMetric ? heightValue : Conversions.inchesToCm(heightValue),
      weight: isMetric ? weightValue : Conversions.lbsToKg(weightValue),
      age: Conversions.convertToYears(ageValue, ageUnit),
      sex: this.elements.sex.value,
      measured: parseFloat(this.elements.measuredAAD.value) || 0
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
}

/**
 * Form display updater for UI feedback
 */
export class FormDisplayUpdater {
  constructor() {
    // Cache DOM elements
    this.elements = {
      metric: document.getElementById('metric'),
      imperial: document.getElementById('imperial'),
      height: document.getElementById('height'),
      weight: document.getElementById('weight'),
      heightUnit: document.getElementById('height-unit'),
      weightUnit: document.getElementById('weight-unit'),
      heightConversion: document.getElementById('height-conversion'),
      weightConversion: document.getElementById('weight-conversion'),
      ageValue: document.getElementById('age-value'),
      ageUnit: document.getElementById('age-unit'),
      ageConversion: document.getElementById('age-conversion')
    };
  }

  /**
   * Update form units and convert existing values
   */
  updateUnits() {
    const isMetric = this.elements.metric.checked;
    const wasMetric = this.elements.heightUnit.textContent === 'cm';
    
    // Store current values before conversion
    const currentHeight = parseFloat(this.elements.height.value) || 0;
    const currentWeight = parseFloat(this.elements.weight.value) || 0;
    
    if (isMetric) {
      this.elements.height.placeholder = 'Height in cm';
      this.elements.height.min = '30';
      this.elements.height.max = '236';
      this.elements.heightUnit.textContent = 'cm';
      
      this.elements.weight.placeholder = 'Weight in kg';
      this.elements.weight.min = '1.3';
      this.elements.weight.max = '352';
      this.elements.weightUnit.textContent = 'kg';
      
      // Convert from imperial to metric if needed
      if (!wasMetric && currentHeight > 0) {
        this.elements.height.value = Conversions.inchesToCm(currentHeight).toFixed(1);
      }
      if (!wasMetric && currentWeight > 0) {
        this.elements.weight.value = Conversions.lbsToKg(currentWeight).toFixed(1);
      }
    } else {
      this.elements.height.placeholder = 'Height in inches';
      this.elements.height.min = '11.8'; // 30cm
      this.elements.height.max = '92.9';  // 236cm
      this.elements.heightUnit.textContent = 'inches';
      
      this.elements.weight.placeholder = 'Weight in lbs';
      this.elements.weight.min = '2.9';   // 1.3kg
      this.elements.weight.max = '776';   // 352kg
      this.elements.weightUnit.textContent = 'lbs';
      
      // Convert from metric to imperial if needed
      if (wasMetric && currentHeight > 0) {
        this.elements.height.value = Conversions.cmToInches(currentHeight).toFixed(1);
      }
      if (wasMetric && currentWeight > 0) {
        this.elements.weight.value = Conversions.kgToLbs(currentWeight).toFixed(1);
      }
    }
    
    this.updateConversions();
  }

  /**
   * Update conversion displays (parenthetical text)
   */
  updateConversions() {
    const isMetric = this.elements.metric.checked;
    
    // Height conversion
    if (this.elements.height.value) {
      const heightValue = parseFloat(this.elements.height.value);
      if (isMetric) {
        const inches = Conversions.cmToInches(heightValue);
        this.elements.heightConversion.textContent = `(${inches.toFixed(1)} inches)`;
      } else {
        const cm = Conversions.inchesToCm(heightValue);
        this.elements.heightConversion.textContent = `(${cm.toFixed(1)} cm)`;
      }
    } else {
      this.elements.heightConversion.textContent = '';
    }
    
    // Weight conversion
    if (this.elements.weight.value) {
      const weightValue = parseFloat(this.elements.weight.value);
      if (isMetric) {
        const lbs = Conversions.kgToLbs(weightValue);
        this.elements.weightConversion.textContent = `(${lbs.toFixed(1)} lbs)`;
      } else {
        const kg = Conversions.lbsToKg(weightValue);
        this.elements.weightConversion.textContent = `(${kg.toFixed(1)} kg)`;
      }
    } else {
      this.elements.weightConversion.textContent = '';
    }
  }

  /**
   * Update age conversion to years
   */
  updateAgeConversion() {
    const ageValue = parseFloat(this.elements.ageValue.value);
    const ageUnit = this.elements.ageUnit.value;
    
    if (ageValue && ageUnit !== 'years') {
      const years = Conversions.convertToYears(ageValue, ageUnit);
      this.elements.ageConversion.textContent = `(= ${years.toFixed(3)} years)`;
    } else {
      this.elements.ageConversion.textContent = '';
    }
  }

  /**
   * Handle age unit change with user confirmation
   */
  handleAgeUnitChange() {
    const currentValue = this.elements.ageValue.value;
    if (currentValue) {
      const keep = confirm(`Keep the value "${currentValue}" with new unit "${this.elements.ageUnit.value}"?`);
      if (!keep) {
        this.elements.ageValue.value = '';
      }
    }
    this.updateAgeConversion();
  }
}