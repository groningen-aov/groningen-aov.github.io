AOV Calculator: Form Submission Architecture
Summary of Decisions
Architecture Change: Move from real-time calculation to form submission → dedicated results page
Key Benefits:

✅ Solves mobile scrolling issue completely
✅ Results feel more "official" for clinical decisions
✅ Shareable URLs for specific calculations
✅ Better for documentation/printing
✅ Pre-filled form below for easy adjustments

Implementation Outline
1. Unit System Design

Height/Weight: User choice (metric/imperial) with real-time conversions
AAD input/results: Always metric (mm) - no conversion offered
URL parameter: Single units=metric|imperial
Imperial heights: Decimal inches only (no feet+inches complexity)
Conversions shown: Parenthetically next to inputs

2. Form Structure (index.html)
html<form action="results.html" method="GET">
  <!-- Units toggle radio buttons -->
  <!-- Sex (dropdown) → Age → Height → Weight → AAD (all numeric) -->
  <!-- Real-time unit conversions via JavaScript -->
</form>
Field Order: Sex first, then all numeric fields (better tab flow)
3. URL Parameters
Clean, minimal approach:
results.html?sex=male&age=40&height=170&weight=70&measured=22.5&units=metric
4. Results Page (results.html)
Layout:

Header
Results cards (Z-score emphasized, Expected AAD, Normal Range)
Clinical interpretation
Pre-filled form with all previous values
Documentation buttons

Features:

Read URL params to populate results & form
Same calculation logic (convert to metric internally)
Display in user's preferred units

5. Documentation Features
Copy to Clipboard: Formatted text with patient data + results
Print Version: Opens optimized page with complete documentation
6. Conversion Functions
javascript// Simple utility functions
kgToLbs(kg) / lbsToKg(lbs)
cmToInches(cm) / inchesToCm(inches)
7. Implementation Steps

Create results.html with mockup structure
Add URL parameter reading JavaScript
Port calculation logic to results page
Update index.html form with action/method
Add unit toggle and real-time conversions
Implement copy/print functionality
Test URL routing and back button behavior

8. Technical Notes

All calculation stays in metric internally
Browser handles back button naturally
Static site routing (no server needed)
PWA features remain compatible
Print CSS hides adjustment form

Key Files:

index.html - Input form with unit toggles
results.html - Results display + pre-filled form
app.js - Calculation logic (shared or duplicated)
conversions.js - Unit conversion utilities

This gives you a complete roadmap for the prototype!