# Groningen AOV Z-Score Calculator

[![PWA](https://img.shields.io/badge/PWA-Ready-blue.svg)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deployment](https://img.shields.io/badge/Deployment-GitHub%20Pages-green.svg)](https://groningen-aov.github.io/)

A mobile-friendly Progressive Web App (PWA) for calculating aortic annulus diameter (AAD) Z-scores using the sophisticated Groningen GAM model. This clinical decision support tool enables healthcare providers to predict expected aortic valve dimensions and assess patient measurements in offline environments.

##  Clinical Overview

The Groningen GAM model is based on comprehensive analysis of **75,142 cardiac-healthy organ donor records** spanning from 1985 to 2016. This calculator converts complex statistical models into an accessible, mobile-optimized tool for clinical use.

### Key Clinical Features

- **Evidence-Based**: Derived from the largest aortic valve morphometry dataset available
- **Validated Predictions**: Mean AAD and standard deviation calculations with high accuracy
- **Z-Score Assessment**: Clinical interpretation of measured values relative to population norms
- **Age Range**: Supports patients from newborn (0.003 years) to 59 years
- **Offline Capability**: Works without internet connection after initial load

##  Features

### Progressive Web App
-  **Mobile Optimized**: Responsive design for tablets and smartphones
-  **Offline-First**: Full functionality without internet connection
-  **Installable**: Add to home screen on iOS and Android
-  **Fast Loading**: Cached resources for instant startup

### Clinical Workflow
-  **Simple Inputs**: Age, weight, height, sex, and measured AAD
-  **Clear Results**: Expected AAD, standard deviation, and Z-score
-  **Unit Support**: Metric and imperial measurements with real-time conversion
-  **Documentation**: Copy results for clinical records

### Privacy & Security
-  **No Data Collection**: No patient data transmitted or stored
-  **Local Processing**: All calculations performed on device
-  **Open Source**: Transparent implementation available for review

##  Quick Start

### Live Application
Access the calculator directly at: **[groningen-aov-zscore.app](https://parameterz.github.io/groningen-aov-zscore/)**

### Installation as PWA
1. Visit the application URL on your mobile device
2. Look for "Add to Home Screen" or install prompt
3. Follow browser-specific installation instructions
4. Access the app from your home screen

## 💻 Development

### Prerequisites
- Node.js 16.0.0 or higher
- Modern web browser
- Git

### Local Development
```bash
# Clone the repository
git clone https://github.com/groningen-aov/groningen-aov.github.io.git
cd groningen-aov-zscore

# Install dependencies
npm install

# Start development server
npm run dev

# Application will be available at http://localhost:3000
```

### Testing
```bash
# Run all tests
npm test

# Validate data integrity
npm run validate

# Test against R model cases
npm run test:data
```

### Build for Production
```bash
# Build optimized version
npm run build

# Files will be generated in /dist directory
```

## 📁 Project Structure

```
groningen-aov-zscore/
├── .github/workflows/          # GitHub Actions for CI/CD
│   ├── deploy.yml             # Automated deployment
│   ├── validate.yml           # Data validation tests
│   └── test.yml               # JavaScript testing
├── data/                      # Model data and metadata
│   ├── groningen_aad_lookup.json    # Lookup table (~12K points)
│   └── groningen_aad_metadata.json  # Test cases and validation
├── js/                        # Application logic
│   ├── app.js                 # Core calculation engine
│   ├── results-calculator.js  # Results page logic
│   └── version.js             # Version management
├── style/                     # Styling and UI
│   ├── pico.blue.min.css      # Pico CSS framework
│   └── style.css              # Custom styles
├── icons/                     # PWA icons (various sizes)
├── test/                      # Test pages and validation
├── about/                     # Documentation pages
├── sw.js                      # Service worker (offline support)
├── manifest.json              # PWA configuration
└── index.html                 # Main application interface
```

## Clinical Validation

### Test Cases
The calculator is validated against 8 comprehensive test cases covering the full age and size spectrum:

- **Newborn**: 1 day old, 3kg, 50cm, female → AAD: 5.978mm, SD: 0.924
- **Toddler**: 2yo, 12kg, 85cm, male → AAD: 11.491mm, SD: 1.134
- **Child**: 10yo, 35kg, 140cm, female → AAD: 15.544mm, SD: 1.454
- **Teenager**: 16yo, 65kg, 175cm, male → AAD: 19.999mm, SD: 1.725
- **Adult**: 25yo, 55kg, 165cm, female → AAD: 19.568mm, SD: 1.673
- **Older Adult**: 55yo, 90kg, 180cm, male → AAD: 24.918mm, SD: 1.739

### Accuracy Standards
- ✅ All test cases pass with <0.01mm tolerance
- ✅ 100% accuracy versus original R GAM model
- ✅ Trilinear interpolation for precise predictions
- ✅ Comprehensive input validation

## Technical Details

### Architecture
- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework overhead)
- **PWA Features**: Service Worker, Web App Manifest, offline-first design
- **Data Processing**: JSON lookup tables with trilinear interpolation
- **Deployment**: GitHub Pages via GitHub Actions

### Model Implementation
The calculator implements the Groningen GAM model using:
- **Variable Transformations**: `log(age+1)`, `log(weight)`, `sqrt(height)`
- **Trilinear Interpolation**: Precise calculation between data points
- **Input Validation**: Age (0-59 years), Weight (1.34-352 kg), Height (30-236 cm)
- **Error Handling**: Comprehensive bounds checking and user feedback

### Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile**: iOS 12+, Android 8+
- **PWA Support**: Full offline functionality where supported

## Deployment

### GitHub Pages (Automated)
The application automatically deploys to GitHub Pages when changes are pushed to the main branch:

1. **GitHub Actions** validates data and runs tests
2. **Automated build** creates optimized assets
3. **Deployment** updates the live application
4. **Available at**: `https://groningen-aov.github.io/`

### Self-Hosting
```bash
# Build the application
npm run build

# Serve the /dist directory using any static web server
# Examples:
npx http-server dist
python -m http.server 8000 -d dist
```

## 📊 Performance

- **Load Time**: <2 seconds on 3G networks
- **Bundle Size**: <1MB total download
- **Calculation Speed**: <100ms response time
- **Offline**: Full functionality without network after initial load

## 🤝 Contributing

### Development Process
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards
- JavaScript ES6+ features
- Mobile-first responsive design
- Comprehensive input validation
- Accessibility compliance (WCAG 2.1)
- Test coverage for all calculations

### Testing Requirements
- All new features must include tests
- Calculations must validate against R model
- PWA functionality must work offline
- Accessibility standards must be maintained

## 📋 Clinical Disclaimer

**⚠️ For clinical decision support only. Always verify results with institutional protocols and consider individual patient factors when making clinical decisions.**

This tool is designed to assist healthcare providers but should not replace clinical judgment or institutional guidelines. The calculations are based on population statistics and may not account for individual anatomical variations or specific clinical conditions.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 groningen-aov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## 📚 References

### Model Development
The Groningen GAM model is based on comprehensive analysis of cardiac-healthy organ donor records. The original research provides the statistical foundation for this clinical tool.

### External Validation
Model validation was performed using the Lopez dataset (3,566 individuals under 18 years) available via the [Pediatric Heart Network](https://www.pediatricheartnetwork.org/echo-z-scores/).

## 🔗 Links

- **Live Application**: [groningen-aov-zscore.app](https://groningen-aov.github.io/)
- **Documentation**: [Project Docs](docs/)
- **Issues**: [GitHub Issues](https://github.com/groningen-aov/groningen-aov.github.io/issues)
- **Roadmap**: [Development Roadmap](docs/roadmap.md)

## 📞 Support

For technical issues, feature requests, or clinical questions:
- **GitHub Issues**: [Report technical problems](https://github.com/groningen-aov/groningen-aov.github.io/issues)

---
