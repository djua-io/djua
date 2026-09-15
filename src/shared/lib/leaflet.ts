let leafletPromise: Promise<any> | undefined

/** Loads Leaflet only on screens that need an interactive OpenStreetMap view. */
export function loadLeaflet() {
  const existing = (window as Window & { L?: any }).L
  if (existing) return Promise.resolve(existing)
  if (leafletPromise) return leafletPromise

  if (!document.getElementById('leaflet-style')) {
    const stylesheet = document.createElement('link')
    stylesheet.id = 'leaflet-style'
    stylesheet.rel = 'stylesheet'
    stylesheet.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(stylesheet)
  }

  leafletPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => resolve((window as Window & { L?: any }).L)
    script.onerror = () => reject(new Error('La carte OpenStreetMap n’a pas pu être chargée.'))
    document.head.appendChild(script)
  })

  return leafletPromise
}
