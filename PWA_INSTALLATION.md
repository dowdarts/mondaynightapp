# PWA Installation Instructions

## Converting SVG Icon to PNG

To complete the PWA setup, you need to create PNG icon files from the provided SVG:

### Option 1: Online Converter (Easiest)
1. Open https://cloudconvert.com/svg-to-png
2. Upload `icon.svg`
3. Create two versions:
   - **icon-192.png**: Set width to 192px, height to 192px
   - **icon-512.png**: Set width to 512px, height to 512px
4. Download both files and place them in the root folder (`c:\Users\cgcda\MonAvgApp\`)

### Option 2: Using ImageMagick (Command Line)
If you have ImageMagick installed:
```powershell
magick convert icon.svg -resize 192x192 icon-192.png
magick convert icon.svg -resize 512x512 icon-512.png
```

### Option 3: Using Inkscape (Free Software)
1. Download Inkscape from https://inkscape.org/
2. Open `icon.svg`
3. File → Export PNG Image
4. Set width/height to 192 and export as `icon-192.png`
5. Repeat with 512 and export as `icon-512.png`

---

## Installing the App on Your Phone

### Android (Chrome/Edge)
1. Open Chrome or Edge browser on your Android phone
2. Navigate to your app's URL (e.g., http://your-server-ip:8000)
3. Tap the menu (three dots) in the top right
4. Select **"Add to Home screen"** or **"Install app"**
5. Confirm the installation
6. The app icon will appear on your home screen
7. Tap the icon to open the app (it will run in full-screen mode)

### iPhone/iPad (Safari)
1. Open Safari on your iPhone/iPad
2. Navigate to your app's URL
3. Tap the **Share button** (square with arrow pointing up) at the bottom
4. Scroll down and tap **"Add to Home Screen"**
5. Edit the name if desired, then tap **"Add"**
6. The app icon will appear on your home screen
7. Tap the icon to open the app

**Note:** On iOS, the app must be served over HTTPS for full PWA features. For local testing, HTTP works, but for production deployment, use HTTPS.

---

## Testing the PWA

### Check Service Worker Registration
1. Open the app in Chrome/Edge
2. Press `F12` to open Developer Tools
3. Go to the **Application** tab
4. Click **Service Workers** in the left sidebar
5. You should see `service-worker.js` with status "activated"

### Test Offline Functionality
1. Open the app and use it normally
2. In Developer Tools → Application → Service Workers
3. Check the **"Offline"** checkbox
4. Refresh the page - the app should still load
5. Try navigating around - cached pages should work

### Check Manifest
1. In Developer Tools → Application tab
2. Click **Manifest** in the left sidebar
3. Verify the manifest loads with correct app name and icons

---

## Serving the App

To make your app accessible on your phone, you need to serve it from your computer:

### Option 1: Python HTTP Server
```powershell
cd c:\Users\cgcda\MonAvgApp
python -m http.server 8000
```

### Option 2: Node.js HTTP Server
```powershell
npx http-server -p 8000
```

### Option 3: VS Code Live Server Extension
1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

**Access from phone:**
1. Find your computer's local IP address:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" under your active network adapter (e.g., 192.168.1.100)

2. On your phone, open the browser and go to:
   ```
   http://YOUR-IP-ADDRESS:8000
   ```
   (Replace YOUR-IP-ADDRESS with your computer's IP)

3. Make sure your phone and computer are on the same Wi-Fi network

---

## Production Deployment

For production use (accessible from anywhere):

### Option 1: GitHub Pages (Free, HTTPS)
1. Create a GitHub repository
2. Push your code to the repository
3. Enable GitHub Pages in repository settings
4. Access at: `https://your-username.github.io/your-repo-name/`

### Option 2: Netlify/Vercel (Free, HTTPS)
1. Create account on Netlify.com or Vercel.com
2. Connect your GitHub repository or drag/drop your folder
3. Deploy automatically
4. Get a free HTTPS URL

### Option 3: Your Own Server
- Upload files to web hosting with HTTPS enabled
- Ensure server serves the files with proper MIME types

**Important:** For iOS PWA features to work fully, the app MUST be served over HTTPS in production.

---

## Troubleshooting

### App won't install
- Make sure both PNG icons exist (icon-192.png and icon-512.png)
- Check browser console for manifest errors
- Verify manifest.json is accessible at `/manifest.json`

### Service Worker not registering
- Check browser console for errors
- Ensure service-worker.js is in the root folder
- Try clearing browser cache and reloading

### App doesn't work offline
- Verify service worker is "activated" in DevTools
- Check that files are cached (Application → Cache Storage)
- Ensure all file paths in service-worker.js are correct

### Icons not showing
- Verify PNG files exist and are properly sized
- Check file names match manifest.json exactly
- Clear browser cache and reinstall the app
