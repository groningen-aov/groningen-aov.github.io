// form-integration.js - Bridge between enhanced form and existing app.js

import { FormValueReader, FormDisplayUpdater } from './form-utils.js';

/**
 * Enhanced Form Controller
 * Integrates the new form with existing app.js calculation logic
 */
class EnhancedFormController {
  constructor() {
    this.valueReader = new FormValueReader();
    this.displayUpdater = new FormDisplayUpdater();
    this.calculateTimeout = null;
    
    this.init();
  }

  /**
   * Initialize the form controller
   */
  init() {
    this.setupEventListeners();
    this.setupCalculationBridge();
    this.displayUpdater.updateUnits(); // Initial setup
  }

  /**
   * Set up all form event listeners
   */
  setupEventListeners() {
    const elements = this.valueReader.elements;
    
    // Units toggle
    elements.metric.addEventListener('change', () => {
      this.displayUpdater.updateUnits();
      this.debouncedCalculate();
    });
    
    elements.imperial.addEventListener('change', () => {
      this.displayUpdater.updateUnits();
      this.debouncedCalculate();
    });
    
    // Height/Weight inputs
    elements.height.addEventListener('input', () => {
      this.displayUpdater.updateConversions();
      this.debouncedCalculate();
    });
    
    elements.weight.addEventListener('input', () => {
      this.displayUpdater.updateConversions();
      this.debouncedCalculate();
    });
    
    // Age inputs
    elements.ageValue.addEventListener('input', () => {
      this.displayUpdater.updateAgeConversion();
      this.debouncedCalculate();
    });
    
    elements.ageUnit.addEventListener('change', () => {
      this.displayUpdater.handleAgeUnitChange();
      this.debouncedCalculate();
    });
    
    // Sex dropdown
    elements.sex.addEventListener('change', () => {
      this.debouncedCalculate();
    });
  }

  /**
   * Create bridge to existing app.js calculation system
   */
  setupCalculationBridge() {
    // Expose canonical values to app.js
    window.getFormValues = () => this.valueReader.getCanonicalValues();
    
    // Expose form validation state
    window.hasRequiredFormValues = () => this.valueReader.hasRequiredValues();
  }

  /**
   * Trigger calculation with debouncing (matches existing app.js pattern)
   */
  debouncedCalculate() {
    clearTimeout(this.calculateTimeout);
    this.calculateTimeout = setTimeout(() => {
      this.triggerCalculation();
    }, 300);
  }

  /**
   * Trigger the existing calculation logic
   */
  triggerCalculation() {
    // Only trigger if the external function exists and required values are present
    if (typeof window.checkAndCalculateRealTime === 'function' && 
        this.valueReader.hasRequiredValues()) {
      window.checkAndCalculateRealTime();
    }
  }

  /**
   * Get canonical values for form submission (future use)
   */
  getSubmissionData() {
    const canonical = this.valueReader.getCanonicalValues();
    const isMetric = this.valueReader.elements.metric.checked;
    
    return {
      // Canonical values for calculation
      canonical,
      // Original form state for URL/form submission
      formState: {
        sex: canonical.sex,
        heightValue: this.valueReader.elements.height.value,
        weightValue: this.valueReader.elements.weight.value,
        ageValue: this.valueReader.elements.ageValue.value,
        ageUnit: this.valueReader.elements.ageUnit.value,
        units: isMetric ? 'metric' : 'imperial',
        measured: canonical.measured
      }
    };
  }
}

/**
 * Initialize when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  // Wait a moment to ensure app.js has loaded
  setTimeout(() => {
    new EnhancedFormController();
    console.log('Enhanced form initialized');
  }, 100);
});