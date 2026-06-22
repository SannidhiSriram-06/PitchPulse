# Files That Can Be Yeeted 🚀

This document lists the files in the codebase that are currently unused and can be safely deleted without any functional or visual impact on the deployed website.

---

## 🎨 Frontend Components

### 1. `frontend/src/components/AppleFeatureBlock.jsx`
* **Reason:** This component defines a scroll-driven feature block (a mockup from an Aceternity or similar UI library). It is never imported, referenced, or rendered anywhere in the application.

### 2. `frontend/src/components/Hero1.jsx`
* **Reason:** This is an alternate landing page hero section component. The actual landing page (`LandingPage.jsx`) imports and renders `Hero11.jsx` instead, leaving `Hero1.jsx` completely unused.

### 3. `frontend/src/components/LiquidSimulation.jsx`
* **Reason:** Contains a canvas-based WebGL fluid simulation designed to show a text mask. No page or layout imports it or renders it.

### 4. `frontend/src/components/MacbookScroll.jsx`
* **Reason:** Contains an interactive MacBook opening scroll-driven animation. It is never imported or rendered by any page.

### 5. `frontend/src/components/AuthCard.jsx`
* **Reason:** This is a custom container styling for a login/signup interface. The application directly uses the standard Clerk `<SignIn />` and `<SignUp />` components in their respective pages (`SignInPage.jsx` and `SignUpPage.jsx`), making this custom card redundant.

### 6. `frontend/src/components/WatchDial.jsx`
* **Reason:** A custom radial progress dial. The application instead uses the `StorageWidget` to display hourly credits and usage levels, so this component is never imported.

### 7. `frontend/src/components/AIChatInput.jsx`
* **Reason:** A chat input component designed for interactive AI conversation. However, the current pre-meeting brief generation uses structured form settings (`BriefGeneratorPage.jsx`) and has no interactive chat interface, meaning this component is never imported.

---

## 📦 State Management & Utilities

### 8. `frontend/src/store/briefStore.js`
* **Reason:** This is a Zustand store (`useBriefStore`) defined for brief generation and history management. However, the pages and components manage their local loading/generating states internally or query the API directly via Axios without using this store. No files import or consume it.

---

## 🖼️ Static Assets

### 9. `frontend/src/assets/react.svg`
* **Reason:** The default React logo asset created by the Vite scaffold. The website does not showcase or use it anywhere.

### 10. `frontend/src/assets/vite.svg`
* **Reason:** The default Vite logo asset. Not referenced in the code.

### 11. `frontend/src/assets/hero.png`
* **Reason:** A placeholder image in the assets folder. The landing page (`LandingPage.jsx`) uses dynamic visual elements and styled divs instead of loading this image.

### 12. `frontend/public/icons.svg`
* **Reason:** An unused SVG icon sprite file in the public directory that is never referenced in `index.html` or the React codebase.

---

## 📝 Miscellaneous & Temporary Files

### 13. `fix this.md`
* **Reason:** A temporary progress log detailing resolved issues and bug tracking during development. It serves as documentation but is completely unnecessary for production and deployment.
