# Publication Day Citation Update Checklist

## Overview

When the Groningen AAD research article is published, this checklist ensures all calculator pages and export functions include proper citation information.

## ✅ Citation Update Locations

### Core Pages
- [ ] **`/about/index.html`** - Update full citation + BibTeX format in `#citation` section
- [ ] **`/index.html`** - Add footer citation mention (optional)
- [ ] **`/results/index.html`** - Add footer citation mention
- [ ] **`/batch/index.html`** - Add footer citation mention

### Batch Processing Functions
- [ ] **`/batch/index.html - copyTableToClipboard()`** - Add citation to copied text
- [ ] **`/batch/index.html - downloadResults()`** - Add citation to CSV file headers/metadata

### Documentation
- [ ] **`README.md`** - Update citation information
- [ ] **Any additional documentation files** - Update references

## 📝 Citation Formats Needed

### Full Citation (for About page)
```
van Melle JP, Dijkshoorn L, Grzegorczyk MA, Dyar D, Ebels T, Lunter G.
"Modeling the expected aortic annulus diameter from 75,142 donor records: 
a new standard for normalization in children and adults."
[Journal Name]. [Year];[Volume]([Issue]):[Pages].
```

### Short Citation (for footers)
```
Based on: van Melle et al. [Journal] [Year] | https://groningen-aov.github.io
```

### BibTeX Format (for About page)
```bibtex
@article{vanmelle2024aortic,
  title={Modeling the expected aortic annulus diameter from 75,142 donor records: a new standard for normalization in children and adults},
  author={van Melle, Joost P and Dijkshoorn, Leah and Grzegorczyk, Marco A and Dyar, Dan and Ebels, Tjark and Lunter, Gerton},
  journal={[Journal Name]},
  volume={[Volume]},
  number={[Issue]},
  pages={[Pages]},
  year={[Year]},
  publisher={[Publisher]}
}
```

### CSV Header Citation (for batch downloads)
```
# Groningen AAD Calculator Results
# Citation: van Melle et al. [Journal] [Year]
# Calculator: https://groningen-aov.github.io
# Generated: [timestamp]
```

## 🔍 Specific Update Instructions

### About Page (`/about/index.html`)
1. Replace bracketed placeholders in the citation blockquote
2. Update the BibTeX format with actual publication details
3. Replace the note about "citation details will be updated" with final information

### Batch Copy to Clipboard Function
Add citation header to the copied text:
```javascript
const tableText = [
  '# Citation: van Melle et al. [Journal] [Year]',
  '# Calculator: https://groningen-aov.github.io',
  rows.join('\n')
].join('\n');
```

### CSV Download Function  
Add citation to CSV file headers:
```javascript
const csvContent = [
  '# Groningen AAD Calculator Results',
  '# Citation: van Melle et al. [Journal] [Year]',
  '# Calculator: https://groningen-aov.github.io',
  csvHeaders.join(','),
  ...csvData.map(row => row.join(','))
].join('\n');
```

## 🚀 Post-Update Tasks

- [ ] **Test all citation displays** across different pages
- [ ] **Verify clipboard and CSV exports** include proper citations
- [ ] **Check mobile rendering** of citation information
- [ ] **Update any external documentation** or repository descriptions
- [ ] **Announce the publication** with proper citation information

## 📋 Notes

- Keep citation formats consistent across all locations
- Ensure DOI (if available) is included in formal citations
- Test that citations don't break existing functionality
- Consider adding publication date to calculator version display

---

**Reminder:** This is a one-time update when the research article is officially published. All citation placeholders are currently set up in the codebase and ready for these updates.