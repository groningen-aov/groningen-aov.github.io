// ===== GLOBAL STATE =====
let lookupData = null;
let isModelLoaded = false;

// ===== DOM ELEMENTS =====
const statusIndicator = document.getElementById("statusIndicator");
const statusText = document.getElementById("statusText");
const status = document.getElementById("status");
const calculatorForm = document.getElementById("calculatorForm");
const calculateBtn = document.getElementById("calculateBtn");
const results = document.getElementById("resultsSection"); // Fixed: matches HTML id
const errorMessage = document.getElementById("errorMessage");
const errorText = document.getElementById("errorText");

// Result elements - Fixed to match current HTML
const resultMean = document.getElementById("meanAAD"); // Fixed: matches HTML id
const resultSD = document.getElementById("stdDev"); // Fixed: matches HTML id
const measuredAAD = document.getElementById("measuredAAD");
const zScoreValue = document.getElementById("zScoreValue");
const zInterpretation = document.getElementById("zInterpretation");

// ===== UTILITY FUNCTIONS =====

/**
 * Find the lower index for interpolation
 * Equivalent to R's findInterval function
 * R returns 1-based indices, we need to convert to 0-based
 */
function findLowerIndex(vec, q) {
  const n = vec.length;

  // R logic: ifelse(q <= vec[1], 1, ifelse(q >= vec[n], n - 1, findInterval(q, vec)))
  // Convert to 0-based indexing
  if (q <= vec[0]) return 0; // R returns 1, we return 0
  if (q >= vec[n - 1]) return n - 2; // R returns n-1, we return n-2

  // Use binary search to find interval (equivalent to R's findInterval)
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
 * Trilinear interpolation function
 * Ported from Gerton's R implementation with correct indexing
 */
function trilinearInterp(x, y, z, flatValues, xq, yq, zq, sq) {
  // Array dimensions from R: dim=c(length(x), length(y), length(z), 2)
  const nX = x.length;
  const nY = y.length;
  const nZ = z.length;
  const nS = 2; // Male/Female

  // R array indexing: values[i, j, k, m] where m = sq + 1
  // Convert to flat array indexing matching R's column-major order
  const getValue = (i, j, k, s) => {
    // R uses 1-based indexing and m = sq + 1, we use 0-based
    // R array layout is column-major: [i + j*nX + k*nX*nY + s*nX*nY*nZ]
    const index = i + j * nX + k * nX * nY + s * nX * nY * nZ;
    return flatValues[index];
  };

  // Find interpolation indices (0-based)
  const i = findLowerIndex(x, xq);
  const j = findLowerIndex(y, yq);
  const k = findLowerIndex(z, zq);
  const s = sq; // Sex: 0=male, 1=female (already 0-based)

  // Bounds checking
  const i1 = Math.min(i + 1, nX - 1);
  const j1 = Math.min(j + 1, nY - 1);
  const k1 = Math.min(k + 1, nZ - 1);

  // Get interpolation bounds
  const x0 = x[i],
    x1 = x[i1];
  const y0 = y[j],
    y1 = y[j1];
  const z0 = z[k],
    z1 = z[k1];

  // Calculate interpolation weights
  const xd = x1 - x0 !== 0 ? (xq - x0) / (x1 - x0) : 0;
  const yd = y1 - y0 !== 0 ? (yq - y0) / (y1 - y0) : 0;
  const zd = z1 - z0 !== 0 ? (zq - z0) / (z1 - z0) : 0;

  // Get the 8 corner values for trilinear interpolation
  const c000 = getValue(i, j, k, s);
  const c100 = getValue(i1, j, k, s);
  const c010 = getValue(i, j1, k, s);
  const c110 = getValue(i1, j1, k, s);
  const c001 = getValue(i, j, k1, s);
  const c101 = getValue(i1, j, k1, s);
  const c011 = getValue(i, j1, k1, s);
  const c111 = getValue(i1, j1, k1, s);

  // Perform trilinear interpolation
  const c00 = c000 * (1 - xd) + c100 * xd;
  const c10 = c010 * (1 - xd) + c110 * xd;
  const c01 = c001 * (1 - xd) + c101 * xd;
  const c11 = c011 * (1 - xd) + c111 * xd;

  const c0 = c00 * (1 - yd) + c10 * yd;
  const c1 = c01 * (1 - yd) + c11 * yd;

  const result = c0 * (1 - zd) + c1 * zd;

  return result;
}

/**
 * Calculate AOV predictions using the Groningen model
 */
function calculateAOVPrediction(age, weight, height, sex) {
  if (!isModelLoaded) {
    throw new Error("Model not loaded");
  }

  // Input transformations (same as R model)
  const logWeight = Math.log(weight);
  const sqrtHeight = Math.sqrt(height);
  const logAge = Math.log(age + 1);
  
  // Convert sex string to number: Fixed to handle "male"/"female"
  const sexValue = sex === "male" ? 0 : 1;

  // Get grid axes
  const { log_weight, sqrt_height, log_age_plus_1 } = lookupData.grid_axes;
  const { mean_aad, std_dev } = lookupData.predictions;

  // Debug logging for first test case
  if (age === 40 && weight === 70 && height === 170 && sexValue === 0) {
    console.log("Debug for Gerton's example:");
    console.log("Transformed inputs:", {
      logWeight,
      sqrtHeight,
      logAge,
      sexValue,
    });
    console.log("Grid ranges:");
    console.log(
      "  log_weight:",
      Math.min(...log_weight),
      "to",
      Math.max(...log_weight)
    );
    console.log(
      "  sqrt_height:",
      Math.min(...sqrt_height),
      "to",
      Math.max(...sqrt_height)
    );
    console.log(
      "  log_age:",
      Math.min(...log_age_plus_1),
      "to",
      Math.max(...log_age_plus_1)
    );
  }

  // Interpolate mean AAD
  const meanAAD = trilinearInterp(
    log_weight,
    sqrt_height,
    log_age_plus_1,
    mean_aad,
    logWeight,
    sqrtHeight,
    logAge,
    sexValue
  );

  // Interpolate standard deviation
  const sdAAD = trilinearInterp(
    log_weight,
    sqrt_height,
    log_age_plus_1,
    std_dev,
    logWeight,
    sqrtHeight,
    logAge,
    sexValue
  );

  return {
    meanAAD: meanAAD,
    sdAAD: sdAAD,
    lowerBound: meanAAD - 2 * sdAAD,
    upperBound: meanAAD + 2 * sdAAD,
  };
}

/**
 * Calculate Z-score for a measured value
 */
function calculateZScore(measuredValue, meanAAD, sdAAD) {
  return (measuredValue - meanAAD) / sdAAD;
}

/**
 * Validate input values
 */
function validateInputs(age, weight, height, sex) {
  const errors = [];

  // Age validation
  if (age < 0 || age > 59) {
    errors.push("Age must be between 0 and 59 years");
  }

  // Weight validation
  if (weight < 1.34 || weight > 352.27) {
    errors.push("Weight must be between 1.34 and 352.27 kg");
  }

  // Height validation
  if (height < 30.48 || height > 236.22) {
    errors.push("Height must be between 30.48 and 236.22 cm");
  }

  // Sex validation - Fixed to handle "male"/"female"
  if (sex !== "male" && sex !== "female") {
    errors.push("Please select a sex");
  }

  return errors;
}

/**
 * Update status display
 */
function updateStatus(state, text) {
  status.className = `status ${state}`;
  statusText.textContent = text;
}

/**
 * Show error message
 */
function showError(message) {
  errorText.textContent = message;
  errorMessage.style.display = "block";
  results.setAttribute('aria-hidden', 'true'); // Fixed: use aria-hidden instead of style.display
}

/**
 * Hide error message
 */
function hideError() {
  errorMessage.style.display = "none";
}

/**
 * Load the lookup data
 */
async function loadLookupData() {
  try {
    updateStatus("loading", "Loading model data...");

    const response = await fetch("../data/groningen_aad_lookup.json");
    if (!response.ok) {
      throw new Error(`Failed to load model data: ${response.status}`);
    }

    lookupData = await response.json();
    isModelLoaded = true;

    updateStatus("ready", "Model ready");
    if (calculateBtn) calculateBtn.disabled = false;

    console.log("Model loaded successfully");
    console.log("Grid dimensions:", lookupData.dimensions);
    console.log("Data points:", lookupData.predictions.mean_aad.length);
  } catch (error) {
    console.error("Error loading model:", error);
    updateStatus("error", "Failed to load model");
    showError("Failed to load the calculation model. Please refresh the page.");
  }
}

/**
 * Handle form submission (now mainly for validation feedback and touch target)
 */
function handleCalculation(event) {
  if (event) event.preventDefault();
  hideError();

  // Get form values
  const age = parseFloat(document.getElementById("age").value);
  const weight = parseFloat(document.getElementById("weight").value);
  const height = parseFloat(document.getElementById("height").value);
  const sex = document.getElementById("sex").value;

  // Validate inputs and show any errors
  const errors = validateInputs(age, weight, height, sex);
  if (errors.length > 0) {
    showError(errors.join(". "));
    return;
  }

  // If validation passes, trigger calculation (which may already be done by real-time)
  checkAndCalculateRealTime();
}

/**
 * Handle Z-score calculation
 */
function handleZScoreCalculation() {
  const measured = parseFloat(measuredAAD.value);
  const zScoreField = document.querySelector(".z-score-field");

  if (!measured || !window.currentPrediction) {
    zScoreValue.textContent = "--";
    if (zScoreField) zScoreField.classList.remove("has-value");
    return;
  }

  const zScore = calculateZScore(
    measured,
    window.currentPrediction.meanAAD,
    window.currentPrediction.sdAAD
  );

  // Display Z-score
  zScoreValue.textContent = zScore.toFixed(2);
  if (zScoreField) zScoreField.classList.add("has-value");
}

/**
 * Check if all required inputs are valid and trigger real-time calculation
 * Updated to work with enhanced form
 */
function checkAndCalculateRealTime() {
  // Don't calculate if model isn't loaded yet
  if (!isModelLoaded) return;

  hideError(); // Clear any previous errors

  // NEW: Get values from enhanced form if available, fall back to old method
  let age, weight, height, sex;
  
  if (typeof window.getFormValues === 'function') {
    // Enhanced form is loaded - get canonical values
    const formValues = window.getFormValues();
    age = formValues.age;
    weight = formValues.weight;
    height = formValues.height;
    sex = formValues.sex;
  } else {
    // Fallback to original method for backward compatibility
    age = parseFloat(document.getElementById("age").value);
    weight = parseFloat(document.getElementById("weight").value);
    height = parseFloat(document.getElementById("height").value);
    sex = document.getElementById("sex").value;
  }

  // Check if all required fields have values
  if (!sex || isNaN(age) || isNaN(weight) || isNaN(height)) {
    results.setAttribute('aria-hidden', 'true');
    return;
  }

  // Validate inputs (rest of function unchanged)
  const errors = validateInputs(age, weight, height, sex);
  if (errors.length > 0) {
    results.setAttribute('aria-hidden', 'true');
    return;
  }

  try {
    // Calculate prediction (unchanged)
    const prediction = calculateAOVPrediction(age, weight, height, sex);

    // Display results (unchanged)
    if (resultMean) resultMean.textContent = prediction.meanAAD.toFixed(2);
    if (resultSD) resultSD.textContent = prediction.sdAAD.toFixed(2);
    
    // Populate the normal range (+/- 2SD) (unchanged)
    const normalRangeElement = document.getElementById("normalRange");
    if (normalRangeElement) {
      normalRangeElement.textContent = `${prediction.lowerBound.toFixed(1)} - ${prediction.upperBound.toFixed(1)}`;
    }

    // Show results (unchanged)
    results.setAttribute('aria-hidden', 'false');

    // Store current prediction for Z-score calculations (unchanged)
    window.currentPrediction = prediction;

    // Check if there's a measured value and calculate Z-score (unchanged)
    const measured = parseFloat(measuredAAD.value);
    if (measured && !isNaN(measured)) {
      handleZScoreCalculation();
    } else {
      // Reset Z-score display
      zScoreValue.textContent = "--";
      const zScoreField = document.querySelector(".z-score-field");
      if (zScoreField) zScoreField.classList.remove("has-value");
    }
  } catch (error) {
    console.error("Real-time calculation error:", error);
    results.setAttribute('aria-hidden', 'true');
  }
}/**
 * Debounced version of real-time calculation to avoid excessive computation
 */
let calculateTimeout;
function debouncedCalculate() {
  clearTimeout(calculateTimeout);
  calculateTimeout = setTimeout(checkAndCalculateRealTime, 300); // 300ms delay
}

// ===== EVENT LISTENERS =====
document.addEventListener("DOMContentLoaded", function () {
  // Load the model data on page load
  loadLookupData();

  // Form submission (now acts as backup/confirmation)
  if (calculatorForm) {
    calculatorForm.addEventListener("submit", handleCalculation);
  }

  // Z-score calculation on measured AAD input
if (measuredAAD) {
    measuredAAD.addEventListener("input", function () {
      try {
        const measuredValue = this.value.trim();

        if (measuredValue && window.currentPrediction) {
          handleZScoreCalculation();
        } else {
          // Clear Z-score display when field is empty
          zScoreValue.textContent = "--";
          const zScoreField = document.querySelector(".z-score-field");
          if (zScoreField) zScoreField.classList.remove("has-value");
        }
      } catch (error) {
        console.error("Z-score calculation error:", error);
      }
    });
  }

  // Real-time input validation (clear errors as user types)
  const allInputs = document.querySelectorAll('input[type="number"], select');
  allInputs.forEach((input) => {
    input.addEventListener("input", function () {
      hideError();
    });
  });

  // Auto-scroll functionality when user finishes entering measured AAD
  if (measuredAAD && results) {
    // Auto-scroll when user finishes entering the measured AAD
    measuredAAD.addEventListener('blur', function() {
      // Only scroll if there's a value and results are visible
      if (this.value && results.getAttribute('aria-hidden') === 'false') {
        setTimeout(() => {
          results.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 100);
      }
    });

    // Also trigger on Enter key press
    measuredAAD.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        this.blur();
      }
    });
  }
});

// ===== TESTING FUNCTIONS =====

/**
 * Run test cases for validation
 */
async function runTestCases() {
  if (!isModelLoaded) {
    alert("Model not loaded yet");
    return;
  }

  // Test cases from the R model metadata
  const testCases = [
    {
      description: "Gerton's example - 40yo male, 70kg, 170cm",
      age: 40,
      weight: 70,
      height: 170,
      sex: "male", // Fixed: use "male" instead of 0
      expectedAAD: 22.908,
      expectedSD: 1.75,
    },
    {
      description: "Newborn - 1 day old, 3kg, 50cm, female",
      age: 0.003,
      weight: 3,
      height: 50,
      sex: "female", // Fixed: use "female" instead of 1
      expectedAAD: 5.978,
      expectedSD: 0.924,
    },
    {
      description: "Toddler - 2yo, 12kg, 85cm, male",
      age: 2,
      weight: 12,
      height: 85,
      sex: "male", // Fixed: use "male" instead of 0
      expectedAAD: 11.491,
      expectedSD: 1.134,
    },
    {
      description: "Child - 10yo, 35kg, 140cm, female",
      age: 10,
      weight: 35,
      height: 140,
      sex: "female", // Fixed: use "female" instead of 1
      expectedAAD: 15.544,
      expectedSD: 1.454,
    },
    {
      description: "Teenager - 16yo, 65kg, 175cm, male",
      age: 16,
      weight: 65,
      height: 175,
      sex: "male", // Fixed: use "male" instead of 0
      expectedAAD: 19.999,
      expectedSD: 1.725,
    },
    {
      description: "Adult female - 25yo, 55kg, 165cm",
      age: 25,
      weight: 55,
      height: 165,
      sex: "female", // Fixed: use "female" instead of 1
      expectedAAD: 19.568,
      expectedSD: 1.673,
    },
    {
      description: "Older adult - 55yo, 90kg, 180cm, male",
      age: 55,
      weight: 90,
      height: 180,
      sex: "male", // Fixed: use "male" instead of 0
      expectedAAD: 24.918,
      expectedSD: 1.739,
    },
    {
      description: "Edge case - very small adult, 50kg, 155cm, female",
      age: 30,
      weight: 50,
      height: 155,
      sex: "female", // Fixed: use "female" instead of 1
      expectedAAD: 19.229,
      expectedSD: 1.677,
    },
  ];

  console.log("Running test cases...");
  console.log("==========================================");
  let allPassed = true;

  for (const testCase of testCases) {
    try {
      const prediction = calculateAOVPrediction(
        testCase.age,
        testCase.weight,
        testCase.height,
        testCase.sex
      );

      const meanError = Math.abs(prediction.meanAAD - testCase.expectedAAD);
      const sdError = Math.abs(prediction.sdAAD - testCase.expectedSD);

      const passed = meanError < 0.01 && sdError < 0.01; // Tighter tolerance: 0.01mm

      console.log(`${testCase.description}:`);
      console.log(
        `  Expected: AAD=${testCase.expectedAAD}, SD=${testCase.expectedSD}`
      );
      console.log(
        `  Actual:   AAD=${prediction.meanAAD.toFixed(
          3
        )}, SD=${prediction.sdAAD.toFixed(3)}`
      );
      console.log(
        `  Error:    AAD=${meanError.toFixed(4)}, SD=${sdError.toFixed(4)}`
      );
      console.log(`  Status:   ${passed ? "✅ PASS" : "❌ FAIL"}`);
      console.log("");

      if (!passed) allPassed = false;
    } catch (error) {
      console.error(`❌ Test case failed: ${testCase.description}`, error);
      allPassed = false;
    }
  }

  console.log("==========================================");
  console.log(
    `Final result: ${
      allPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"
    }`
  );
  alert(
    `Test validation ${
      allPassed ? "✅ PASSED" : "❌ FAILED"
    }. Check console for details.`
  );
}

// ===== GLOBAL FUNCTIONS FOR TESTING =====
window.runTestCases = runTestCases;