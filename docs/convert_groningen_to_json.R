# Groningen AAD Model - JSON Converter
# Converts Gerton's optimized interpolation grid to web-friendly JSON format

library(jsonlite)

# =============================================================================
# PART 1: LOAD GERTON'S DATA
# =============================================================================

# Load the interpolated model data
cat("Loading Gerton's interpolation grid...\n")
load("groningen_meanvar_model_trend_echo_adjusted_interpolated.RData")

# Verify the data loaded correctly
if (!exists("grid")) {
  stop("Error: 'grid' object not found in .RData file")
}

# Check what's in the grid object
cat("Grid object structure:\n")
str(grid)

# =============================================================================
# PART 2: EXTRACT GRID COMPONENTS
# =============================================================================

# Extract the grid axes
grid_logwt <- grid$grid_logwt       # log(weight) values
grid_sqrtht <- grid$grid_sqrtht     # sqrt(height) values  
grid_logage <- grid$grid_logage     # log(age+1) values

# Extract the prediction arrays
mean_values <- grid$grid_values_ms$mean  # Mean AAD predictions
sd_values <- grid$grid_values_ms$sd      # Standard deviation predictions

# Get dimensions
n_weight <- length(grid_logwt)
n_height <- length(grid_sqrtht)
n_age <- length(grid_logage)
n_sex <- 2  # Male (0) and Female (1)

cat(sprintf("Grid dimensions: %d weights × %d heights × %d ages × %d sexes = %d total points\n",
            n_weight, n_height, n_age, n_sex, n_weight * n_height * n_age * n_sex))

# =============================================================================
# PART 3: CREATE JSON-FRIENDLY STRUCTURE
# =============================================================================

# Convert to the structure we want for web use
lookup_data <- list(
  # Metadata
  metadata = list(
    description = "Groningen AAD prediction model - interpolation grid",
    source = "University of Groningen, Gerton Lunter et al.",
    max_z_error = 0.108,
    created_date = Sys.Date(),
    total_grid_points = n_weight * n_height * n_age * n_sex
  ),
  
  # Grid axis definitions
  grid_axes = list(
    log_weight = grid_logwt,
    sqrt_height = grid_sqrtht,
    log_age_plus_1 = grid_logage
  ),
  
  # Array dimensions for reconstruction
  dimensions = list(
    n_weight = n_weight,
    n_height = n_height, 
    n_age = n_age,
    n_sex = n_sex
  ),
  
  # The actual prediction values (flattened 4D arrays)
  predictions = list(
    mean_aad = as.vector(mean_values),
    std_dev = as.vector(sd_values)
  ),
  
  # Original range information for validation
  original_ranges = list(
    weight_kg = c(1.34, 352.27),
    height_cm = c(30.48, 236.22),
    age_years = c(0, 59),
    sex = c("Male (0)", "Female (1)")
  )
)

# =============================================================================
# PART 4: INCLUDE GERTON'S TRILINEAR INTERPOLATION FUNCTION FOR REFERENCE
# =============================================================================

# Copy of Gerton's interpolation function for documentation
trilinear_interp <- function(x, y, z, flatvalues, xq, yq, zq, sq) {
  values <- array(flatvalues, dim=c(length(x), length(y), length(z), 2))
  stopifnot(length(xq) == length(yq), length(yq) == length(zq), length(zq) == length(sq))
  
  n_queries <- length(xq)
  results <- numeric(n_queries)
  
  find_lower_index <- function(vec, q) {
    n <- length(vec)
    ifelse(q <= vec[1], 1,
           ifelse(q >= vec[n], n - 1,
                  findInterval(q, vec)))
  }
  
  i <- find_lower_index(x, xq)
  j <- find_lower_index(y, yq)
  k <- find_lower_index(z, zq)
  m <- sq + 1
  
  x0 <- x[i]; x1 <- x[i + 1]
  y0 <- y[j]; y1 <- y[j + 1]
  z0 <- z[k]; z1 <- z[k + 1]
  
  xd <- (xq - x0) / (x1 - x0)
  yd <- (yq - y0) / (y1 - y0)
  zd <- (zq - z0) / (z1 - z0)
  
  for (idx in seq_len(n_queries)) {
    ii <- i[idx]; jj <- j[idx]; kk <- k[idx]; mm <- m[idx]
    xdi <- xd[idx]; ydi <- yd[idx]; zdi <- zd[idx]
    
    c000 <- values[ii  , jj  , kk  , mm]
    c100 <- values[ii+1, jj  , kk  , mm]
    c010 <- values[ii  , jj+1, kk  , mm]
    c110 <- values[ii+1, jj+1, kk  , mm]
    c001 <- values[ii  , jj  , kk+1, mm]
    c101 <- values[ii+1, jj  , kk+1, mm]
    c011 <- values[ii  , jj+1, kk+1, mm]
    c111 <- values[ii+1, jj+1, kk+1, mm]
    
    c00 <- c000 * (1 - xdi) + c100 * xdi
    c10 <- c010 * (1 - xdi) + c110 * xdi
    c01 <- c001 * (1 - xdi) + c101 * xdi
    c11 <- c011 * (1 - xdi) + c111 * xdi
    
    c0 <- c00 * (1 - ydi) + c10 * ydi
    c1 <- c01 * (1 - ydi) + c11 * ydi
    
    results[idx] <- c0 * (1 - zdi) + c1 * zdi
  }
  
  return(results)
}

# =============================================================================
# PART 5: CREATE TEST CASES
# =============================================================================

cat("Generating test cases...\n")

# Define test cases covering various scenarios
test_cases <- data.frame(
  description = c(
    "Gerton's example - 40yo male, 70kg, 170cm", 
    "Newborn - 1 day old, 3kg, 50cm, female",
    "Toddler - 2yo, 12kg, 85cm, male", 
    "Child - 10yo, 35kg, 140cm, female",
    "Teenager - 16yo, 65kg, 175cm, male",
    "Adult female - 25yo, 55kg, 165cm",
    "Older adult - 55yo, 90kg, 180cm, male",
    "Edge case - very small adult, 50kg, 155cm, female"
  ),
  age = c(40, 0.003, 2, 10, 16, 25, 55, 30),     # years
  weight = c(70, 3, 12, 35, 65, 55, 90, 50),      # kg
  height = c(170, 50, 85, 140, 175, 165, 180, 155), # cm
  sex = c(0, 1, 0, 1, 0, 1, 0, 1),                # 0=male, 1=female
  expected_aad = NA,    # Will calculate
  expected_sd = NA,     # Will calculate
  z_score_for_aad_20 = NA  # Z-score if measured AAD = 20mm
)

# Calculate predictions for test cases
for (i in 1:nrow(test_cases)) {
  logWeight <- log(test_cases$weight[i])
  sqrtHeight <- sqrt(test_cases$height[i])
  logAge <- log(test_cases$age[i] + 1)
  sex <- test_cases$sex[i]
  
  # Calculate predicted mean and SD
  pred_mean <- trilinear_interp(grid_logwt, grid_sqrtht, grid_logage, mean_values,
                                logWeight, sqrtHeight, logAge, sex)
  pred_sd <- trilinear_interp(grid_logwt, grid_sqrtht, grid_logage, sd_values,
                              logWeight, sqrtHeight, logAge, sex)
  
  test_cases$expected_aad[i] <- round(pred_mean, 3)
  test_cases$expected_sd[i] <- round(pred_sd, 3)
  test_cases$z_score_for_aad_20[i] <- round((20 - pred_mean) / pred_sd, 3)
}

# Add test cases to the lookup data
lookup_data$test_cases <- test_cases

# =============================================================================
# PART 6: SAVE JSON FILES
# =============================================================================

cat("Saving JSON files...\n")

# Save the main lookup table
writeLines(toJSON(lookup_data, pretty = TRUE, digits = 6), "groningen_aad_lookup.json")

# Create a smaller metadata-only file for quick reference
metadata_only <- list(
  metadata = lookup_data$metadata,
  dimensions = lookup_data$dimensions,
  grid_info = list(
    n_logweight_points = length(lookup_data$grid_axes$log_weight),
    n_sqrtheight_points = length(lookup_data$grid_axes$sqrt_height),
    n_logage_points = length(lookup_data$grid_axes$log_age_plus_1),
    logweight_range = range(lookup_data$grid_axes$log_weight),
    sqrtheight_range = range(lookup_data$grid_axes$sqrt_height),
    logage_range = range(lookup_data$grid_axes$log_age_plus_1)
  ),
  test_cases = lookup_data$test_cases
)

writeLines(toJSON(metadata_only, pretty = TRUE, digits = 6), "groningen_aad_metadata.json")

# =============================================================================
# PART 7: VALIDATION & SUMMARY
# =============================================================================

cat("\n=== CONVERSION SUMMARY ===\n")
cat(sprintf("Grid dimensions: %d × %d × %d × %d = %d total values\n", 
            n_weight, n_height, n_age, n_sex, length(mean_values)))
cat(sprintf("JSON file size: %.2f MB\n", file.size("groningen_aad_lookup.json") / 1024^2))
cat(sprintf("Test cases generated: %d\n", nrow(test_cases)))

cat("\n=== TEST CASE VERIFICATION ===\n")
print(test_cases[c("description", "age", "weight", "height", "sex", "expected_aad", "expected_sd")])

cat("\n=== FILES CREATED ===\n")
cat("1. groningen_aad_lookup.json - Full lookup table with interpolation grid\n")
cat("2. groningen_aad_metadata.json - Metadata and test cases only\n")

cat("\n=== NEXT STEPS ===\n")
cat("1. Port the trilinear_interp function to JavaScript\n")
cat("2. Load the JSON in your web application\n")
cat("3. Validate against the test cases\n")
cat("4. Implement the user interface for age/weight/height input\n")

cat("\nConversion complete!\n")