/**
 * Version Manager for Groningen AOV Calculator
 * Edit the version history below - add new versions to the TOP!
 */

// 👇 ADD NEW VERSIONS AT THE TOP OF THIS ARRAY! 👇
const versionHistory = [
  {
    version: '1.0.0',
    date: '2025-08-18',
    notes: 'Initial release with full functionality',
    features: [
      'deploy to Organization GitHub Pages',
      'full PWA support with service worker',
    ]
  },
  {
    version: '0.3.0',
    date: '2025-08-18',
    notes: 'simplified structure for GH pages',
    features: [
      'flattened directory structure for easier deployment',
    ]

  },
  {
    version: '0.2.5',
    date: '2025-08-12',
    notes: 'About page details',
    features: [
      'Authors updates',
      'Institutional affiliations list cleanup',
    ]
  },
  {
    version: '0.2.4',
    date: '2025-08-12',
    notes: 'added NAV, cleaned up data entry form radio buttons',
    features: [ 
      'Added NAV to include Home, About, Test links',
      'Cleaned up radio button styling to match Pico.css',
      'Removed unnecessary radio button styles',
    ]
  },
  {
    version: '0.2.3',
    date: '2025-08-12',
    notes: 'updated results and test pages, SW improvements',
    features: [
      'Results page was using H6 elements out of order, now uses strong for headings',
      'Test page now uses table striping vor easier reading',
      'Improved SW caching strategy for DEV',
    ]
  },
  {
    version: '0.2.2',
    date: '2025-08-12',
    notes: 'updated test cases', 
    features: [
      'Updated test cases to cover larger span of ages/sizes', 
    ]
  },
  {
    version: '0.2.1',
    date: '2025-08-11', 
    notes: 'Offline support for results page, improved caching',
    features: [
      'Service worker enhancements for better offline experience',
    ]
  },
  {
    version: '0.2.0',
    date: '2025-08-11', 
    notes: 'New form submission architecture with dedicated results page',
    features: [
      'Form submission → results page architecture',
      'Lightweight results-only calculator',
      'Unified form utilities for consistent behavior',
      'Clean Z-score card styling with blue outline',
      'No value changes on unit toggle (preserves user data)',
      'Enhanced PWA caching for new file structure'
    ]
  },
  {
    version: '0.1.1',
    date: '2025-08-11', 
    notes: 'Added versioning system and improved footer',
    features: [
      'Version display in footer',
      'Connection status indicator', 
      'Version history modal',
      'Improved mobile layout'
    ]
  },
  {
    version: '0.1.0',
    date: '2025-08-11',
    notes: 'Initial release with basic calculator functionality',
    features: [
      'Age, weight, height, sex inputs',
      'Z-score calculation using Groningen data',
      'Offline capability with service worker',
      'PWA installation support'
    ]
  }
];

// ================================================================================
// 🚨 DON'T EDIT BELOW THIS LINE - JUST EDIT THE VERSION HISTORY ABOVE! 🚨
// ================================================================================

class SimpleVersionManager {
  constructor() {
    this.versions = versionHistory;
    this.currentVersion = this.versions[0]; // First entry is current!
    this.init();
  }

  async init() {
    try {
      this.createFooter();
      this.displayVersion();
    } catch (error) {
      console.warn('Could not initialize version manager:', error);
      this.fallbackVersion();
    }
  }

  createFooter() {
    // Look for existing footer
    let footer = document.querySelector('footer');
    
    if (footer) {
      // Add version info to existing footer
      const versionElement = document.createElement('p');
      versionElement.innerHTML = `
        <small>
          Based on the Groningen GAM model | University of Groningen | 
          <a href="#" id="versionLink" title="Click to see version history">
            <span id="versionDisplay">Loading...</span>
          </a>
        </small>
      `;
      footer.appendChild(versionElement);
    } else {
      // Fallback: create footer if none exists
      footer = document.createElement('footer');
      footer.className = 'container';
      footer.innerHTML = `
        <small>
          <p>
            <em>For clinical decision support only. Always verify with institutional protocols.</em>
          </p>
          <p>
            Groningen AOV Calculator • 
            <a href="#" id="versionLink" title="Click to see version history">
              <span id="versionDisplay">Loading...</span>
            </a>
          </p>
        </small>
      `;
      document.body.appendChild(footer);
    }

    // Add click handler for version history
    document.getElementById('versionLink').addEventListener('click', (e) => {
      e.preventDefault();
      this.showVersionHistory();
    });
  }

  displayVersion() {
    const versionElement = document.getElementById('versionDisplay');
    if (!versionElement || !this.currentVersion) return;

    versionElement.textContent = `v${this.currentVersion.version}`;
    versionElement.title = `${this.currentVersion.notes} (${this.currentVersion.date})`;
  }


  showVersionHistory() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'version-modal';
    modal.innerHTML = `
      <div class="version-modal-content">
        <div class="version-modal-header">
          <h3>Version History</h3>
          <button class="close-btn" onclick="this.closest('.version-modal').remove()">&times;</button>
        </div>
        <div class="version-modal-body">
          ${this.generateVersionHistoryHTML()}
        </div>
      </div>
    `;

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
  }

  generateVersionHistoryHTML() {
    if (!this.versions.length) return '<p>No version history available.</p>';

    return this.versions
      .map(version => `
        <div class="version-entry ${version === this.currentVersion ? 'current' : ''}">
          <div class="version-header">
            <strong>v${version.version}</strong>
            <span class="version-date">${version.date}</span>
            ${version === this.currentVersion ? '<span class="current-tag">Current</span>' : ''}
          </div>
          <p class="version-notes">${version.notes}</p>
          ${version.features ? `
            <ul class="version-features">
              ${version.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `).join('');
  }

  fallbackVersion() {
    // Create simple footer with fallback version
    this.createFooter();
    const versionElement = document.getElementById('versionDisplay');
    if (versionElement) {
      versionElement.textContent = 'v0.1.0';
      versionElement.title = 'Version info unavailable';
    }
  }

  // Utility methods
  getCurrentVersion() {
    return this.currentVersion;
  }

  getAllVersions() {
    return this.versions;
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.versionManager = new SimpleVersionManager();
  });
} else {
  window.versionManager = new SimpleVersionManager();
}