/**
 * TabLine - Premium New Tab Dashboard
 * Architecture: Clean Architecture + Repository Pattern + BLoC Style State Management
 * Language: JavaScript (English code, Spanish UI support)
 */

// ==========================================
// 1. DATA LAYER (PERSISTENCE REPOSITORY)
// ==========================================

class StorageRepository {
  constructor() {
    // Check if running in Chrome Extension environment or standard Web Page
    this.isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  }

  /**
   * Fetch Settings from Storage
   */
  async getSettings() {
    return new Promise((resolve) => {
      if (this.isExtension) {
        chrome.storage.local.get('settings', (result) => {
          const defaults = this.getDefaultSettings();
          const loaded = result.settings || {};
          resolve({ ...defaults, ...loaded });
        });
      } else {
        const localData = localStorage.getItem('premium_settings');
        const defaults = this.getDefaultSettings();
        const loaded = localData ? JSON.parse(localData) : {};
        resolve({ ...defaults, ...loaded });
      }
    });
  }

  /**
   * Save Settings to Storage
   */
  async saveSettings(settings) {
    return new Promise((resolve) => {
      if (this.isExtension) {
        chrome.storage.local.set({ settings }, () => resolve(true));
      } else {
        localStorage.setItem('premium_settings', JSON.stringify(settings));
        resolve(true);
      }
    });
  }

  /**
   * Fetch Shortcuts Grid from Storage
   */
  async getShortcuts() {
    return new Promise((resolve) => {
      if (this.isExtension) {
        chrome.storage.local.get('shortcuts', (result) => {
          resolve(result.shortcuts || this.getDefaultShortcuts());
        });
      } else {
        const localData = localStorage.getItem('premium_shortcuts');
        resolve(localData ? JSON.parse(localData) : this.getDefaultShortcuts());
      }
    });
  }

  /**
   * Save Shortcuts Grid to Storage
   */
  async saveShortcuts(shortcuts) {
    return new Promise((resolve) => {
      if (this.isExtension) {
        chrome.storage.local.set({ shortcuts }, () => resolve(true));
      } else {
        localStorage.setItem('premium_shortcuts', JSON.stringify(shortcuts));
        resolve(true);
      }
    });
  }

  /**
   * Default Settings Entity
   */
  getDefaultSettings() {
    return {
      timeFormat12: true,
      showSearchBar: true,
      bgProvider: 'video',
      bgStaticUrl: 'wallpapers/bg1.png',
      bgCustomUrl: '',
      bgVideoUrl: 'wallpapers/vid_rain.mp4',
      bgUrl: 'wallpapers/vid_rain.mp4',
      bgFileBase64: '',
      dimNight: false,
      dimStart: '19:00',
      dimEnd: '07:00',
      language: 'auto',
      iconRoundness: 25, // 0 = square, 25 = squircle (default), 50 = circle
      accentPalette: 'space',
      gridDensity: 'auto', // 'auto' | '3' | '4' — number of rows in the shortcuts grid
      pageLabels: []       // Optional label per page index. Sparse — empty slots fall back to a plain dot.
    };
  }

  /**
   * Default curated premium Shortcuts Grid
   */
  getDefaultShortcuts() {
    return [
      { id: 'sc_0', name: 'Google', url: 'https://www.google.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg', color: '#ffffff', zoom: 1.0 },
      { id: 'sc_1', name: 'YouTube', url: 'https://www.youtube.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg', color: '#ffffff', zoom: 1.0 },
      { id: 'sc_2', name: 'GitHub', url: 'https://github.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/GitHub_Glitch_Logo.svg', color: '#ffffff', zoom: 1.0 },
      { id: 'sc_3', name: 'Gemini', url: 'https://gemini.google.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg', color: '#ffffff', zoom: 1.0 },
      { id: 'sc_4', name: 'Firebase', url: 'https://firebase.google.com', icon: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Firebase_logo.svg', color: '#ffffff', zoom: 1.0 }
    ];
  }
}

// ==========================================
// 2. DOMAIN LAYER (ENTITIES & USE CASES)
// ==========================================

class Shortcut {
  constructor(id, name, url, icon = '', color = '#1f2937', zoom = 1.0, fit = 'contain') {
    this.id = id || 'sc_' + Date.now();
    this.name = name;
    this.url = this.formatUrl(url);
    this.icon = icon; // Base64 dataURL or direct web image URL
    this.color = color;
    this.zoom = zoom || 1.0;
    this.fit = fit || 'contain';
  }

  formatUrl(url) {
    if (!/^https?:\/\//i.test(url) && !/^chrome:\/\//i.test(url)) {
      return 'https://' + url;
    }
    return url;
  }
}

// ==========================================
// 2. DOMAIN LAYER (ENTITIES & USE CASES) - Curated Static Wallpapers List
// ==========================================

const CURATED_WALLPAPERS = [
  // Natural landscapes
  { id: 'wp_1',  name: 'Valle Verde',            file: 'wallpapers/bg1.png' },
  { id: 'wp_2',  name: 'Atardecer en Marte',     file: 'wallpapers/bg2.png' },
  { id: 'wp_3',  name: 'Colinas Doradas',        file: 'wallpapers/bg3.png' },
  { id: 'wp_4',  name: 'Reflejos de Lago',       file: 'wallpapers/bg4.png' },
  { id: 'wp_5',  name: 'Lago Glaciar',           file: 'wallpapers/bg5.png' },
  { id: 'wp_6',  name: 'Amanecer en Bagan',      file: 'wallpapers/bg6.png' },
  { id: 'wp_7',  name: 'Tormenta en el Lago',    file: 'wallpapers/bg7.png' },
  { id: 'wp_8',  name: 'Atardecer Alpino',       file: 'wallpapers/bg8.png' },
  { id: 'wp_15', name: 'Dunas al Atardecer',     file: 'wallpapers/bg15.png' },
  { id: 'wp_17', name: 'Bosque Brumoso',         file: 'wallpapers/bg17.png' },
  { id: 'wp_14', name: 'Playa Bioluminiscente',  file: 'wallpapers/bg14.png' },
  { id: 'wp_13', name: 'Cielo Violeta',          file: 'wallpapers/bg13.png' },
  // Sky and space
  { id: 'wp_9',  name: 'Vía Láctea',             file: 'wallpapers/bg9.png' },
  { id: 'wp_10', name: 'Anillos Cósmicos',       file: 'wallpapers/bg10.png' },
  { id: 'wp_11', name: 'Mundo Lejano',           file: 'wallpapers/bg11.png' },
  // Cities / future
  { id: 'wp_12', name: 'Ciudad del Futuro',      file: 'wallpapers/bg12.png' },
  { id: 'wp_16', name: 'Tokio Neón',             file: 'wallpapers/bg16.png' }
];

const CURATED_VIDEOS = [
  // Natural
  { id: 'vid_rain',     nameKey: 'video.rain',     file: 'wallpapers/vid_rain.mp4' },
  { id: 'vid_snow',     nameKey: 'video.snow',     file: 'wallpapers/vid_snow.mp4' },
  { id: 'vid_clouds',   nameKey: 'video.clouds',   file: 'wallpapers/vid_clouds.mp4' },
  { id: 'vid_clouds2',  nameKey: 'video.clouds2',  file: 'wallpapers/vid_clouds2.mp4' },
  { id: 'vid_waves',    nameKey: 'video.waves',    file: 'wallpapers/vid_waves.mp4' },
  { id: 'vid_thunder',  nameKey: 'video.thunder',  file: 'wallpapers/vid_thunder.mp4' },
  { id: 'vid_thunder2', nameKey: 'video.thunder2', file: 'wallpapers/vid_thunder2.mp4' },
  // Sky
  { id: 'vid_aurora',   nameKey: 'video.aurora',   file: 'wallpapers/vid_aurora.mp4' },
  // Abstract
  { id: 'vid_abstract', nameKey: 'video.abstract', file: 'wallpapers/vid_abstract.mp4' }
];

// ==========================================
// 2.2 INTERNATIONALIZATION (i18n) — Spanish / English
// ==========================================

const I18N = {
  es: {
    'sidebar.about': 'Acerca de TabLine',
    'dialog.resetConfirm': '¿Seguro que quieres restablecer TabLine a los valores de fábrica?\n\nSe borrarán todos tus atajos y configuración. Esta acción no se puede deshacer.',
    'shortcut.options': 'Opciones',
    'about.logoAlt': 'Logo de TabLine',
    'sidebar.settings': 'Configuración',
    'sidebar.wallpapers': 'Personalizar fondo de pantalla',
    'search.submit': 'Buscar',
    'search.placeholderWeb': 'Buscar en la web...',
    'shortcuts.add': 'Añadir Atajo',
    'shortcuts.emptyTitle': 'Agrega tu primer atajo',
    'shortcuts.emptySubtitle': 'Toca aquí o el botón "+" para empezar',
    'clock.loadingDate': 'Cargando fecha…',
    'settings.title': 'Configuración',
    'settings.close': 'Cerrar',
    'settings.clockSection': 'Reloj y Fecha',
    'settings.time12': 'Formato de 12 horas',
    'settings.langSection': 'Idioma',
    'settings.lang.auto': 'Automático',
    'settings.lang.es': 'Español',
    'settings.lang.en': 'Inglés',
    'settings.bgSection': 'Fondo de Pantalla',
    'settings.bg.gradient': 'Gradiente Animado (Vibrante)',
    'settings.bg.static': 'Galería de Wallpapers',
    'settings.bg.daily': 'Wallpaper del Día',
    'settings.bg.video': 'Galería de Videos',
    'settings.bg.videoUrl': 'URL de Video',
    'settings.bg.videoFile': 'Cargar Video',
    'settings.bg.url': 'URL de Imagen',
    'settings.bg.file': 'Cargar imagen desde tu equipo',
    'settings.imageUrl': 'URL de la Imagen',
    'settings.imageUrlPh': 'https://ejemplo.com/fondo.jpg',
    'settings.selectFile': 'Seleccionar Archivo',
    'settings.chooseImage': 'Elegir imagen de fondo...',
    'settings.videoUrl': 'URL del Video (MP4)',
    'settings.videoUrlPh': 'https://ejemplo.com/video.mp4',
    'settings.chooseVideo': 'Cargar video desde tu equipo',
    'settings.videoLoaded': 'Video cargado ✓',
    'settings.videoSaveFailed': 'No se pudo cargar el video',
    'settings.dimNight': 'Atenuar fondo en la noche',
    'settings.dimNightDesc': 'Oscurece el fondo automáticamente dentro de tu horario nocturno.',
    'settings.from': 'Desde',
    'settings.to': 'Hasta',
    'settings.componentsSection': 'Componentes de Pantalla',
    'settings.showSearchBar': 'Mostrar Barra de Búsqueda',
    'settings.iconCorners': 'Redondeo de iconos',
    'settings.densitySection': 'Densidad de la grilla',
    'settings.density.auto': 'Automático',
    'settings.density.3': '3 filas',
    'settings.density.4': '4 filas',
    'settings.densityDesc': '«Automático» elige 3 o 4 filas según la altura de tu pantalla.',
    'settings.accentSection': 'Color de acento',
    'accent.space': 'Gris titanio',
    'accent.lavender': 'Lavanda',
    'accent.sand': 'Arena',
    'accent.ocean': 'Océano',
    'accent.forest': 'Bosque',
    'accent.mono': 'Mono',
    'settings.backupSection': 'Copia de Seguridad',
    'settings.export': 'Exportar configuración (.json)',
    'settings.selectBackup': 'Seleccionar archivo de respaldo (.json)',
    'settings.import': 'Importar configuración',
    'settings.reset': 'Restablecer valores de fábrica',
    'dimNight.activeNow': 'Activo ahora · el fondo está atenuado',
    'dimNight.daytime': 'Es de día · se atenuará a las {time}',
    'dialog.addTitle': 'Agregar atajo',
    'dialog.editTitle': 'Editar atajo',
    'dialog.tabPopular': 'Populares',
    'dialog.tabCustom': 'Personalizado',
    'dialog.tabChrome': 'Chrome',
    'dialog.selectPopular': 'Selecciona un atajo popular',
    'dialog.zoom': 'Zoom del icono',
    'dialog.fillIcon': 'Rellenar icono',
    'dialog.siteUrl': 'Dirección del sitio',
    'dialog.siteUrlPh': 'ej. github.com',
    'dialog.shortcutName': 'Nombre del atajo',
    'dialog.shortcutNamePh': 'ej. GitHub',
    'dialog.iconSource': 'Origen del icono',
    'dialog.iconUrlPh': 'Imagen por URL directa',
    'dialog.selectFile': 'Seleccionar archivo',
    'dialog.uploadImageFile': 'Subir archivo de imagen...',
    'dialog.uploadedIcon': 'Icono cargado localmente',
    'dialog.bgColor': 'Color de fondo',
    'dialog.bgColorHint': '(si no hay icono)',
    'dialog.transparent': 'Transparente',
    'dialog.chromePages': 'Páginas del Sistema Chrome',
    'dialog.cancel': 'Cancelar',
    'dialog.add': 'Agregar',
    'dialog.save': 'Guardar',
    'dialog.urlChanged': 'Cambiaste la URL del sitio',
    'dialog.restoreIcon': 'Restaurar original',
    'about.tagline': 'Una nueva pestaña, en silencio.',
    'about.feat1.title': 'Atajos reordenables con drag & drop',
    'about.feat2.title': 'Paginación de atajos con scroll fluido',
    'about.feat3.title': 'Fondos HD, videos y wallpaper diario',
    'about.feat4.title': 'Atenuación automática en horario nocturno',
    'about.feat5.title': 'Backup y restauración en JSON',
    'about.createdBy': 'Hecho por',
    'about.role': 'Software Engineer',
    'about.shortcutsLabel': 'Atajos de teclado',
    'about.or': 'o',
    'about.kbd.focusSearch': 'Enfocar la barra de búsqueda',
    'about.kbd.addShortcut': 'Abrir el modal de nuevo atajo',
    'about.kbd.settings': 'Abrir/cerrar configuración',
    'about.kbd.paginate': 'Cambiar de página de atajos',
    'about.kbd.close': 'Cerrar cualquier modal o panel',
    'about.kbd.help': 'Mostrar esta ventana',
    'about.kbd.renamePage': 'Nombrar la página activa',
    'about.kbd.doubleClick': 'Doble clic',
    'pagination.renamePh': 'Nombre de la página',
    'pagination.tabAria': 'Página {index}: {label}',
    'pagination.dotAria': 'Página {index}',
    'pagination.barAria': 'Páginas de atajos',
    'about.close': 'Cerrar',
    'wp.daily': 'Diario',
    'wp.static': 'Fijos',
    'wp.live': 'Video',
    'wp.homeDaily': 'Diario',
    'wp.close': 'Cerrar',
    'ctx.edit': 'Editar',
    'ctx.duplicate': 'Duplicar',
    'ctx.delete': 'Eliminar',
    'ctx.openNewTab': 'Abrir en nueva pestaña',
    'ctx.openIncognito': 'Abrir en incógnito',
    'ctx.copyUrl': 'Copiar URL',
    'toast.urlCopied': 'URL copiada al portapapeles',
    'toast.dismiss': 'Cerrar notificación',
    'toast.urlCopyError': 'No se pudo copiar la URL',
    'toast.incognitoUnavailable': 'Modo incógnito no disponible',
    'toast.incognitoBlocked': 'Permite TabLine en modo incógnito (chrome://extensions)',
    'video.rain': 'Lluvia',
    'video.snow': 'Nieve',
    'video.thunder': 'Tormenta',
    'video.clouds': 'Nubes',
    'video.clouds2': 'Nubes II',
    'video.waves': 'Olas',
    'video.thunder2': 'Tormenta II',
    'video.aurora': 'Aurora',
    'video.abstract': 'Abstracto',
    'chrome.bookmarks': 'Marcadores',
    'chrome.history': 'Historial',
    'chrome.downloads': 'Descargas',
    'chrome.settings': 'Configuración',
    'chrome.extensions': 'Extensiones',
    'toast.bgUpdated': 'Fondo de pantalla actualizado',
    'toast.bgChanged': 'Fondo de pantalla cambiado a {name}',
    'toast.videoBgChanged': 'Fondo de video cambiado a {name}',
    'toast.dailyOn': 'Rotación de fondos «Daily» activada ☼',
    'toast.fillFields': 'Por favor, rellena todos los campos requeridos',
    'toast.shortcutUpdated': 'Atajo actualizado con éxito',
    'toast.iconRestored': 'Icono original restaurado',
    'toast.shortcutAdded': 'Atajo añadido con éxito',
    'toast.shortcutDeleted': 'Atajo eliminado',
    'toast.shortcutDuplicated': 'Atajo duplicado',
    'toast.shortcutRestored': 'Atajo restaurado',
    'toast.undo': 'Deshacer',
    'toast.exported': 'Configuración exportada como archivo JSON 💾',
    'toast.jsonCopied': 'JSON copiado al portapapeles',
    'toast.exportFailed': 'No se pudo exportar el archivo',
    'toast.selectJson': 'Por favor, selecciona un archivo JSON primero.',
    'toast.legacyDetected': 'Formato heredado detectado. Importando...',
    'toast.importOk': 'Importación exitosa: {count} atajos recuperados ✅',
    'toast.importError': 'Error al importar. El archivo no es un JSON válido.',
    'toast.resetDone': '✅ Configuración restablecida a valores de fábrica'
  },
  en: {
    'sidebar.about': 'About TabLine',
    'dialog.resetConfirm': 'Are you sure you want to reset TabLine to factory settings?\n\nAll your shortcuts and settings will be deleted. This action cannot be undone.',
    'shortcut.options': 'Options',
    'about.logoAlt': 'TabLine logo',
    'sidebar.settings': 'Settings',
    'sidebar.wallpapers': 'Customize wallpaper',
    'search.submit': 'Search',
    'search.placeholderWeb': 'Search the web...',
    'shortcuts.add': 'Add Shortcut',
    'shortcuts.emptyTitle': 'Add your first shortcut',
    'shortcuts.emptySubtitle': 'Tap here or the "+" button to get started',
    'clock.loadingDate': 'Loading date…',
    'settings.title': 'Settings',
    'settings.close': 'Close',
    'settings.clockSection': 'Clock & Date',
    'settings.time12': '12-hour format',
    'settings.langSection': 'Language',
    'settings.lang.auto': 'Automatic',
    'settings.lang.es': 'Spanish',
    'settings.lang.en': 'English',
    'settings.bgSection': 'Wallpaper',
    'settings.bg.gradient': 'Animated Gradient (Vibrant)',
    'settings.bg.static': 'Wallpaper Gallery',
    'settings.bg.daily': 'Wallpaper of the Day',
    'settings.bg.video': 'Video Gallery',
    'settings.bg.videoUrl': 'Video URL',
    'settings.bg.videoFile': 'Upload Video',
    'settings.bg.url': 'Image URL',
    'settings.bg.file': 'Upload image from your device',
    'settings.imageUrl': 'Image URL',
    'settings.imageUrlPh': 'https://example.com/background.jpg',
    'settings.selectFile': 'Select File',
    'settings.chooseImage': 'Choose background image...',
    'settings.videoUrl': 'Video URL (MP4)',
    'settings.videoUrlPh': 'https://example.com/video.mp4',
    'settings.chooseVideo': 'Upload video from your device',
    'settings.videoLoaded': 'Video loaded ✓',
    'settings.videoSaveFailed': 'Could not load the video',
    'settings.dimNight': 'Dim background at night',
    'settings.dimNightDesc': 'Automatically darkens the background during your night hours.',
    'settings.from': 'From',
    'settings.to': 'To',
    'settings.componentsSection': 'Screen Components',
    'settings.showSearchBar': 'Show Search Bar',
    'settings.iconCorners': 'Icon corners',
    'settings.densitySection': 'Grid density',
    'settings.density.auto': 'Automatic',
    'settings.density.3': '3 rows',
    'settings.density.4': '4 rows',
    'settings.densityDesc': '"Automatic" picks 3 or 4 rows based on your screen height.',
    'settings.accentSection': 'Accent color',
    'accent.space': 'Titanium Gray',
    'accent.lavender': 'Lavender',
    'accent.sand': 'Sand',
    'accent.ocean': 'Ocean',
    'accent.forest': 'Forest',
    'accent.mono': 'Mono',
    'settings.backupSection': 'Backup',
    'settings.export': 'Export settings (.json)',
    'settings.selectBackup': 'Select backup file (.json)',
    'settings.import': 'Import settings',
    'settings.reset': 'Reset to factory defaults',
    'dimNight.activeNow': 'Active now · background is dimmed',
    'dimNight.daytime': 'Daytime · will dim at {time}',
    'dialog.addTitle': 'Add shortcut',
    'dialog.editTitle': 'Edit shortcut',
    'dialog.tabPopular': 'Popular',
    'dialog.tabCustom': 'Custom',
    'dialog.tabChrome': 'Chrome',
    'dialog.selectPopular': 'Pick a popular shortcut',
    'dialog.zoom': 'Icon zoom',
    'dialog.fillIcon': 'Fill icon',
    'dialog.siteUrl': 'Site address',
    'dialog.siteUrlPh': 'e.g. github.com',
    'dialog.shortcutName': 'Shortcut name',
    'dialog.shortcutNamePh': 'e.g. GitHub',
    'dialog.iconSource': 'Icon source',
    'dialog.iconUrlPh': 'Image by direct URL',
    'dialog.selectFile': 'Select file',
    'dialog.uploadImageFile': 'Upload image file...',
    'dialog.uploadedIcon': 'Icon uploaded locally',
    'dialog.bgColor': 'Background color',
    'dialog.bgColorHint': '(if no icon)',
    'dialog.transparent': 'Transparent',
    'dialog.chromePages': 'Chrome System Pages',
    'dialog.cancel': 'Cancel',
    'dialog.add': 'Add',
    'dialog.save': 'Save',
    'dialog.urlChanged': 'You changed the site URL',
    'dialog.restoreIcon': 'Restore original',
    'about.tagline': 'A new tab, quieted down.',
    'about.feat1.title': 'Drag & drop shortcut reordering',
    'about.feat2.title': 'Shortcut pagination with smooth scroll',
    'about.feat3.title': 'HD wallpapers, videos and daily picks',
    'about.feat4.title': 'Auto dim during night hours',
    'about.feat5.title': 'JSON backup and restore',
    'about.createdBy': 'Made by',
    'about.role': 'Software Engineer',
    'about.shortcutsLabel': 'Keyboard shortcuts',
    'about.or': 'or',
    'about.kbd.focusSearch': 'Focus the search bar',
    'about.kbd.addShortcut': 'Open the Add Shortcut dialog',
    'about.kbd.settings': 'Toggle Settings drawer',
    'about.kbd.paginate': 'Flip shortcut page',
    'about.kbd.close': 'Close any open overlay',
    'about.kbd.help': 'Show this window',
    'about.kbd.renamePage': 'Name the active page',
    'about.kbd.doubleClick': 'Double click',
    'pagination.renamePh': 'Page name',
    'pagination.tabAria': 'Page {index}: {label}',
    'pagination.dotAria': 'Page {index}',
    'pagination.barAria': 'Shortcut pages',
    'about.close': 'Close',
    'wp.daily': 'Daily',
    'wp.static': 'Static',
    'wp.live': 'Live',
    'wp.homeDaily': 'Daily',
    'wp.close': 'Close',
    'ctx.edit': 'Edit',
    'ctx.duplicate': 'Duplicate',
    'ctx.delete': 'Delete',
    'ctx.openNewTab': 'Open in new tab',
    'ctx.openIncognito': 'Open in incognito',
    'ctx.copyUrl': 'Copy URL',
    'toast.urlCopied': 'URL copied to clipboard',
    'toast.dismiss': 'Dismiss notification',
    'toast.urlCopyError': 'Failed to copy URL',
    'toast.incognitoUnavailable': 'Incognito mode is not available',
    'toast.incognitoBlocked': 'Allow TabLine in Incognito mode (chrome://extensions)',
    'video.rain': 'Rain',
    'video.snow': 'Snow',
    'video.thunder': 'Storm',
    'video.clouds': 'Clouds',
    'video.clouds2': 'Clouds II',
    'video.waves': 'Waves',
    'video.thunder2': 'Storm II',
    'video.aurora': 'Aurora',
    'video.abstract': 'Abstract',
    'chrome.bookmarks': 'Bookmarks',
    'chrome.history': 'History',
    'chrome.downloads': 'Downloads',
    'chrome.settings': 'Settings',
    'chrome.extensions': 'Extensions',
    'toast.bgUpdated': 'Wallpaper updated',
    'toast.bgChanged': 'Wallpaper changed to {name}',
    'toast.videoBgChanged': 'Video background changed to {name}',
    'toast.dailyOn': 'Daily wallpaper rotation enabled ☼',
    'toast.fillFields': 'Please fill in all required fields',
    'toast.shortcutUpdated': 'Shortcut updated successfully',
    'toast.iconRestored': 'Original icon restored',
    'toast.shortcutAdded': 'Shortcut added successfully',
    'toast.shortcutDeleted': 'Shortcut deleted',
    'toast.shortcutDuplicated': 'Shortcut duplicated',
    'toast.shortcutRestored': 'Shortcut restored',
    'toast.undo': 'Undo',
    'toast.exported': 'Settings exported as a JSON file 💾',
    'toast.jsonCopied': 'JSON copied to clipboard',
    'toast.exportFailed': 'Could not export the file',
    'toast.selectJson': 'Please select a JSON file first.',
    'toast.legacyDetected': 'Legacy format detected. Importing...',
    'toast.importOk': 'Import successful: {count} shortcuts recovered ✅',
    'toast.importError': 'Import error. The file is not valid JSON.',
    'toast.resetDone': '✅ Settings reset to factory defaults'
  }
};

// ==========================================
// 3. PRESENTATION LAYER (BLOC / STATE CONTROLLER)
// ==========================================

class NewTabController {
  constructor() {
    this.repository = new StorageRepository();
    this.staticWallpapers = CURATED_WALLPAPERS;
    this.liveVideos = CURATED_VIDEOS;
    
    this.state = {
      settings: {},
      shortcuts: [],
      currentPage: 0,
      // 7 columns × N rows. N comes from settings.gridDensity ('auto' | '3' | '4').
      // Updated on every renderShortcuts() via computeSlotsPerPage().
      // The '+' lives outside the grid as a sidebar button.
      slotsPerPage: 21
    };

    this.activeContextShortcutId = null;

    // Ranked favicon candidates for the URL typed in the Add/Edit dialog.
    // Used as a fallback when the user doesn't provide an icon URL or file —
    // tried in order until one loads (or one caches successfully on save).
    this.autoFaviconCandidates = [];
    this._faviconDebounce = null;

    // Auto-fetched <title> support. _userEditedName flips to true on any
    // human keystroke so we never overwrite a name the user has typed;
    // _titleFetchController lets the URL debounce cancel an in-flight fetch
    // when the user keeps editing.
    this._userEditedName = false;
    this._titleFetchController = null;


    // Cache DOM Elements
    this.dom = {
      // Left Sidebar panel controls
      sidebarAboutBtn: document.getElementById('sidebar-about-btn'),
      sidebarSettingsBtn: document.getElementById('sidebar-settings-btn'),
      sidebarWallpapersBtn: document.getElementById('sidebar-wallpapers-btn'),

      clockTime: document.getElementById('clock-time'),
      clockDate: document.getElementById('clock-date'),
      bgImage: document.getElementById('bg-image'),
      searchInput: document.getElementById('search-input'),
      searchFormBtn: document.getElementById('search-submit-btn'),
      shortcutsGrid: document.getElementById('shortcuts-grid'),
      shortcutsGridContainer: document.querySelector('.shortcuts-grid-container'),
      addShortcutFab: document.getElementById('add-shortcut-fab'),
      paginationDots: document.getElementById('pagination-dots'),
      settingsDrawer: document.getElementById('settings-drawer'),
      closeDrawerBtn: document.getElementById('close-drawer-btn'),
      
      // Settings controls
      timeFormatToggle: document.getElementById('time-format-toggle'),
      languageSelect: document.getElementById('language-select'),
      bgProviderSelect: document.getElementById('bg-provider-select'),
      bgUrlInputContainer: document.getElementById('bg-url-input-container'),
      bgUrlInput: document.getElementById('bg-url-input'),
      bgFileInputContainer: document.getElementById('bg-file-input-container'),
      bgFileInput: document.getElementById('bg-file-input'),
      bgVideoInputContainer: document.getElementById('bg-video-input-container'),
      bgVideoFileContainer: document.getElementById('bg-video-file-container'),
      bgVideoInput: document.getElementById('bg-video-input'),
      bgVideoFileInput: document.getElementById('bg-video-file-input'),
      bgVideoFileLabel: document.getElementById('bg-video-file-label'),
      fileUploadLabel: document.getElementById('file-upload-label'),
      dimNightToggle: document.getElementById('dim-night-toggle'),
      dimNightOptions: document.getElementById('dim-night-options'),
      dimNightStatus: document.getElementById('dim-night-status'),
      dimStartInput: document.getElementById('dim-start-input'),
      dimEndInput: document.getElementById('dim-end-input'),
      searchBarToggle: document.getElementById('search-bar-toggle'),
      iconRoundnessSlider: document.getElementById('icon-roundness-slider'),
      iconRoundnessValue: document.getElementById('icon-roundness-value'),
      gridDensitySelect: document.getElementById('grid-density-select'),
      accentSwatches: document.getElementById('accent-swatches'),
      importJsonFile: document.getElementById('import-json-file'),
      importFileLabel: document.getElementById('import-file-label'),
      importJsonBtn: document.getElementById('import-json-btn'),
      exportJsonBtn: document.getElementById('export-json-btn'),
      resetConfigBtn: document.getElementById('reset-config-btn'),

      // Add/Edit Dialog modal and tabs
      shortcutDialog: document.getElementById('shortcut-dialog'),
      aboutDialog: document.getElementById('about-dialog'),
      aboutCloseBtn: document.getElementById('about-close-btn'),
      aboutVersion: document.getElementById('about-version'),
      dialogTitle: document.getElementById('dialog-title'),
      dialogTabButtons: document.querySelectorAll('.dialog-tab-btn'),
      tabContents: document.querySelectorAll('.tab-content'),
      popularShortcutsGrid: document.getElementById('popular-shortcuts-grid'),
      chromePagesList: document.getElementById('chrome-pages-list'),
      
      // Custom Tab inside Dialog
      shortcutName: document.getElementById('shortcut-name'),
      shortcutUrl: document.getElementById('shortcut-url'),
      shortcutIconInput: document.getElementById('shortcut-icon-input'),
      shortcutIconUrlInput: document.getElementById('shortcut-icon-url-input'),
      shortcutZoomSlider: document.getElementById('shortcut-zoom-slider'),
      zoomValue: document.getElementById('zoom-value'),
      shortcutFitToggle: document.getElementById('shortcut-fit-toggle'),
      shortcutPreviewBox: document.getElementById('shortcut-preview-box'),
      shortcutPreviewImg: document.getElementById('shortcut-preview-img'),
      shortcutPreviewFallback: document.getElementById('shortcut-preview-fallback'),
      iconFileLabel: document.getElementById('icon-file-label'),
      iconUrlActions: document.getElementById('icon-url-actions'),
      iconRestoreBtn: document.getElementById('icon-restore-btn'),
      colorSwatches: document.getElementById('color-swatches'),
      dialogCancelBtn: document.getElementById('dialog-cancel-btn'),
      dialogSaveBtn: document.getElementById('dialog-save-btn'),

      // Wallpaper Drawer controls
      wallpaperDrawer: document.getElementById('wallpaper-drawer'),
      closeWallpaperDrawerBtn: document.getElementById('close-wallpaper-drawer-btn'),
      wallpaperStaticList: document.getElementById('wallpaper-static-list'),
      wallpaperLiveList: document.getElementById('wallpaper-live-list'),
      wpCardDaily: document.getElementById('wp-card-daily'),
      wallpaperCarousel: document.querySelector('.wallpaper-carousel-container'),
      drawerTabs: Array.from(document.querySelectorAll('.drawer-tab')),
      
      // Context menu popover
      shortcutContextMenu: document.getElementById('shortcut-context-menu'),
      ctxEditBtn: document.getElementById('ctx-edit-btn'),
      ctxDuplicateBtn: document.getElementById('ctx-duplicate-btn'),
      ctxDeleteBtn: document.getElementById('ctx-delete-btn'),
      ctxOpenTabBtn: document.getElementById('ctx-open-tab-btn'),
      ctxOpenIncognitoBtn: document.getElementById('ctx-open-incognito-btn'),
      ctxCopyUrlBtn: document.getElementById('ctx-copy-url-btn'),

      // Toast notification
      toast: document.getElementById('toast-notification'),
      toastCloseBtn: document.getElementById('toast-close-btn'),
      navProgress: document.getElementById('nav-progress'),
      toastMessage: document.getElementById('toast-message'),

      // Quick dynamic components
      searchContainer: document.querySelector('.search-container')
    };

    // Curated Popular Preset Shortcuts
    // Icon URLs: prefer reliable hi-res sources. Google's s2 favicon service
    // (`?sz=128`) is the safest fallback — always returns the brand favicon for
    // a given domain. Wikipedia Commons paths are kept only for entries that
    // are known to resolve; the rest use s2 to avoid broken images in the grid.
    this.popularPresets = [
      { name: 'Google', url: 'https://www.google.com', color: '#ffffff', icon: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg' },
      { name: 'YouTube', url: 'https://www.youtube.com', color: '#ffffff', icon: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg' },
      { name: 'Gmail', url: 'https://mail.google.com', color: '#ffffff', icon: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg' },
      { name: 'GitHub', url: 'https://github.com', color: '#ffffff', icon: 'https://www.google.com/s2/favicons?domain=github.com&sz=128' },
      { name: 'Gemini', url: 'https://gemini.google.com', color: '#ffffff', icon: 'https://www.google.com/s2/favicons?domain=gemini.google.com&sz=128' },
      { name: 'Drive', url: 'https://drive.google.com', color: '#ffffff', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg' },
      { name: 'Calendar', url: 'https://calendar.google.com', color: '#ffffff', icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg' },
      { name: 'Docs', url: 'https://docs.google.com', color: '#ffffff', icon: 'https://www.google.com/s2/favicons?domain=docs.google.com&sz=128' },
      { name: 'Sheets', url: 'https://docs.google.com/spreadsheets', color: '#ffffff', icon: 'https://www.google.com/s2/favicons?domain=sheets.google.com&sz=128' },
      { name: 'Presentations', url: 'https://docs.google.com/presentation', color: '#ffffff', icon: 'https://www.google.com/s2/favicons?domain=slides.google.com&sz=128' },
      { name: 'Firebase', url: 'https://firebase.google.com', color: '#ffffff', icon: 'https://www.google.com/s2/favicons?domain=firebase.google.com&sz=128' },
      { name: 'Facebook', url: 'https://www.facebook.com', color: '#1877f2', icon: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg' },
      { name: 'Instagram', url: 'https://www.instagram.com', color: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', icon: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Instagram_logo_2022.svg' },
      { name: 'LinkedIn', url: 'https://www.linkedin.com', color: '#0077b5', icon: 'https://upload.wikimedia.org/wikipedia/commons/8/81/LinkedIn_icon.svg' },
      { name: 'X', url: 'https://x.com', color: '#000000', icon: 'https://www.google.com/s2/favicons?domain=x.com&sz=128' },
      { name: 'Netflix', url: 'https://www.netflix.com', color: '#000000', icon: 'https://www.google.com/s2/favicons?domain=netflix.com&sz=128' }
    ];

    // Predefined Chrome System Shortcuts
    this.chromeSystemPages = [
      { nameKey: 'chrome.bookmarks', url: 'chrome://bookmarks', color: '#4b5563', icon: 'https://www.google.com/favicon.ico' },
      { nameKey: 'chrome.history', url: 'chrome://history', color: '#4b5563', icon: 'https://www.google.com/favicon.ico' },
      { nameKey: 'chrome.downloads', url: 'chrome://downloads', color: '#4b5563', icon: 'https://www.google.com/favicon.ico' },
      { nameKey: 'chrome.settings', url: 'chrome://settings', color: '#4b5563', icon: 'https://www.google.com/favicon.ico' },
      { nameKey: 'chrome.extensions', url: 'chrome://extensions', color: '#4b5563', icon: 'https://www.google.com/favicon.ico' }
    ];
  }

  /**
   * Resolves the effective language from the saved setting.
   * 'auto' uses the browser language; anything other than Spanish
   * falls back to English.
   */
  resolveLang() {
    const pref = (this.state.settings && this.state.settings.language) || 'auto';
    if (pref === 'es' || pref === 'en') return pref;
    const nav = (navigator.language || 'en').toLowerCase();
    return nav.startsWith('es') ? 'es' : 'en';
  }

  /**
   * Translates a key to the current language with {variable} interpolation.
   */
  t(key, vars) {
    const lang = this.lang || 'es';
    let str = (I18N[lang] && I18N[lang][key]) || (I18N.en && I18N.en[key]) || key;
    if (vars) {
      for (const k in vars) str = str.split(`{${k}}`).join(vars[k]);
    }
    return str;
  }

  /**
   * Applies translations to every static element tagged with
   * data-i18n / data-i18n-ph (placeholder) / data-i18n-title.
   */
  applyI18n() {
    this.lang = this.resolveLang();
    document.documentElement.lang = this.lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = this.t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
      el.placeholder = this.t(el.dataset.i18nPh);
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.title = this.t(el.dataset.i18nTitle);
      // Mirror to aria-label when present, so screen readers track the title.
      if (el.hasAttribute('aria-label')) {
        el.setAttribute('aria-label', el.title);
      }
    });
    // Custom CSS tooltip (no native title flash) — element exposes the text via
    // data-tooltip (read by CSS attr()) and aria-label (read by screen readers).
    document.querySelectorAll('[data-i18n-tooltip]').forEach((el) => {
      const text = this.t(el.dataset.i18nTooltip);
      el.setAttribute('data-tooltip', text);
      el.setAttribute('aria-label', text);
    });
    document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
      el.alt = this.t(el.dataset.i18nAlt);
    });
    // Aria-only translations — for containers that need a localized screen-reader
    // label without a visible tooltip (data-i18n-tooltip would also paint one).
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      el.setAttribute('aria-label', this.t(el.dataset.i18nAria));
    });
  }

  /**
   * Renders the extension's version from the manifest into the About dialog.
   * Falls back to the HTML default ("v1.0.0") if `chrome.runtime` is unavailable
   * (i.e. when serving the files outside an extension context for dev).
   */
  applyVersionLabel() {
    if (!this.dom.aboutVersion) return;
    const v = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest)
      ? chrome.runtime.getManifest().version
      : null;
    if (v) this.dom.aboutVersion.textContent = `v${v}`;
  }

  /**
   * Applies the icon corner radius (0% square → 25% squircle → 50% circle).
   * Migrates the legacy boolean `roundIcons` setting into `iconRoundness` if present.
   */
  applyIconRadius() {
    const s = this.state.settings;
    if (typeof s.iconRoundness === 'undefined') {
      s.iconRoundness = s.roundIcons ? 50 : 25; // migrate the old boolean flag
    }
    const pct = Math.max(0, Math.min(50, s.iconRoundness));
    document.documentElement.style.setProperty('--icon-radius', pct + '%');
    if (this.dom.iconRoundnessValue) {
      this.dom.iconRoundnessValue.textContent = pct + '%';
    }
  }

  /**
   * Accent palettes — only the `--accent` HSL triple changes; the rest of the
   * MD3 token system stays put so contrast guarantees still hold. New palettes
   * must keep lightness in the 65-90% band (the value the FAB, dots and pills
   * were designed against).
   */
  static ACCENT_PALETTES = {
    space:    '215 8% 48%',   // Mazda "Titanium Gray" — deep metallic graphite, cool tone
    lavender: '266 61% 86%',
    sand:     '30 65% 78%',
    ocean:    '200 75% 70%',
    forest:   '145 50% 70%',
    mono:     '0 0% 90%'
  };

  applyAccentPalette() {
    const name = this.state.settings.accentPalette || 'lavender';
    const hsl = NewTabController.ACCENT_PALETTES[name] || NewTabController.ACCENT_PALETTES.lavender;
    document.documentElement.style.setProperty('--accent', hsl);

    // Mark the active swatch (for both the visual ring and aria-checked).
    if (this.dom.accentSwatches) {
      this.dom.accentSwatches.querySelectorAll('.accent-swatch').forEach((btn) => {
        const isActive = btn.dataset.palette === name;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-checked', String(isActive));
      });
    }
  }

  /**
   * Global keyboard shortcuts: Esc closes overlays, "/" focuses search,
   * ⌘/Ctrl + "," toggles the Settings drawer.
   */
  handleGlobalKeyDown(e) {
    if (e.key === 'Escape') {
      if (this.dom.shortcutDialog.classList.contains('active')) {
        this.toggleShortcutDialog(false); return;
      }
      if (this.dom.aboutDialog.classList.contains('active')) {
        this.closeAboutDialog(); return;
      }
      if (this.dom.shortcutContextMenu.style.display === 'flex') {
        this.hideContextMenu(); return;
      }
      if (this.dom.settingsDrawer.classList.contains('active')) {
        this.toggleDrawer(false); return;
      }
      if (this.dom.wallpaperDrawer.classList.contains('active')) {
        this.dom.wallpaperDrawer.classList.remove('active'); return;
      }
      // If nothing is open and you're typing in the search box, blur it
      if (document.activeElement === this.dom.searchInput) {
        this.dom.searchInput.blur();
      }
      return;
    }

    // "/" focuses the search box (only when not typing in another input)
    if (e.key === '/' && !this.isTypingTarget(e.target)) {
      e.preventDefault();
      this.dom.searchInput.focus();
      this.dom.searchInput.select();
      return;
    }

    // ⌘/Ctrl + K → focus the search box (universal "command palette" shortcut)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.dom.searchInput.focus();
      this.dom.searchInput.select();
      return;
    }

    // ⌘/Ctrl + "," → toggles the Settings drawer
    if ((e.metaKey || e.ctrlKey) && e.key === ',') {
      e.preventDefault();
      const isOpen = this.dom.settingsDrawer.classList.contains('active');
      this.toggleDrawer(!isOpen);
      return;
    }

    // ⌘/Ctrl + N (or just "n" outside inputs) → open the Add Shortcut dialog.
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      this.openAddShortcutDialog();
      return;
    }

    // "?" → open About (where keyboard shortcuts are listed). Standard
    // "help" shortcut across many apps. Only when not typing in an input.
    if (e.key === '?' && !this.isTypingTarget(e.target)) {
      e.preventDefault();
      this.openAboutDialog();
      return;
    }

    // ←/→ paginate when there are multiple pages and no modal/input is active.
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !this.isTypingTarget(e.target)) {
      if (this.isAnyOverlayOpen()) return;
      const totalPages = this.computePageCount();
      if (totalPages <= 1) return;
      const next = this.state.currentPage + (e.key === 'ArrowRight' ? 1 : -1);
      if (next < 0 || next >= totalPages) return;
      e.preventDefault();
      this.goToPage(next);
      return;
    }
  }

  /**
   * Helper: true while any dialog/drawer/popover is open (used to suppress
   * grid-level keyboard shortcuts when the user is interacting elsewhere).
   */
  isAnyOverlayOpen() {
    return this.dom.shortcutDialog.classList.contains('active') ||
           this.dom.aboutDialog.classList.contains('active') ||
           this.dom.settingsDrawer.classList.contains('active') ||
           this.dom.wallpaperDrawer.classList.contains('active') ||
           this.dom.shortcutContextMenu.style.display === 'flex';
  }

  isTypingTarget(el) {
    if (!el) return false;
    const tag = (el.tagName || '').toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
  }

  /**
   * Click feedback for a shortcut: top progress bar + icon highlight,
   * while the browser starts navigating to the destination.
   */
  showNavProgress(card) {
    if (card) card.classList.add('is-launching');
    if (this.dom.navProgress) this.dom.navProgress.classList.add('active');
  }

  /**
   * Downloads a remote icon and returns it as a data URL to be stored locally.
   * Returns null if the request fails, it's not an image, or it's too heavy.
   */
  async cacheIconUrl(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const blob = await res.blob();
      if (!/^image\//.test(blob.type)) return null;
      if (blob.size > 250 * 1024) return null;
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (_) {
      return null;
    }
  }

  /**
   * Returns a ranked list of favicon candidates for a site URL, preferring
   * higher-resolution sources before falling back to Google's s2 endpoint.
   *
   * - apple-touch-icon.png is a near-universal convention on the site root,
   *   typically 180×180 — crisp at our 80px icon slot.
   * - apple-touch-icon-precomposed.png is the older variant.
   * - s2/favicons?sz=128 only goes as high as the favicon the site exposes,
   *   so it's the last resort.
   *
   * Returns [] if no valid hostname can be extracted. Strings without a
   * protocol get https:// prepended so "posthog.com" still resolves.
   */
  /**
   * Best-effort fetch of the page's <title> for the Add Shortcut dialog.
   * Fills shortcutName only if:
   *   • the URL is http(s) (chrome://, file://, etc. are unfetchable),
   *   • the user hasn't typed in the name field (_userEditedName === false),
   *   • the name field is still empty when the response lands.
   * All failures (CORS, 404, parse error, timeout) are swallowed silently;
   * the user can always type a name themselves.
   */
  async tryFetchPageTitle(rawUrl) {
    if (this._userEditedName) return;
    if (!rawUrl) return;

    // Normalize to absolute http(s). Skip anything we can't fetch.
    const candidate = /^[a-z]+:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    let parsed;
    try { parsed = new URL(candidate); }
    catch (_) { return; }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return;

    // Cancel any in-flight request from a previous keystroke.
    if (this._titleFetchController) {
      this._titleFetchController.abort();
    }
    const controller = new AbortController();
    this._titleFetchController = controller;
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
      const res = await fetch(parsed.href, {
        signal: controller.signal,
        // No credentials — we just want the public HTML, and not sending
        // cookies avoids triggering authenticated personalized responses.
        credentials: 'omit',
        redirect: 'follow'
      });
      if (!res.ok) return;

      const ctype = (res.headers.get('content-type') || '').toLowerCase();
      // Only parse HTML responses. APIs returning JSON/binary aren't useful.
      if (ctype && !ctype.includes('text/html') && !ctype.includes('application/xhtml')) {
        return;
      }

      const html = await res.text();
      const title = this.extractTitleFromHtml(html);
      if (!title) return;

      // Re-check the gate: user may have started typing while we were waiting.
      // If they did, abandon — never overwrite a manual entry.
      if (this._userEditedName) return;
      if (this.dom.shortcutName.value.trim() !== '') return;

      this.dom.shortcutName.value = title.slice(0, 24);
      // Refresh the live preview (fallback letter, etc.) with the new name.
      this.updateLivePreview();
    } catch (_) {
      // Aborted, blocked, or transient network — silent by design.
    } finally {
      clearTimeout(timeoutId);
      if (this._titleFetchController === controller) {
        this._titleFetchController = null;
      }
    }
  }

  /**
   * Extract a usable title from a raw HTML string. Tries (in order):
   *   1. <title> via DOMParser (decoded entities, handles nesting).
   *   2. <meta property="og:title">
   *   3. <meta name="twitter:title">
   *   4. The hostname (best effort, capitalized) — but only as a last resort.
   * Returns the trimmed result, or '' if nothing usable was found.
   */
  extractTitleFromHtml(html) {
    if (!html || typeof html !== 'string') return '';
    let doc;
    try { doc = new DOMParser().parseFromString(html, 'text/html'); }
    catch (_) { return ''; }
    if (!doc) return '';

    // 1. <title>
    const titleEl = doc.querySelector('title');
    if (titleEl && titleEl.textContent) {
      const t = titleEl.textContent.trim().replace(/\s+/g, ' ');
      if (t) return t;
    }
    // 2. og:title
    const og = doc.querySelector('meta[property="og:title"]');
    if (og && og.getAttribute('content')) {
      const t = og.getAttribute('content').trim();
      if (t) return t;
    }
    // 3. twitter:title
    const tw = doc.querySelector('meta[name="twitter:title"]');
    if (tw && tw.getAttribute('content')) {
      const t = tw.getAttribute('content').trim();
      if (t) return t;
    }
    return '';
  }

  resolveFaviconCandidates(siteUrl) {
    if (!siteUrl) return [];
    const candidate = /^[a-z]+:\/\//i.test(siteUrl) ? siteUrl : `https://${siteUrl}`;
    try {
      const host = new URL(candidate).hostname;
      if (!host) return [];
      return [
        `https://${host}/apple-touch-icon.png`,
        `https://${host}/apple-touch-icon-precomposed.png`,
        `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`
      ];
    } catch (_) {
      return [];
    }
  }

  /**
   * Converts shortcut icons that still point to a remote URL into local
   * data URLs in the background. Runs once on load.
   */
  async cacheRemoteIcons() {
    let changed = false;
    for (const s of this.state.shortcuts) {
      if (/^https?:\/\//.test(s.icon || '')) {
        const dataUrl = await this.cacheIconUrl(s.icon);
        if (dataUrl) { s.icon = dataUrl; changed = true; }
      }
    }
    if (changed) {
      await this.repository.saveShortcuts(this.state.shortcuts);
      this.renderShortcuts();
    }
  }

  /**
   * Initialization use case
   */
  async init() {
    // Load state from repository
    this.state.settings = await this.repository.getSettings();
    this.state.shortcuts = await this.repository.getShortcuts();

    // Apply the language before rendering the interface
    this.applyI18n();
    this.applyIconRadius();
    this.applyAccentPalette();
    this.applyVersionLabel();

    // Bind event listeners
    this.bindEvents();
    this.initDialogTabs();

    // Start clock cycle (handles guarded so a re-init doesn't stack intervals).
    this.updateClock();
    if (this._clockInterval) clearInterval(this._clockInterval);
    this._clockInterval = setInterval(() => this.updateClock(), 1000);

    // Re-evaluate the night dim every minute (in case the schedule boundary is crossed)
    if (this._dimNightInterval) clearInterval(this._dimNightInterval);
    this._dimNightInterval = setInterval(() => {
      this.applyNightDim();
      this.updateDimNightUI();
    }, 60000);

    // Initial renders
    this.renderSettingsUI();
    this.renderBackground();
    this.renderSearchUI();
    this.renderShortcuts();
    this.renderPopularPresets();
    this.renderChromeSystemPages();
    this.renderWallpaperDrawer();

    // Convert remaining remote-URL icons to local data URLs in the background
    this.cacheRemoteIcons();

    // Show visual fade in
    document.body.style.opacity = '1';
  }

  /**
   * Bind all UI events safely
   */
  bindEvents() {
    // Settings Drawer toggling
    this.dom.sidebarSettingsBtn.addEventListener('click', () => this.toggleDrawer(true));
    this.dom.closeDrawerBtn.addEventListener('click', () => this.toggleDrawer(false));

    // Floating Add Shortcut button — always visible, independent from the paginated grid.
    if (this.dom.addShortcutFab) {
      this.dom.addShortcutFab.addEventListener('click', () => this.openAddShortcutDialog());
    }

    // Toast manual dismiss button.
    if (this.dom.toastCloseBtn) {
      this.dom.toastCloseBtn.addEventListener('click', () => this.dismissToast());
    }

    // Mouse wheel / trackpad swipe over the grid → flip pages.
    // Throttled so a single wheel tick advances at most one page.
    if (this.dom.shortcutsGridContainer) {
      this._lastWheelPageAt = 0;
      this.dom.shortcutsGridContainer.addEventListener('wheel', (e) => {
        const totalPages = this.computePageCount();
        if (totalPages <= 1) return;

        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (Math.abs(delta) < 4) return;

        e.preventDefault();

        const now = Date.now();
        // Match the page-flip animation (320ms) so the next scroll lands right
        // as the previous slide finishes — feels continuous, not laggy.
        if (now - this._lastWheelPageAt < 280) return;

        const direction = delta > 0 ? 1 : -1;
        const nextPage = this.state.currentPage + direction;
        if (nextPage < 0 || nextPage >= totalPages) return;

        this._lastWheelPageAt = now;
        this.goToPage(nextPage);
      }, { passive: false });
    }

    // Pagination bar (delegated). Click navigates; dblclick renames the page.
    this.bindPaginationEvents();

    // Viewport-height threshold drives the "auto" grid density (3 vs. 4 rows).
    // A single matchMedia listener fires only when we cross the boundary, so this
    // is cheap — no rAF polling, no per-resize churn.
    if (typeof window.matchMedia === 'function') {
      this._gridDensityMql = window.matchMedia('(min-height: 960px)');
      const onDensityChange = () => {
        if ((this.state.settings && this.state.settings.gridDensity) !== 'auto') return;
        if (this._drag) return; // never re-render mid drag-reorder
        this.renderShortcuts();
      };
      // addEventListener is the modern API; older Safari uses addListener.
      if (this._gridDensityMql.addEventListener) {
        this._gridDensityMql.addEventListener('change', onDensityChange);
      } else if (this._gridDensityMql.addListener) {
        this._gridDensityMql.addListener(onDensityChange);
      }
    }

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleGlobalKeyDown(e));

    // Wallpaper Drawer toggling
    this.dom.sidebarWallpapersBtn.addEventListener('click', () => this.toggleWallpaperDrawer());
    this.dom.closeWallpaperDrawerBtn.addEventListener('click', () => {
      this.dom.wallpaperDrawer.classList.remove('active');
    });

    // Drawer tabs (DAILY / STATIC / LIVE) — filter the carousel below.
    this.dom.drawerTabs.forEach(tab => {
      tab.addEventListener('click', () => this.setWallpaperTab(tab.dataset.tab));
    });

    // Other Sidebar buttons
    this.dom.sidebarAboutBtn.addEventListener('click', () => {
      this.openAboutDialog();
    });

    this.dom.aboutCloseBtn.addEventListener('click', () => {
      this.closeAboutDialog();
    });

    document.addEventListener('click', (e) => {
      // Close drawer if clicking outside
      if (this.dom.settingsDrawer.classList.contains('active') &&
          !this.dom.settingsDrawer.contains(e.target) &&
          !this.dom.sidebarSettingsBtn.contains(e.target)) {
        this.toggleDrawer(false);
      }

      // Close context menu popover if clicking outside
      if (this.dom.shortcutContextMenu.style.display === 'flex' &&
          !this.dom.shortcutContextMenu.contains(e.target)) {
        this.hideContextMenu();
      }

      // Close wallpaper drawer if clicking outside and drawer is open
      if (this.dom.wallpaperDrawer.classList.contains('active') &&
          !this.dom.wallpaperDrawer.contains(e.target) &&
          !this.dom.sidebarWallpapersBtn.contains(e.target)) {
        this.dom.wallpaperDrawer.classList.remove('active');
      }

      // Close shortcut dialog if clicking the backdrop overlay directly
      if (e.target === this.dom.shortcutDialog) {
        this.toggleShortcutDialog(false);
      }

      // Close about dialog if clicking the backdrop overlay directly
      if (e.target === this.dom.aboutDialog) {
        this.closeAboutDialog();
      }
    });

    // Clock format settings change
    this.dom.timeFormatToggle.addEventListener('change', async (e) => {
      this.state.settings.timeFormat12 = e.target.checked;
      await this.repository.saveSettings(this.state.settings);
      this.updateClock();
    });

    // Language selector: re-translates the UI immediately
    this.dom.languageSelect.addEventListener('change', async (e) => {
      this.state.settings.language = e.target.value;
      await this.repository.saveSettings(this.state.settings);
      this.applyI18n();
      this.renderSearchUI();
      this.renderShortcuts();
      this.renderWallpaperDrawer();
      this.renderChromeSystemPages();  // Chrome-system tab labels are localized
      this.updateClock();
      this.updateDimNightUI();
    });

    // Show/Hide search bar toggle
    this.dom.searchBarToggle.addEventListener('change', async (e) => {
      this.state.settings.showSearchBar = e.target.checked;
      await this.repository.saveSettings(this.state.settings);
      this.renderSearchUI();
    });

    // Icon corner radius (slider): 0 = square, 25 = squircle, 50 = circle
    this.dom.iconRoundnessSlider.addEventListener('input', (e) => {
      this.state.settings.iconRoundness = parseInt(e.target.value, 10) || 0;
      this.applyIconRadius();
    });
    this.dom.iconRoundnessSlider.addEventListener('change', async () => {
      await this.repository.saveSettings(this.state.settings);
    });

    // Grid density selector: re-paginates the shortcuts grid (3 vs 4 rows, or auto).
    if (this.dom.gridDensitySelect) {
      this.dom.gridDensitySelect.addEventListener('change', async (e) => {
        const value = e.target.value;
        // Accept only known values; ignore anything else (defensive).
        this.state.settings.gridDensity = (value === '3' || value === '4') ? value : 'auto';
        await this.repository.saveSettings(this.state.settings);
        this.renderShortcuts();
      });
    }


    // Accent palette swatches — delegated so swatches can change without rebinding.
    if (this.dom.accentSwatches) {
      this.dom.accentSwatches.addEventListener('click', async (e) => {
        const btn = e.target.closest('.accent-swatch');
        if (!btn || !btn.dataset.palette) return;
        if (!NewTabController.ACCENT_PALETTES[btn.dataset.palette]) return;
        this.state.settings.accentPalette = btn.dataset.palette;
        this.applyAccentPalette();
        await this.repository.saveSettings(this.state.settings);
      });
    }

    // Night dim toggle
    this.dom.dimNightToggle.addEventListener('change', async (e) => {
      this.state.settings.dimNight = e.target.checked;
      await this.repository.saveSettings(this.state.settings);
      this.applyNightDim();
      this.updateDimNightUI();
    });

    // Night dim schedule inputs (Desde / Hasta)
    [this.dom.dimStartInput, this.dom.dimEndInput].forEach((input) => {
      input.addEventListener('change', async () => {
        this.state.settings.dimStart = this.dom.dimStartInput.value || '19:00';
        this.state.settings.dimEnd = this.dom.dimEndInput.value || '07:00';
        await this.repository.saveSettings(this.state.settings);
        this.applyNightDim();
        this.updateDimNightUI();
      });
    });

    // Executing searches
    const triggerSearch = () => {
      const query = this.dom.searchInput.value.trim();
      if (!query) return;
      // Route the query through chrome.search so it lands on the user's
      // default search engine (set in Chrome's own settings) instead of a
      // hardcoded provider — this keeps the new tab page single-purpose and
      // respects the user's search choice per the Web Store policy.
      // Fall back to a plain Google URL in non-extension dev contexts.
      if (typeof chrome !== 'undefined' && chrome.search && chrome.search.query) {
        chrome.search.query({ text: query, disposition: 'CURRENT_TAB' });
      } else {
        window.location.href = 'https://www.google.com/search?q=' + encodeURIComponent(query);
      }
    };

    this.dom.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') triggerSearch();
    });
    this.dom.searchFormBtn.addEventListener('click', triggerSearch);

    // Wallpaper custom controls change
    this.dom.bgProviderSelect.addEventListener('change', async (e) => {
      const value = e.target.value;
      this.state.settings.bgProvider = value;
      this.toggleBgInputFields(value);
      await this.repository.saveSettings(this.state.settings);
      this.renderBackground();
      this.renderWallpaperDrawer();
      // Wallpaper / Video gallery: close the side panel and open the visual drawer
      if (value === 'static' || value === 'video') {
        this.toggleDrawer(false);
        this.dom.wallpaperDrawer.classList.add('active');
      }
    });

    this.dom.bgUrlInput.addEventListener('change', async (e) => {
      const val = e.target.value.trim();
      this.state.settings.bgCustomUrl = val;
      this.state.settings.bgUrl = val;
      await this.repository.saveSettings(this.state.settings);
      this.renderBackground();
    });

    this.dom.bgVideoInput.addEventListener('change', async (e) => {
      const val = e.target.value.trim();
      this.state.settings.bgVideoUrl = val;
      this.state.settings.bgUrl = val;
      this.state.settings.bgProvider = 'video-url';
      await this.repository.saveSettings(this.state.settings);
      this.renderBackground();
    });

    // Upload video from disk: stored in IndexedDB (no ~10 MB chrome.storage cap)
    this.dom.bgVideoFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await this.idbSaveVideo(file);
        this.state.settings.bgProvider = 'video-file';
        await this.repository.saveSettings(this.state.settings);
        this.dom.bgVideoFileLabel.textContent = file.name;
        this.renderBackground();
        this.showToast(this.t('toast.bgUpdated'));
      } catch (err) {
        console.error('Failed to save video:', err);
        this.showToast(this.t('settings.videoSaveFailed'));
      }
    });

    this.dom.bgFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      this.dom.fileUploadLabel.textContent = file.name;
      const reader = new FileReader();
      reader.onload = async (event) => {
        this.state.settings.bgFileBase64 = event.target.result;
        await this.repository.saveSettings(this.state.settings);
        this.renderBackground();
        this.showToast(this.t('toast.bgUpdated'));
      };
      reader.readAsDataURL(file);
    });

    // Add Shortcut Modal color selection swatches
    this.dom.colorSwatches.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        this.dom.colorSwatches.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this.updateLivePreview();
      });
    });

    // Live inputs on Add/Edit Modal Custom tab. Manual typing in the name
    // field locks out the auto-title fetch so we never trample the user.
    this.dom.shortcutName.addEventListener('input', () => {
      this._userEditedName = true;
      this.updateLivePreview();
    });
    this.dom.shortcutIconUrlInput.addEventListener('input', () => this.updateLivePreview());

    // Auto-resolve the site's favicon as the user types/pastes the URL.
    // Debounced so we don't recompute on every keystroke. The resolved URL
    // only feeds the preview and the save fallback — it never writes into
    // the manual icon input, so the user's own choice always wins.
    this.dom.shortcutUrl.addEventListener('input', () => {
      clearTimeout(this._faviconDebounce);
      this._faviconDebounce = setTimeout(() => {
        const url = this.dom.shortcutUrl.value.trim();
        this.autoFaviconCandidates = this.resolveFaviconCandidates(url);
        this.updateLivePreview();
        // Kick off the page-title fetch alongside favicon resolution. The
        // helper itself bails if the user has typed in the name field or if
        // the URL isn't fetchable.
        this.tryFetchPageTitle(url);
      }, 300);
      // Editing the URL again is a fresh intent — drop any prior "keep the
      // original" pin so the new auto-favicon can paint.
      this._iconRestoredToOriginal = false;
      // Toggle the chip immediately; this branch is a pure DOM read/write.
      this.updateIconChangedHint();
    });

    this.dom.iconRestoreBtn.addEventListener('click', () => this.restoreOriginalIconUseCase());
    this.dom.shortcutFitToggle.addEventListener('change', () => this.updateLivePreview());
    this.dom.shortcutZoomSlider.addEventListener('input', (e) => {
      const zoom = e.target.value;
      this.dom.shortcutPreviewImg.style.transform = `scale(${zoom})`;
      this.updateZoomLabel();
    });

    // Add Shortcut icon file selector
    this.dom.shortcutIconInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.dom.iconFileLabel.textContent = file.name;
      } else {
        this.dom.iconFileLabel.textContent = this.t('dialog.selectFile');
      }
      this.updateLivePreview();
    });

    // Modal Add Shortcut Actions
    this.dom.dialogCancelBtn.addEventListener('click', () => this.toggleShortcutDialog(false));
    this.dom.dialogSaveBtn.addEventListener('click', () => this.saveShortcutUseCase());

    // Context Menu click events
    this.dom.ctxDeleteBtn.addEventListener('click', () => this.deleteShortcutUseCase(this.activeContextShortcutId));
    this.dom.ctxEditBtn.addEventListener('click', () => this.openEditShortcutDialog(this.activeContextShortcutId));
    this.dom.ctxDuplicateBtn.addEventListener('click', () => this.duplicateShortcutUseCase(this.activeContextShortcutId));
    this.dom.ctxOpenTabBtn.addEventListener('click', () => this.openShortcutInNewTab(this.activeContextShortcutId));
    this.dom.ctxOpenIncognitoBtn.addEventListener('click', () => this.openShortcutInIncognito(this.activeContextShortcutId));
    this.dom.ctxCopyUrlBtn.addEventListener('click', () => this.copyShortcutUrl(this.activeContextShortcutId));

    // Export configuration as .json file
    this.dom.exportJsonBtn.addEventListener('click', () => this.exportBackupUseCase());
    // Import configuration from file
    this.dom.importJsonBtn.addEventListener('click', () => this.importBackupUseCase());
    // Show selected filename and toggle import button availability accordingly.
    this.dom.importJsonFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      this.dom.importFileLabel.textContent = file ? file.name : this.t('settings.selectBackup');
      this.dom.importJsonBtn.disabled = !file;
    });
    // Reset to factory defaults
    this.dom.resetConfigBtn.addEventListener('click', () => this.resetConfigUseCase());
  }

  // ==========================================
  // VIEW RENDER ENGINES
  // ==========================================

  /**
   * Clock and Date rendering cycle
   */
  updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    if (this.state.settings.timeFormat12) {
      hours = hours % 12 || 12;
    }
    
    const formattedHours = String(hours).padStart(2, '0');
    this.dom.clockTime.textContent = `${formattedHours}:${minutes}`;

    // Elegant date formatter in Spanish
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    this.dom.clockDate.textContent = now.toLocaleDateString(this.lang === 'en' ? 'en-US' : 'es-ES', options);
  }

  /**
   * Drawer toggle use case
   */
  toggleDrawer(show) {
    if (show) {
      this.dom.settingsDrawer.classList.add('active');
      this.dom.wallpaperDrawer.classList.remove('active'); // keep them mutually exclusive
    } else {
      this.dom.settingsDrawer.classList.remove('active');
    }
  }

  /**
   * Toggles the wallpaper bottom drawer; opening it closes the Settings drawer.
   * When opening, preselects the tab matching the current bgProvider so the
   * user lands on the section they're already using.
   */
  toggleWallpaperDrawer() {
    const open = !this.dom.wallpaperDrawer.classList.contains('active');
    this.dom.wallpaperDrawer.classList.toggle('active', open);
    if (open) {
      this.dom.settingsDrawer.classList.remove('active');
      this.setWallpaperTab(this.tabFromProvider(this.state.settings.bgProvider));
    }
  }

  /**
   * Maps a bgProvider value to the wallpaper drawer tab that should be active.
   * Anything video-flavored (curated, URL, file) lands on the LIVE tab.
   */
  tabFromProvider(provider) {
    if (provider === 'daily') return 'daily';
    if (provider === 'video' || provider === 'video-url' || provider === 'video-file') return 'live';
    return 'static';
  }

  /**
   * Switches the active wallpaper tab. Updates the tab buttons' active state
   * and the carousel container's data-active-tab attribute (CSS handles the
   * panel visibility based on that attribute).
   */
  setWallpaperTab(tab) {
    if (!tab) return;
    this.dom.wallpaperCarousel.dataset.activeTab = tab;
    this.dom.drawerTabs.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
  }

  /**
   * Dialog modal toggle
   */
  toggleShortcutDialog(show) {
    if (show) {
      this._previouslyFocused = document.activeElement;
      this.dom.shortcutDialog.removeAttribute('inert');
      this.dom.shortcutDialog.classList.add('active');
      this.dom.shortcutDialog.setAttribute('aria-hidden', 'false');
      this.installFocusTrap(this.dom.shortcutDialog);
      this.dom.shortcutName.focus();
    } else {
      // Move focus OUT of the dialog BEFORE flagging it inert/aria-hidden.
      // Calling .focus() on a non-focusable previouslyFocused (e.g. <body>)
      // is a no-op, so we still need to actively blur any descendant that
      // currently holds focus (typically the Save button after a click).
      this.uninstallFocusTrap();
      const focused = document.activeElement;
      if (focused && this.dom.shortcutDialog.contains(focused)) {
        focused.blur();
      }
      if (this._previouslyFocused && typeof this._previouslyFocused.focus === 'function') {
        try { this._previouslyFocused.focus(); } catch (_) {}
      }
      // `inert` automatically prevents focus AND keyboard interaction while
      // hidden; aria-hidden still helps screen readers ignore the subtree.
      this.dom.shortcutDialog.setAttribute('inert', '');
      this.dom.shortcutDialog.classList.remove('active');
      this.dom.shortcutDialog.setAttribute('aria-hidden', 'true');
      this.resetShortcutForm();
    }
  }

  /**
   * Install a Tab/Shift+Tab focus trap inside the given container so the user
   * can't escape an open modal with the keyboard. Removed by uninstallFocusTrap.
   */
  installFocusTrap(container) {
    this.uninstallFocusTrap();
    const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    this._focusTrap = (e) => {
      if (e.key !== 'Tab') return;
      const focusables = Array.from(container.querySelectorAll(FOCUSABLE))
        .filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    container.addEventListener('keydown', this._focusTrap);
    this._focusTrapContainer = container;
  }

  uninstallFocusTrap() {
    if (this._focusTrap && this._focusTrapContainer) {
      this._focusTrapContainer.removeEventListener('keydown', this._focusTrap);
    }
    this._focusTrap = null;
    this._focusTrapContainer = null;
  }

  openAboutDialog() {
    this._previouslyFocused = document.activeElement;
    this.dom.aboutDialog.removeAttribute('inert');
    this.dom.aboutDialog.classList.add('active');
    this.dom.aboutDialog.setAttribute('aria-hidden', 'false');
    this.installFocusTrap(this.dom.aboutDialog);
    if (this.dom.aboutCloseBtn) this.dom.aboutCloseBtn.focus();
  }

  closeAboutDialog() {
    this.uninstallFocusTrap();
    const focused = document.activeElement;
    if (focused && this.dom.aboutDialog.contains(focused)) {
      focused.blur();
    }
    if (this._previouslyFocused && typeof this._previouslyFocused.focus === 'function') {
      try { this._previouslyFocused.focus(); } catch (_) {}
    }
    this.dom.aboutDialog.setAttribute('inert', '');
    this.dom.aboutDialog.classList.remove('active');
    this.dom.aboutDialog.setAttribute('aria-hidden', 'true');
  }

  resetShortcutForm() {
    this.dom.shortcutName.value = '';
    this.dom.shortcutUrl.value = '';
    if (this.dom.shortcutSection) this.dom.shortcutSection.value = '';
    this.dom.shortcutIconInput.value = '';
    this.dom.shortcutIconUrlInput.value = '';
    this.dom.shortcutZoomSlider.value = '1.00';
    this.dom.shortcutFitToggle.checked = false;
    this.dom.iconFileLabel.textContent = this.t('dialog.selectFile');
    // Drop any auto-favicon carried over from a previous dialog session.
    this.autoFaviconCandidates = [];
    clearTimeout(this._faviconDebounce);
    // Reset the auto-title gate. The form starts empty, so the next URL settle
    // is allowed to populate the name field.
    this._userEditedName = false;
    if (this._titleFetchController) {
      this._titleFetchController.abort();
      this._titleFetchController = null;
    }
    this._editOriginalUrl = '';
    this._editOriginalIcon = '';
    this._iconRestoredToOriginal = false;
    if (this.dom.iconUrlActions) this.dom.iconUrlActions.hidden = true;
    this.dom.colorSwatches.querySelectorAll('.color-swatch').forEach((s, idx) => {
      if (idx === 0) s.classList.add('active');
      else s.classList.remove('active');
    });
    this.updateLivePreview();

    // Reset back to Custom tab as default
    const customTabBtn = Array.from(this.dom.dialogTabButtons).find(b => b.dataset.tab === 'custom');
    if (customTabBtn) customTabBtn.click();

    this.activeContextShortcutId = null;
  }

  /**
   * Show/hide the "URL changed → refresh or restore icon" chips. Only relevant
   * in edit mode. Comparison normalises trailing whitespace so accidental
   * spaces don't trigger the hint.
   */
  updateIconChangedHint() {
    if (!this.dom.iconUrlActions) return;
    const editing = !!this.activeContextShortcutId;
    const currentUrl = (this.dom.shortcutUrl.value || '').trim();
    const originalUrl = (this._editOriginalUrl || '').trim();
    // The chip only makes sense while the URL differs and the user hasn't
    // already opted into keeping the original icon.
    const shouldShow = editing && currentUrl && currentUrl !== originalUrl
      && !this._iconRestoredToOriginal;
    this.dom.iconUrlActions.hidden = !shouldShow;
  }

  /**
   * Pin the icon to the snapshot captured when the edit dialog opened, even
   * though the URL has changed. Sets _iconRestoredToOriginal so the preview
   * and save path both ignore auto-favicon and use the original. The flag is
   * cleared automatically the next time the URL changes again.
   */
  restoreOriginalIconUseCase() {
    this._iconRestoredToOriginal = true;
    // Reset the icon-source inputs so no stale manual value overrides the
    // original on save (saveShortcutUseCase falls back to the stored icon
    // when both iconFile and iconUrl are empty).
    this.dom.shortcutIconInput.value = '';
    this.dom.shortcutIconUrlInput.value = '';
    const icon = this._editOriginalIcon || '';
    if (icon && icon.startsWith('data:')) {
      this.dom.iconFileLabel.textContent = this.t('dialog.uploadedIcon');
    } else {
      this.dom.iconFileLabel.textContent = this.t('dialog.uploadImageFile');
    }
    this.updateIconChangedHint();
    this.updateLivePreview();
    this.showToast(this.t('toast.iconRestored'));
  }

  /**
   * Search UI Render
   */
  renderSearchUI() {
    this.dom.searchContainer.style.display =
      this.state.settings.showSearchBar ? 'block' : 'none';
  }

  /**
   * Toggle settings background field options
   */
  toggleBgInputFields(provider) {
    this.dom.bgUrlInputContainer.style.display = provider === 'custom-url' ? 'flex' : 'none';
    this.dom.bgFileInputContainer.style.display = provider === 'custom-file' ? 'flex' : 'none';
    this.dom.bgVideoInputContainer.style.display = provider === 'video-url' ? 'flex' : 'none';
    this.dom.bgVideoFileContainer.style.display = provider === 'video-file' ? 'flex' : 'none';
  }

  /**
   * Render custom Settings Panel Controls to match State
   */
  renderSettingsUI() {
    this.dom.timeFormatToggle.checked = this.state.settings.timeFormat12;
    this.dom.languageSelect.value = this.state.settings.language || 'auto';
    this.dom.searchBarToggle.checked = this.state.settings.showSearchBar;
    const rd = typeof this.state.settings.iconRoundness === 'undefined'
      ? (this.state.settings.roundIcons ? 50 : 25)
      : this.state.settings.iconRoundness;
    this.dom.iconRoundnessSlider.value = rd;
    this.dom.iconRoundnessValue.textContent = rd + '%';
    if (this.dom.gridDensitySelect) {
      const gd = this.state.settings.gridDensity;
      this.dom.gridDensitySelect.value = (gd === '3' || gd === '4') ? gd : 'auto';
    }
    this.dom.dimNightToggle.checked = this.state.settings.dimNight;
    this.dom.dimStartInput.value = this.state.settings.dimStart || '19:00';
    this.dom.dimEndInput.value = this.state.settings.dimEnd || '07:00';
    this.updateDimNightUI();

    const provider = this.state.settings.bgProvider || 'gradient';
    this.dom.bgProviderSelect.value = provider;
    this.toggleBgInputFields(provider);
    
    const vUrl = this.state.settings.bgVideoUrl || '';
    // The URL field only mirrors external addresses, not internal gallery paths
    this.dom.bgVideoInput.value = vUrl.startsWith('wallpapers/') ? '' : vUrl;
    this.dom.bgVideoFileLabel.textContent = this.state.settings.bgProvider === 'video-file'
      ? this.t('settings.videoLoaded')
      : this.t('settings.chooseVideo');
    this.dom.bgUrlInput.value = this.state.settings.bgCustomUrl || '';
  }

  /**
   * Is the current time within the configured night range?
   * Supports ranges that cross midnight (e.g. 19:00 → 07:00).
   */
  isNightTime() {
    const toMinutes = (hhmm) => {
      const [h, m] = (hhmm || '').split(':').map(Number);
      return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
    };
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const start = toMinutes(this.state.settings.dimStart || '19:00');
    const end = toMinutes(this.state.settings.dimEnd || '07:00');
    if (start === end) return false;
    return start < end
      ? (cur >= start && cur < end)          // range within the same day
      : (cur >= start || cur < end);         // range that crosses midnight
  }

  /**
   * Applies or removes the background dim based on the toggle and the schedule.
   */
  applyNightDim() {
    const active = this.state.settings.dimNight && this.isNightTime();
    this.dom.bgImage.classList.toggle('dimmed', active);
  }

  /**
   * Refreshes the "Dim background at night" section: expands the schedule
   * when active and updates the live status line.
   */
  updateDimNightUI() {
    const on = this.state.settings.dimNight;
    const status = this.dom.dimNightStatus;
    if (!status) return;

    this.dom.dimNightOptions.classList.toggle('expanded', on);

    status.textContent = '';
    if (!on) {
      status.className = 'dim-night-status';
      return;
    }

    const icon = document.createElement('span');
    icon.className = 'dim-night-icon';
    const label = document.createElement('span');

    if (this.isNightTime()) {
      icon.textContent = '🌙';
      label.textContent = this.t('dimNight.activeNow');
      status.className = 'dim-night-status is-night';
    } else {
      const start = this.state.settings.dimStart || '19:00';
      icon.textContent = '☀️';
      label.textContent = this.t('dimNight.daytime', { time: start });
      status.className = 'dim-night-status is-day';
    }
    status.append(icon, label);
  }

  renderBackground() {
    const settings = this.state.settings;
    this.dom.bgImage.replaceChildren(); // Clear video tags or content
    this.dom.bgImage.className = 'bg-image-wrapper'; // Reset class
    
    // Set immediate, beautiful premium animated gradient so there is never a blank screen
    this.dom.bgImage.style.background = 'var(--bg-gradient)';
    this.dom.bgImage.style.backgroundImage = 'none';
    this.dom.bgImage.classList.add('loaded'); // Show instantly

    this.applyNightDim();

    // Animated gradient: CSS animates the class, so the inline background is cleared
    if (settings.bgProvider === 'gradient') {
      this.dom.bgImage.classList.add('gradient-animated');
      this.dom.bgImage.style.background = '';
      this.dom.bgImage.style.backgroundImage = '';
    }

    let bgUrlToApply = '';

    if (settings.bgProvider === 'daily') {
      // Random but stable image for the whole day: the seed is the date,
      // so it changes every day and doesn't flicker between new tabs.
      const now = new Date();
      const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
      let h = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b);
      h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
      h = h ^ (h >>> 16);
      // Rotates among every available wallpaper (not just bg1-bg6)
      const wp = CURATED_WALLPAPERS[(h >>> 0) % CURATED_WALLPAPERS.length];
      bgUrlToApply = wp.file;
    } else if (settings.bgProvider === 'static') {
      bgUrlToApply = settings.bgStaticUrl || 'wallpapers/bg1.png';
    } else if (settings.bgProvider === 'custom-url') {
      bgUrlToApply = settings.bgCustomUrl || settings.bgUrl;
    } else if (settings.bgProvider === 'custom-file' && settings.bgFileBase64) {
      bgUrlToApply = settings.bgFileBase64;
    }

    if (settings.bgProvider === 'video-file') {
      // User-uploaded video, stored in IndexedDB. Revoke the previous blob URL
      // (if any) so we don't leak memory each time the background re-renders.
      if (this._currentVideoBlobUrl) {
        URL.revokeObjectURL(this._currentVideoBlobUrl);
        this._currentVideoBlobUrl = null;
      }
      this.idbGetVideoURL().then((url) => {
        if (url) {
          this._currentVideoBlobUrl = url;
          this.mountBackgroundVideo(url);
        }
      }).catch((err) => console.error('Error reading local video:', err));
    } else if (settings.bgProvider === 'video' || settings.bgProvider === 'video-url') {
      // Leaving 'video-file' for another provider — release the held blob URL.
      if (this._currentVideoBlobUrl) {
        URL.revokeObjectURL(this._currentVideoBlobUrl);
        this._currentVideoBlobUrl = null;
      }
      const videoUrl = settings.bgVideoUrl || settings.bgUrl || 'wallpapers/vid_rain.mp4';
      this.mountBackgroundVideo(videoUrl);
    } else if (bgUrlToApply) {
      // Same: release the blob URL if we're switching from a video-file background.
      if (this._currentVideoBlobUrl) {
        URL.revokeObjectURL(this._currentVideoBlobUrl);
        this._currentVideoBlobUrl = null;
      }
      const img = new Image();
      img.src = bgUrlToApply;
      img.onload = () => {
        // Escape backslashes and single quotes so a hostile URL can't break out
        // of the url('...') CSS literal and inject extra declarations.
        const safeUrl = bgUrlToApply.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        this.dom.bgImage.style.backgroundImage = `url('${safeUrl}')`;
      };
      img.onerror = () => {
        console.error('Error loading image background:', bgUrlToApply);
        // Fallback gradient is already displaying
      };
    }
  }

  /**
   * Creates and plays the background <video> with the given source (URL or objectURL).
   */
  mountBackgroundVideo(videoUrl) {
    if (!videoUrl) return;
    const video = document.createElement('video');
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.preload = 'auto';
    video.setAttribute('playsinline', '');
    video.style.cssText =
      'opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;' +
      'object-fit:cover;transition:opacity 1s ease-in-out';

    const reveal = () => { video.style.opacity = '1'; };
    video.onloadeddata = reveal;
    video.oncanplay = reveal;
    video.onloadedmetadata = reveal;
    video.onplay = reveal;
    video.onerror = () => console.error('Error loading video background:', videoUrl);

    video.src = videoUrl;
    this.dom.bgImage.appendChild(video);
    video.play().catch((err) => console.log('Autoplay blocked:', err));
    if (video.readyState >= 2) reveal();
  }

  /**
   * ── Local background video in IndexedDB ──
   * Lets the user use their own videos without the ~10 MB chrome.storage cap.
   */
  openVideoDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('dashtab-bg', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('video')) db.createObjectStore('video');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async idbSaveVideo(blob) {
    const db = await this.openVideoDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('video', 'readwrite');
      tx.objectStore('video').put(blob, 'current');
      tx.oncomplete = () => { db.close(); resolve(true); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }

  async idbGetVideoURL() {
    const db = await this.openVideoDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('video', 'readonly');
      const req = tx.objectStore('video').get('current');
      req.onsuccess = () => {
        db.close();
        resolve(req.result ? URL.createObjectURL(req.result) : null);
      };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  }

  /**
   * Pick the number of rows for the shortcuts grid based on the active
   * density setting. 'auto' uses a viewport-height threshold so 16" / 4K
   * displays get 4 rows while 13–14" laptops keep the compact 3-row layout.
   */
  computeSlotsPerPage() {
    const density = this.state.settings && this.state.settings.gridDensity;
    let rows;
    if (density === '4') {
      rows = 4;
    } else if (density === '3') {
      rows = 3;
    } else {
      // 'auto' (default). Threshold balances 13" laptops (~800px usable with
      // the Chrome toolbar) against 16"+ desktops (>=1080px).
      rows = window.innerHeight >= 960 ? 4 : 3;
    }
    return 7 * rows;
  }

  /**
   * Build the per-page partition of state.shortcuts. Each entry is an array
   * Render the paginated grid: a flat 7 × N icon grid sliced by slotsPerPage.
   */
  renderShortcuts() {
    this.state.slotsPerPage = this.computeSlotsPerPage();
    this.dom.shortcutsGrid.replaceChildren();
    const totalShortcuts = this.state.shortcuts.length;

    if (totalShortcuts === 0) {
      this.renderEmptyState();
      this.renderPagination(1);
      return;
    }

    const slots = this.state.slotsPerPage;
    const totalPages = Math.ceil(totalShortcuts / slots) || 1;

    if (this.state.currentPage >= totalPages) this.state.currentPage = totalPages - 1;
    if (this.state.currentPage < 0) this.state.currentPage = 0;

    const startIdx = this.state.currentPage * slots;
    const endIdx = Math.min(startIdx + slots, totalShortcuts);

    for (let i = startIdx; i < endIdx; i++) {
      this.dom.shortcutsGrid.appendChild(this.buildShortcutCard(this.state.shortcuts[i], i));
    }

    this.renderPagination(totalPages);
  }

  createFallbackLetter(wrapper, shortcut) {
    const fallback = document.createElement('div');
    fallback.className = 'shortcut-fallback-icon';
    fallback.style.backgroundColor = shortcut.color || '#1f2937';
    fallback.textContent = shortcut.name ? shortcut.name.charAt(0) : 'T';
    wrapper.appendChild(fallback);
  }

  /**
   * Builds the kebab "more options" SVG (3 vertical dots) without innerHTML.
   * Used by every shortcut card's top-right options button.
   */
  createKebabSvg() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    [5, 12, 19].forEach((cy) => {
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', '12');
      c.setAttribute('cy', String(cy));
      c.setAttribute('r', '1.8');
      svg.appendChild(c);
    });
    return svg;
  }

  /**
   * Welcome / empty state when there are zero shortcuts. Renders a centered
   * CTA that opens the Add Shortcut dialog on click.
   */
  renderEmptyState() {
    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'shortcuts-empty-state';
    cta.addEventListener('click', () => this.openAddShortcutDialog());

    const iconWrap = document.createElement('div');
    iconWrap.className = 'shortcuts-empty-icon';
    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    const line1 = document.createElementNS(svgNs, 'line');
    line1.setAttribute('x1', '12'); line1.setAttribute('y1', '5');
    line1.setAttribute('x2', '12'); line1.setAttribute('y2', '19');
    const line2 = document.createElementNS(svgNs, 'line');
    line2.setAttribute('x1', '5'); line2.setAttribute('y1', '12');
    line2.setAttribute('x2', '19'); line2.setAttribute('y2', '12');
    svg.appendChild(line1);
    svg.appendChild(line2);
    iconWrap.appendChild(svg);

    const title = document.createElement('div');
    title.className = 'shortcuts-empty-title';
    title.textContent = this.t('shortcuts.emptyTitle');

    const subtitle = document.createElement('div');
    subtitle.className = 'shortcuts-empty-subtitle';
    subtitle.textContent = this.t('shortcuts.emptySubtitle');

    cta.appendChild(iconWrap);
    cta.appendChild(title);
    cta.appendChild(subtitle);
    this.dom.shortcutsGrid.appendChild(cta);
  }

  /**
   * Navigate to a specific page with a slide animation. Direction is inferred
   * from the delta between current and target page.
   */
  goToPage(targetPage) {
    if (targetPage === this.state.currentPage) return;
    const direction = targetPage > this.state.currentPage ? 'next' : 'prev';
    this.state.currentPage = targetPage;
    const grid = this.dom.shortcutsGrid;
    grid.classList.remove('flip-next', 'flip-prev');
    // Force reflow so the animation re-triggers even when the class is re-added.
    void grid.offsetWidth;
    grid.classList.add(`flip-${direction}`);
    this.renderShortcuts();

    // Drop the animation class once the slide finishes so subsequent renders
    // (drag-reorder, dot click) don't accidentally inherit it.
    if (this._flipCleanup) clearTimeout(this._flipCleanup);
    this._flipCleanup = setTimeout(() => {
      grid.classList.remove('flip-next', 'flip-prev');
    }, 340);
  }

  /**
   * Build one shortcut card (anchor + glass wrapper + image/fallback + kebab +
   * title + optional select badge + drag/contextmenu hooks). Pulled out so the
   * renderShortcuts loop stays readable now that cards live inside per-section
   * bento containers.
   */
  buildShortcutCard(shortcut, globalIdx) {
    const card = document.createElement('a');
    card.className = 'shortcut-card';
    card.href = shortcut.url;
    card.draggable = false; // prevent the native <a> URL drag

    card.addEventListener('click', (e) => {
      if (e.target.closest('.shortcut-menu-btn')) {
        e.preventDefault();
        return;
      }
      if (this._didDrag) {
        e.preventDefault();
        return;
      }

      const isPlainClick = e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey;

      // Modifier-clicks (middle / ⌘ / Ctrl / Shift) let the native <a> open
      // in a new tab/window — no navigation in the current tab, so no
      // animation needed here.
      if (!isPlainClick) return;

      // Plain click → the current tab is about to navigate. Intercept,
      // show the "launching" pulse for a tick, THEN navigate so the user
      // gets visible feedback (otherwise the browser starts loading
      // immediately and the animation never gets a frame to render).
      e.preventDefault();
      this.showNavProgress(card);
      const target = shortcut.url;
      // 380ms ≈ time for the icon to complete one full pulse + ripple
      // before the page swaps. Slightly slower than instant nav but
      // explicit user feedback that the click registered.
      setTimeout(() => {
        if (target.startsWith('chrome://') && typeof chrome !== 'undefined'
            && chrome.tabs && chrome.tabs.update) {
          chrome.tabs.update({ url: target });
        } else {
          window.location.href = target;
        }
      }, 380);
    });

    // Glass wrapper
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'shortcut-icon-wrapper';
    if (shortcut.color === 'transparent') {
      iconWrapper.style.background = 'transparent';
      iconWrapper.style.boxShadow = 'none';
      iconWrapper.style.backdropFilter = 'none';
      iconWrapper.style.webkitBackdropFilter = 'none';
      iconWrapper.style.border = 'none';
    } else {
      iconWrapper.style.background = shortcut.color || 'var(--glass-bg)';
      iconWrapper.style.boxShadow = '';
      iconWrapper.style.backdropFilter = '';
      iconWrapper.style.webkitBackdropFilter = '';
      iconWrapper.style.border = '';
    }

    if (shortcut.icon) {
      const img = document.createElement('img');
      img.src = shortcut.icon;
      img.alt = shortcut.name;
      img.draggable = false;
      img.style.setProperty('--icon-zoom', shortcut.zoom || 1.0);

      if (shortcut.fit === 'cover') {
        img.style.objectFit = 'cover';
        img.style.padding = '0';
        img.style.borderRadius = '';
      } else {
        img.style.objectFit = '';
        img.style.padding = '';
        img.style.borderRadius = '';
      }

      img.onerror = () => {
        img.remove();
        this.createFallbackLetter(iconWrapper, shortcut);
      };
      iconWrapper.appendChild(img);
    } else {
      this.createFallbackLetter(iconWrapper, shortcut);
    }

    // MD3 Tonal "more options" button (kebab — opens the full context menu)
    const menuBtn = document.createElement('button');
    menuBtn.className = 'shortcut-menu-btn';
    menuBtn.title = this.t('shortcut.options');
    menuBtn.appendChild(this.createKebabSvg());
    menuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showContextMenu(e, shortcut.id);
    });

    const title = document.createElement('div');
    title.className = 'shortcut-title';
    title.textContent = shortcut.name;

    card.appendChild(iconWrapper);
    card.appendChild(menuBtn);
    card.appendChild(title);

    // Drag-sort + custom right-click menu.
    card.dataset.index = globalIdx;
    card.addEventListener('pointerdown', (e) => this.onCardPointerDown(e, card));
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e, shortcut.id);
    });

    return card;
  }

  /**
   * Dynamic pagination indicators. Pages with a label in settings.pageLabels[i]
   * render as a text pill ("Cloud", "Proyectos"); pages without one keep the
   * compact dot. Double-click any item to rename the page inline.
   */
  renderPagination(totalPages) {
    this.dom.paginationDots.replaceChildren();
    if (totalPages <= 1) return;

    const labels = Array.isArray(this.state.settings.pageLabels)
      ? this.state.settings.pageLabels
      : [];

    for (let i = 0; i < totalPages; i++) {
      const label = (typeof labels[i] === 'string' ? labels[i] : '').trim();
      const item = document.createElement('div');
      const isActive = i === this.state.currentPage;

      if (label) {
        item.className = `page-tab${isActive ? ' active' : ''}`;
        // textContent — never innerHTML — so a hostile label can't inject HTML.
        item.textContent = label;
      } else {
        item.className = `dot${isActive ? ' active' : ''}`;
      }

      item.dataset.pageIndex = String(i);
      item.setAttribute('role', 'tab');
      item.setAttribute('aria-selected', isActive ? 'true' : 'false');
      item.setAttribute('aria-label', label
        ? this.t('pagination.tabAria', { label, index: i + 1 })
        : this.t('pagination.dotAria', { index: i + 1 }));

      this.dom.paginationDots.appendChild(item);
    }
  }

  /**
   * Delegated click + dblclick handlers for the pagination bar. Attached once
   * in bindEvents (renderPagination rebuilds children frequently, so per-item
   * listeners would lose dblclick if the first click triggered a re-render).
   */
  bindPaginationEvents() {
    if (!this.dom.paginationDots || this._paginationEventsBound) return;
    this._paginationEventsBound = true;

    this.dom.paginationDots.addEventListener('click', (e) => {
      // Clicks inside the rename input shouldn't be treated as navigation.
      if (e.target.closest('.page-tab-input')) return;
      const tab = e.target.closest('[data-page-index]');
      if (!tab || tab.classList.contains('editing')) return;
      const idx = parseInt(tab.dataset.pageIndex, 10);
      if (!Number.isInteger(idx)) return;
      this.goToPage(idx);
    });

    this.dom.paginationDots.addEventListener('dblclick', (e) => {
      const tab = e.target.closest('[data-page-index]');
      if (!tab) return;
      e.preventDefault();
      const idx = parseInt(tab.dataset.pageIndex, 10);
      if (!Number.isInteger(idx)) return;
      this.enterPageRenameMode(idx, tab);
    });
  }

  /**
   * Replace a pagination dot/tab with an inline <input> so the user can name
   * (or rename) the page. Empty value clears the label.
   */
  enterPageRenameMode(pageIndex, element) {
    if (!element || element.classList.contains('editing')) return;

    const currentLabel = (Array.isArray(this.state.settings.pageLabels)
      ? this.state.settings.pageLabels[pageIndex] : '') || '';

    // Promote the element to a page-tab shape (regardless of whether it was a
    // .dot or .page-tab) so the input has a sized container instead of
    // overflowing a 9px dot.
    const wasActive = element.classList.contains('active');
    element.className = `page-tab editing${wasActive ? ' active' : ''}`;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'page-tab-input';
    input.maxLength = 24;
    input.value = currentLabel;
    input.placeholder = this.t('pagination.renamePh');
    input.setAttribute('aria-label', this.t('pagination.renamePh'));

    // Stop the input's own click/dblclick from bubbling back into the page-tab
    // listeners (which would navigate or re-enter rename mode).
    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('dblclick', (e) => e.stopPropagation());

    const commit = async (cancelled) => {
      // Avoid double-commit on Enter+blur sequence.
      if (input.dataset.done === '1') return;
      input.dataset.done = '1';

      if (cancelled) {
        this.renderPagination(this.computePageCount());
        return;
      }
      await this.commitPageLabel(pageIndex, input.value);
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit(false);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        commit(true);
      }
    });
    input.addEventListener('blur', () => commit(false));

    element.classList.add('editing');
    element.textContent = '';
    element.appendChild(input);
    // Defer so the focus lands after the dblclick selection in the browser.
    setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
  }

  /**
   * Persist a page label. Empty / whitespace-only string removes the label
   * (a sparse array slot, so existing indexes after it stay aligned).
   */
  async commitPageLabel(pageIndex, rawValue) {
    const value = (rawValue || '').trim().slice(0, 24);
    const labels = Array.isArray(this.state.settings.pageLabels)
      ? this.state.settings.pageLabels.slice()
      : [];

    if (value) {
      labels[pageIndex] = value;
    } else {
      // Keep the array length so trailing labels don't shift index when a
      // middle label is cleared. Set to empty string (treated same as missing).
      labels[pageIndex] = '';
    }

    // Trim trailing empties so the array doesn't grow forever.
    while (labels.length > 0 && !labels[labels.length - 1]) {
      labels.pop();
    }

    this.state.settings.pageLabels = labels;
    await this.repository.saveSettings(this.state.settings);
    this.renderPagination(this.computePageCount());
  }

  /**
   * Total pages from the flat icon list. Used by wheel / arrow-key
   * navigation and the inline page-rename flow.
   */
  computePageCount() {
    const slots = this.state.slotsPerPage || this.computeSlotsPerPage();
    return Math.ceil(this.state.shortcuts.length / slots) || 1;
  }

  /**
   * Dialog modal tabs toggler logic
   */
  initDialogTabs() {
    this.dom.dialogTabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.dataset.tab;
        
        // Update active class on tab buttons
        this.dom.dialogTabButtons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        // Show/hide tab contents
        this.dom.tabContents.forEach(content => {
          if (content.id === `tab-content-${targetTab}`) {
            content.style.display = 'block';
            content.classList.add('active');
          } else {
            content.style.display = 'none';
            content.classList.remove('active');
          }
        });
      });
    });
  }

  /**
   * Home Tab popular presets grids
   */
  renderPopularPresets() {
    this.dom.popularShortcutsGrid.replaceChildren();
    this.popularPresets.forEach(preset => {
      const btn = document.createElement('button');
      btn.className = 'popular-preset-btn';
      btn.type = 'button';

      const img = document.createElement('img');
      img.src = preset.icon;
      img.alt = preset.name;
      // On load failure, swap the broken image for a coloured letter chip so
      // the preset never looks empty.
      img.onerror = () => {
        const fallback = document.createElement('div');
        fallback.className = 'popular-preset-fallback';
        fallback.textContent = preset.name.charAt(0).toUpperCase();
        fallback.style.background = preset.color && preset.color !== '#ffffff'
          ? preset.color
          : 'hsl(var(--accent))';
        img.replaceWith(fallback);
      };

      const span = document.createElement('span');
      span.textContent = preset.name;

      btn.appendChild(img);
      btn.appendChild(span);

      // Handle Preset click: populates Custom form, triggers visual preview, and opens Custom tab
      btn.addEventListener('click', () => {
        this.dom.shortcutName.value = preset.name;
        this.dom.shortcutUrl.value = preset.url;
        this.dom.shortcutIconUrlInput.value = preset.icon;
        this.dom.shortcutZoomSlider.value = '1.00';
        
        // Match color swatch
        this.dom.colorSwatches.querySelectorAll('.color-swatch').forEach(swatch => {
          if (swatch.dataset.color === preset.color) {
            swatch.classList.add('active');
          } else {
            swatch.classList.remove('active');
          }
        });

        // Trigger live visual update
        this.updateLivePreview();

        // Navigate to Custom tab
        const customTabBtn = Array.from(this.dom.dialogTabButtons).find(b => b.dataset.tab === 'custom');
        if (customTabBtn) customTabBtn.click();
      });

      this.dom.popularShortcutsGrid.appendChild(btn);
    });
  }

  /**
   * Chrome Predefined pages rendering
   */
  renderChromeSystemPages() {
    this.dom.chromePagesList.replaceChildren();
    this.chromeSystemPages.forEach(page => {
      const div = document.createElement('div');
      div.className = 'chrome-page-item';
      
      const img = document.createElement('img');
      img.src = page.icon;
      img.alt = this.t(page.nameKey);

      const span = document.createElement('span');
      span.textContent = this.t(page.nameKey);

      div.appendChild(img);
      div.appendChild(span);

      // Handle click: populates Custom form and opens Custom tab
      div.addEventListener('click', () => {
        this.dom.shortcutName.value = this.t(page.nameKey);
        this.dom.shortcutUrl.value = page.url;
        this.dom.shortcutIconUrlInput.value = ''; // Pre-load as clean fallback letter
        this.dom.shortcutZoomSlider.value = '1.00';
        
        // Gray color swatch index 2
        this.dom.colorSwatches.querySelectorAll('.color-swatch').forEach((swatch, idx) => {
          if (idx === 2) swatch.classList.add('active');
          else swatch.classList.remove('active');
        });

        this.updateLivePreview();

        const customTabBtn = Array.from(this.dom.dialogTabButtons).find(b => b.dataset.tab === 'custom');
        if (customTabBtn) customTabBtn.click();
      });

      this.dom.chromePagesList.appendChild(div);
    });
  }

  /**
   * Updates the zoom label with the current percentage (e.g. "120%").
   */
  updateZoomLabel() {
    if (!this.dom.zoomValue) return;
    const pct = Math.round((parseFloat(this.dom.shortcutZoomSlider.value) || 1) * 100);
    this.dom.zoomValue.textContent = `${pct}%`;
  }

  updateLivePreview() {
    const name = this.dom.shortcutName.value.trim() || 'T';
    const urlIcon = this.dom.shortcutIconUrlInput.value.trim();
    const zoom = this.dom.shortcutZoomSlider.value || 1.0;
    const isCover = this.dom.shortcutFitToggle.checked;
    this.updateZoomLabel();

    const applyImageStyles = (img) => {
      img.style.transform = `scale(${zoom})`;
      if (isCover) {
        img.style.objectFit = 'cover';
        img.style.padding = '0';
        img.style.borderRadius = ''; // inherit --icon-radius from CSS
      } else {
        img.style.objectFit = '';
        img.style.padding = '';
        img.style.borderRadius = '';
      }
    };

    // 1. Fallback letter
    this.dom.shortcutPreviewFallback.textContent = name.charAt(0).toUpperCase();

    // 2. Swatch Background Color & Transparent support
    const activeColorSwatch = this.dom.colorSwatches.querySelector('.color-swatch.active');
    const color = activeColorSwatch ? activeColorSwatch.dataset.color : '#1f2937';
    
    if (color === 'transparent') {
      this.dom.shortcutPreviewBox.style.background = 'transparent';
      this.dom.shortcutPreviewBox.style.boxShadow = 'none';
      this.dom.shortcutPreviewBox.style.backdropFilter = 'none';
      this.dom.shortcutPreviewBox.style.webkitBackdropFilter = 'none';
      this.dom.shortcutPreviewBox.style.border = 'none';
    } else {
      this.dom.shortcutPreviewBox.style.background = color;
      this.dom.shortcutPreviewBox.style.boxShadow = '';
      this.dom.shortcutPreviewBox.style.backdropFilter = '';
      this.dom.shortcutPreviewBox.style.webkitBackdropFilter = '';
      this.dom.shortcutPreviewBox.style.border = '';
    }

    // 3. Display Image with error handler race condition fix
    const iconFile = this.dom.shortcutIconInput.files[0];
    if (iconFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.dom.shortcutPreviewImg.onerror = () => {
          this.dom.shortcutPreviewImg.style.display = 'none';
          this.dom.shortcutPreviewFallback.style.display = 'block';
        };
        this.dom.shortcutPreviewImg.src = e.target.result;
        this.dom.shortcutPreviewImg.style.display = 'block';
        this.dom.shortcutPreviewFallback.style.display = 'none';
        applyImageStyles(this.dom.shortcutPreviewImg);
      };
      reader.readAsDataURL(iconFile);
    } else if (urlIcon) {
      this.dom.shortcutPreviewImg.onerror = () => {
        this.dom.shortcutPreviewImg.style.display = 'none';
        this.dom.shortcutPreviewFallback.style.display = 'block';
      };
      this.dom.shortcutPreviewImg.src = urlIcon;
      this.dom.shortcutPreviewImg.style.display = 'block';
      this.dom.shortcutPreviewFallback.style.display = 'none';
      applyImageStyles(this.dom.shortcutPreviewImg);
    } else {
      // Decide whether to keep the original icon visible or let auto-favicon
      // paint the new domain. The original wins when the user hasn't changed
      // the URL yet, or when they've explicitly pinned it via "Restaurar".
      const editingShortcut = this.activeContextShortcutId
        ? this.state.shortcuts.find(s => s.id === this.activeContextShortcutId)
        : null;
      const urlUnchanged = editingShortcut
        && (this.dom.shortcutUrl.value || '').trim() === (this._editOriginalUrl || '').trim();
      const keepOriginal = editingShortcut && editingShortcut.icon
        && (urlUnchanged || this._iconRestoredToOriginal);

      if (keepOriginal) {
        this.dom.shortcutPreviewImg.onerror = () => {
          this.dom.shortcutPreviewImg.style.display = 'none';
          this.dom.shortcutPreviewFallback.style.display = 'block';
        };
        this.dom.shortcutPreviewImg.src = editingShortcut.icon;
        this.dom.shortcutPreviewImg.style.display = 'block';
        this.dom.shortcutPreviewFallback.style.display = 'none';
        applyImageStyles(this.dom.shortcutPreviewImg);
      } else if (this.autoFaviconCandidates.length > 0) {
        // Auto-resolved favicon preview (add mode, or edit mode after URL
        // change). Walks the candidate list — each onerror advances to the
        // next, preferring the crisp apple-touch-icon over s2.
        const candidates = this.autoFaviconCandidates.slice();
        let i = 0;
        const tryNext = () => {
          if (i >= candidates.length) {
            this.dom.shortcutPreviewImg.style.display = 'none';
            this.dom.shortcutPreviewFallback.style.display = 'block';
            return;
          }
          this.dom.shortcutPreviewImg.onerror = tryNext;
          this.dom.shortcutPreviewImg.src = candidates[i++];
        };
        this.dom.shortcutPreviewImg.style.display = 'block';
        this.dom.shortcutPreviewFallback.style.display = 'none';
        applyImageStyles(this.dom.shortcutPreviewImg);
        tryNext();
      } else {
        this.dom.shortcutPreviewImg.style.display = 'none';
        this.dom.shortcutPreviewFallback.style.display = 'block';
      }
    }
  }

  /**
   * Wallpaper Drawer carrusel cards renderer
   */
  renderWallpaperDrawer() {
    this.dom.wallpaperStaticList.replaceChildren();
    this.dom.wallpaperLiveList.replaceChildren();
    
    const activeProvider = this.state.settings.bgProvider;
    const activeUrl = this.state.settings.bgUrl;

    // Highlight daily rotation active state
    if (activeProvider === 'daily') {
      this.dom.wpCardDaily.classList.add('active');
    } else {
      this.dom.wpCardDaily.classList.remove('active');
    }

    // Render Static Wallpapers
    this.staticWallpapers.forEach(wp => {
      const card = document.createElement('div');
      card.className = `wallpaper-card ${activeProvider === 'static' && (this.state.settings.bgStaticUrl === wp.file || activeUrl === wp.file) ? 'active' : ''}`;
      
      const thumb = document.createElement('div');
      thumb.className = 'wp-card-thumb';
      thumb.style.backgroundImage = `url('${wp.file}')`;

      const info = document.createElement('div');
      info.className = 'wp-card-info';
      
      const name = document.createElement('div');
      name.className = 'wp-card-name';
      name.textContent = wp.name;

      info.appendChild(name);
      card.appendChild(thumb);
      card.appendChild(info);

      card.addEventListener('click', async () => {
        this.state.settings.bgProvider = 'static';
        this.state.settings.bgStaticUrl = wp.file;
        this.state.settings.bgUrl = wp.file;
        this.state.settings.bgFileBase64 = '';
        
        await this.repository.saveSettings(this.state.settings);
        
        this.renderSettingsUI();
        this.renderBackground();
        this.renderWallpaperDrawer(); // Update highlighted cards active class
        this.dom.wallpaperDrawer.classList.remove('active'); // Auto-close drawer
        this.showToast(this.t('toast.bgChanged', { name: wp.name }));
      });

      this.dom.wallpaperStaticList.appendChild(card);
    });

    // Render Live Videos
    this.liveVideos.forEach(vid => {
      const card = document.createElement('div');
      card.className = `wallpaper-card ${activeProvider === 'video' && (this.state.settings.bgVideoUrl === vid.file || activeUrl === vid.file) ? 'active' : ''}`;
      
      const thumb = document.createElement('div');
      thumb.className = 'wp-card-thumb';

      // The thumbnail is the video itself: shows its first frame and plays
      // on hover, so it always matches the real background.
      const previewVideo = document.createElement('video');
      previewVideo.src = `${vid.file}#t=0.5`;
      previewVideo.muted = true;
      previewVideo.loop = true;
      previewVideo.playsInline = true;
      previewVideo.preload = 'metadata';
      previewVideo.className = 'wp-card-video';
      thumb.appendChild(previewVideo);
      card.addEventListener('mouseenter', () => { previewVideo.play().catch(() => {}); });
      card.addEventListener('mouseleave', () => {
        previewVideo.pause();
        try { previewVideo.currentTime = 0.5; } catch (_) {}
      });

      // Play button overlay
      const overlay = document.createElement('div');
      overlay.className = 'play-icon-overlay';
      const ns = 'http://www.w3.org/2000/svg';
      const playSvg = document.createElementNS(ns, 'svg');
      playSvg.setAttribute('viewBox', '0 0 24 24');
      playSvg.setAttribute('width', '16');
      playSvg.setAttribute('height', '16');
      playSvg.setAttribute('fill', 'white');
      playSvg.style.marginLeft = '2px';
      const playPath = document.createElementNS(ns, 'path');
      playPath.setAttribute('d', 'M8 5v14l11-7z');
      playSvg.appendChild(playPath);
      overlay.appendChild(playSvg);
      thumb.appendChild(overlay);

      const info = document.createElement('div');
      info.className = 'wp-card-info';
      
      const name = document.createElement('div');
      name.className = 'wp-card-name';
      name.textContent = this.t(vid.nameKey);

      info.appendChild(name);
      card.appendChild(thumb);
      card.appendChild(info);

      card.addEventListener('click', async () => {
        this.state.settings.bgProvider = 'video';
        this.state.settings.bgVideoUrl = vid.file;
        this.state.settings.bgUrl = vid.file;
        this.state.settings.bgFileBase64 = '';
        
        await this.repository.saveSettings(this.state.settings);
        
        this.renderSettingsUI();
        this.renderBackground();
        this.renderWallpaperDrawer(); // Update highlighted cards active class
        this.dom.wallpaperDrawer.classList.remove('active'); // Auto-close drawer
        this.showToast(this.t('toast.videoBgChanged', { name: this.t(vid.nameKey) }));
      });

      this.dom.wallpaperLiveList.appendChild(card);
    });

    // Reset daily trigger events (avoids stacked handlers)
    this.dom.wpCardDaily.replaceWith(this.dom.wpCardDaily.cloneNode(true));
    this.dom.wpCardDaily = document.getElementById('wp-card-daily');
    
    this.dom.wpCardDaily.addEventListener('click', async () => {
      this.state.settings.bgProvider = 'daily';
      this.state.settings.bgUrl = '';
      this.state.settings.bgFileBase64 = '';

      await this.repository.saveSettings(this.state.settings);
      
      this.renderSettingsUI();
      this.renderBackground();
      this.renderWallpaperDrawer();
      this.dom.wallpaperDrawer.classList.remove('active'); // Auto-close drawer
      this.showToast(this.t('toast.dailyOn'));
    });
  }

  // ==========================================
  // BUSINESS LOGIC & USE CASES
  // ==========================================

  /**
   * Show elegant temporary toast notification
   */
  showToast(message) {
    this._clearToastAction();
    // Plain notification → show the × so the user can dismiss it manually.
    if (this.dom.toastCloseBtn) this.dom.toastCloseBtn.style.display = '';
    this.dom.toastMessage.textContent = message;
    this.dom.toast.classList.add('show');
    if (this._toastTimeout) clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      this.dom.toast.classList.remove('show');
    }, 3000);
  }

  /**
   * Toast with an action button (e.g. "Undo"). The callback fires when the
   * user clicks the action. The toast stays visible for 6s instead of 3s
   * so the user has time to react.
   */
  showToastWithAction(message, actionLabel, onAction) {
    this._clearToastAction();
    this.dom.toastMessage.textContent = message;

    // MD3 Snackbar with action: hide the × — the action IS the dismiss.
    if (this.dom.toastCloseBtn) this.dom.toastCloseBtn.style.display = 'none';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = actionLabel;
    btn.addEventListener('click', () => {
      this.dom.toast.classList.remove('show');
      this._clearToastAction();
      if (this._toastTimeout) { clearTimeout(this._toastTimeout); this._toastTimeout = null; }
      onAction();
    });
    this.dom.toast.appendChild(btn);
    this._toastActionBtn = btn;

    this.dom.toast.classList.add('show');
    if (this._toastTimeout) clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      this.dom.toast.classList.remove('show');
      this._clearToastAction();
    }, 6000);
  }

  _clearToastAction() {
    if (this._toastActionBtn) {
      this._toastActionBtn.remove();
      this._toastActionBtn = null;
    }
  }

  /**
   * Hide the toast right now (used by the close × button and the auto timeout).
   */
  dismissToast() {
    this.dom.toast.classList.remove('show');
    if (this._toastTimeout) {
      clearTimeout(this._toastTimeout);
      this._toastTimeout = null;
    }
    this._clearToastAction();
  }

  /**
   * Add Dialog Popup opener
   */
  openAddShortcutDialog() {
    this.activeContextShortcutId = null;
    this.resetShortcutForm();
    this.dom.dialogTitle.textContent = this.t('dialog.addTitle');
    this.dom.dialogSaveBtn.textContent = this.t('dialog.add');
    this.toggleShortcutDialog(true);
  }

  /**
   * Context Menu Popover controller.
   * Can be called from a right-click (uses pointer coordinates) or from the
   * pencil edit button (anchors below the button's rect).
   */
  showContextMenu(event, shortcutId) {
    this.activeContextShortcutId = shortcutId;
    const menu = this.dom.shortcutContextMenu;
    menu.style.display = 'flex';

    let x, y;
    if (event.type === 'contextmenu') {
      x = event.clientX;
      y = event.clientY;
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      x = rect.left - 100;
      y = rect.bottom + 6;
    }

    // Measure after display:flex so width/height are real, then clamp inside viewport.
    const { offsetWidth: mw, offsetHeight: mh } = menu;
    const margin = 8;
    const maxX = window.innerWidth - mw - margin;
    const maxY = window.innerHeight - mh - margin;
    menu.style.left = `${Math.max(margin, Math.min(x, maxX))}px`;
    menu.style.top = `${Math.max(margin, Math.min(y, maxY))}px`;
  }

  hideContextMenu() {
    this.dom.shortcutContextMenu.style.display = 'none';
  }

  /**
   * Open the shortcut's URL in a brand new background-friendly tab.
   * Uses chrome.tabs.create when available so it works for chrome:// URLs too.
   */
  openShortcutInNewTab(shortcutId) {
    this.hideContextMenu();
    const shortcut = this.state.shortcuts.find(s => s.id === shortcutId);
    if (!shortcut) return;
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: shortcut.url });
    } else {
      window.open(shortcut.url, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Open the shortcut in a new incognito window. Requires the extension to be
   * allowed in incognito mode (chrome://extensions → toggle "Allow in Incognito").
   * If the API isn't available or the user blocks it, surface a friendly toast.
   */
  openShortcutInIncognito(shortcutId) {
    this.hideContextMenu();
    const shortcut = this.state.shortcuts.find(s => s.id === shortcutId);
    if (!shortcut) return;

    if (typeof chrome === 'undefined' || !chrome.windows || !chrome.windows.create) {
      this.showToast(this.t('toast.incognitoUnavailable'));
      return;
    }

    chrome.windows.create({ url: shortcut.url, incognito: true }, (win) => {
      if (chrome.runtime.lastError || !win) {
        this.showToast(this.t('toast.incognitoBlocked'));
      }
    });
  }

  /**
   * Copy the shortcut URL to the clipboard.
   */
  async copyShortcutUrl(shortcutId) {
    this.hideContextMenu();
    const shortcut = this.state.shortcuts.find(s => s.id === shortcutId);
    if (!shortcut) return;
    try {
      await navigator.clipboard.writeText(shortcut.url);
      this.showToast(this.t('toast.urlCopied'));
    } catch (err) {
      console.warn('Clipboard write failed', err);
      this.showToast(this.t('toast.urlCopyError'));
    }
  }

  /**
   * Edit Modal Opener use case
   */
  openEditShortcutDialog(shortcutId) {
    this.hideContextMenu();
    const shortcut = this.state.shortcuts.find(s => s.id === shortcutId);
    if (!shortcut) return;

    this.activeContextShortcutId = shortcutId;
    // Clear any auto-favicon from a previous dialog session — edit starts
    // from the shortcut's stored icon, not a stale URL resolution.
    this.autoFaviconCandidates = [];
    clearTimeout(this._faviconDebounce);
    // Snapshot the URL+icon at open time so the user can restore them later
    // and so we know when the URL changes.
    this._editOriginalUrl = shortcut.url || '';
    this._editOriginalIcon = shortcut.icon || '';
    this._iconRestoredToOriginal = false;
    this.dom.dialogTitle.textContent = this.t('dialog.editTitle');
    this.dom.dialogSaveBtn.textContent = this.t('dialog.save');
    this.dom.shortcutName.value = shortcut.name;
    this.dom.shortcutUrl.value = shortcut.url;
    // Edit mode: the existing name is sacred. Pre-flip the flag so even an
    // empty name field doesn't trigger an auto-title fetch.
    this._userEditedName = true;

    const zoomValue = shortcut.zoom || 1.0;
    this.dom.shortcutZoomSlider.value = zoomValue;
    this.dom.shortcutFitToggle.checked = shortcut.fit === 'cover';

    if (shortcut.icon && !shortcut.icon.startsWith('data:')) {
      this.dom.shortcutIconUrlInput.value = shortcut.icon;
      this.dom.iconFileLabel.textContent = this.t('dialog.uploadImageFile');
    } else if (shortcut.icon && shortcut.icon.startsWith('data:')) {
      this.dom.shortcutIconUrlInput.value = '';
      this.dom.iconFileLabel.textContent = this.t('dialog.uploadedIcon');
    } else {
      this.dom.shortcutIconUrlInput.value = '';
      this.dom.iconFileLabel.textContent = this.t('dialog.uploadImageFile');
    }
    
    // Mark matching color swatch as active
    this.dom.colorSwatches.querySelectorAll('.color-swatch').forEach(swatch => {
      if (swatch.dataset.color === shortcut.color) {
        swatch.classList.add('active');
      } else {
        swatch.classList.remove('active');
      }
    });

    // Trigger visual live preview updates
    this.updateLivePreview();
    this.updateIconChangedHint();

    // Trigger tab custom active
    const customTabBtn = Array.from(this.dom.dialogTabButtons).find(b => b.dataset.tab === 'custom');
    if (customTabBtn) customTabBtn.click();

    this.toggleShortcutDialog(true);
  }

  /**
   * Save Shortcut Use Case (Add/Edit)
   */
  async saveShortcutUseCase() {
    const name = this.dom.shortcutName.value.trim();
    const url = this.dom.shortcutUrl.value.trim();
    
    if (!name || !url) {
      this.showToast(this.t('toast.fillFields'));
      return;
    }

    const activeColorSwatch = this.dom.colorSwatches.querySelector('.color-swatch.active');
    const color = activeColorSwatch ? activeColorSwatch.dataset.color : '#1f2937';
    const iconFile = this.dom.shortcutIconInput.files[0];
    const iconUrl = this.dom.shortcutIconUrlInput.value.trim();
    const zoom = parseFloat(this.dom.shortcutZoomSlider.value) || 1.0;
    const fit = this.dom.shortcutFitToggle.checked ? 'cover' : 'contain';

    // Priority: uploaded file → manual icon URL → auto-resolved favicon.
    // The auto-favicon only kicks in if the user didn't pick anything
    // explicitly, so manual choices always win. In edit mode, the stored
    // icon is preserved when the URL didn't change OR when the user pinned
    // it via "Restaurar original" — both cases mean "keep what's there".
    const editingShortcut = this.activeContextShortcutId
      ? this.state.shortcuts.find(s => s.id === this.activeContextShortcutId)
      : null;
    const editingHadIcon = !!(editingShortcut && editingShortcut.icon);
    const urlUnchanged = editingShortcut
      && url === (this._editOriginalUrl || '').trim();
    const keepOriginalIcon = editingHadIcon
      && (urlUnchanged || this._iconRestoredToOriginal);
    const autoCandidates = (!iconFile && !iconUrl && !keepOriginalIcon)
      ? this.autoFaviconCandidates.slice()
      : [];

    const save = async (iconDataUrl = '') => {
      let finalIcon = iconDataUrl || iconUrl || '';

      // If the icon is a remote URL, download it and store it locally
      if (/^https?:\/\//.test(finalIcon)) {
        const cached = await this.cacheIconUrl(finalIcon);
        if (cached) finalIcon = cached;
      } else if (!finalIcon && autoCandidates.length > 0) {
        // Try each favicon candidate in order until one downloads as a valid
        // image. The earlier candidates are higher-res (apple-touch-icon),
        // so we prefer them when they exist.
        for (const url of autoCandidates) {
          const cached = await this.cacheIconUrl(url);
          if (cached) { finalIcon = cached; break; }
        }
      }

      if (this.activeContextShortcutId) {
        // EDIT MODE
        const index = this.state.shortcuts.findIndex(s => s.id === this.activeContextShortcutId);
        if (index !== -1) {
          const original = this.state.shortcuts[index];
          // Keep original icon image base64 if no changes were introduced
          if (!finalIcon && original.icon) {
            finalIcon = original.icon;
          }
          this.state.shortcuts[index] = new Shortcut(this.activeContextShortcutId, name, url, finalIcon, color, zoom, fit);
          this.showToast(this.t('toast.shortcutUpdated'));
        }
      } else {
        // ADD MODE
        const newShortcut = new Shortcut(null, name, url, finalIcon, color, zoom, fit);
        this.state.shortcuts.push(newShortcut);
        this.showToast(this.t('toast.shortcutAdded'));
      }

      await this.repository.saveShortcuts(this.state.shortcuts);
      this.renderShortcuts();
      this.toggleShortcutDialog(false);
    };

    if (iconFile) {
      // Process uploaded image to base64 persistence
      const reader = new FileReader();
      reader.onload = (e) => save(e.target.result);
      reader.readAsDataURL(iconFile);
    } else {
      save();
    }
  }

  /**
   * Delete Shortcut Use Case
   */
  /**
   * Duplicate an existing shortcut: clones data, gives it a fresh ID and a
   * "(2)" suffix on the name, inserts it right after the original.
   */
  async duplicateShortcutUseCase(shortcutId) {
    this.hideContextMenu();
    if (!shortcutId) return;
    const idx = this.state.shortcuts.findIndex(s => s.id === shortcutId);
    if (idx === -1) return;
    const src = this.state.shortcuts[idx];

    // Find a non-clashing suffix: "Name (2)", "Name (3)", … if needed.
    const baseName = src.name.replace(/\s*\(\d+\)\s*$/, '');
    let suffix = 2;
    let candidate = `${baseName} (${suffix})`;
    while (this.state.shortcuts.some(s => s.name === candidate)) {
      suffix += 1;
      candidate = `${baseName} (${suffix})`;
    }

    const copy = new Shortcut(
      'sc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      candidate,
      src.url,
      src.icon,
      src.color,
      src.zoom,
      src.fit
    );
    this.state.shortcuts.splice(idx + 1, 0, copy);
    await this.repository.saveShortcuts(this.state.shortcuts);

    // If the copy landed on a different page (e.g. user duplicated the last
    // shortcut of the current page), jump to where it now lives so the toast
    // "Duplicado" matches what the user sees.
    const slots = this.state.slotsPerPage || this.computeSlotsPerPage();
    const targetPage = Math.floor((idx + 1) / slots);
    if (targetPage !== this.state.currentPage) {
      this.goToPage(targetPage);
    } else {
      this.renderShortcuts();
    }
    this.showToast(this.t('toast.shortcutDuplicated'));
  }

  async deleteShortcutUseCase(shortcutId) {
    this.hideContextMenu();
    if (!shortcutId) return;

    // Capture original position so undo restores the exact slot, not the tail.
    const originalIndex = this.state.shortcuts.findIndex(s => s.id === shortcutId);
    const removed = this.state.shortcuts[originalIndex];
    if (!removed) return;

    this.state.shortcuts.splice(originalIndex, 1);
    await this.repository.saveShortcuts(this.state.shortcuts);
    this.renderShortcuts();

    this.showToastWithAction(
      this.t('toast.shortcutDeleted'),
      this.t('toast.undo'),
      async () => {
        // Re-insert at the original index (clamped to current length).
        const idx = Math.min(originalIndex, this.state.shortcuts.length);
        this.state.shortcuts.splice(idx, 0, removed);
        await this.repository.saveShortcuts(this.state.shortcuts);
        this.renderShortcuts();
        this.showToast(this.t('toast.shortcutRestored'));
      }
    );
  }

  /**
   * Drag & Drop Reorder Use Case
   * Moves the shortcut at fromIndex to toIndex in the state array.
   */
  async reorderShortcutsUseCase(fromIndex, toIndex) {
    const arr = this.state.shortcuts;
    if (fromIndex < 0 || fromIndex >= arr.length) return;
    if (toIndex < 0 || toIndex >= arr.length) return;

    // Remove from original position and insert at target
    const [moved] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, moved);

    this.state.shortcuts = arr;
    await this.repository.saveShortcuts(this.state.shortcuts);
    this.renderShortcuts();
  }

  /**
   * ── Drag-sort reordering (live rearrangement) ──
   * Replaces the native HTML5 drag & drop, which only showed a ghost image
   * on top of static cards. Now the dragged card "lifts" and the rest
   * slides to make room for it.
   */
  onCardPointerDown(e, card) {
    if (e.button !== 0) return;                          // left click only
    if (e.target.closest('.shortcut-menu-btn')) return;  // skip when clicking the options button
    if (this._drag || this._reorderAnim) return;         // a drag is already in progress

    this._didDrag = false;

    const cards = [...this.dom.shortcutsGrid.querySelectorAll('.shortcut-card')];
    const srcLocal = cards.indexOf(card);
    if (srcLocal === -1) return;

    this._drag = {
      active: false,
      card,
      cards,
      srcLocal,
      dstLocal: srcLocal,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
    };

    this._onDragMove = (ev) => this.handleDragMove(ev);
    this._onDragEnd = (ev) => this.handleDragEnd(ev);
    window.addEventListener('pointermove', this._onDragMove);
    window.addEventListener('pointerup', this._onDragEnd);
    window.addEventListener('pointercancel', this._onDragEnd);
  }

  handleDragMove(e) {
    const d = this._drag;
    if (!d) return;

    // Threshold to tell a click apart from a real drag
    if (!d.active) {
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 6) return;
      this.beginDrag();
    }

    // Per-tab hover feedback: while dragging, highlight whichever pagination
    // tab the pointer is over so the user knows that releasing there moves
    // the shortcut to that page.
    if (this.dom.paginationDots) {
      const tab = this._findPageDropTarget(e, d);
      this.dom.paginationDots.querySelectorAll('.drop-hover')
        .forEach((el) => el.classList.remove('drop-hover'));
      if (tab) {
        const targetIdx = parseInt(tab.dataset.pageIndex, 10);
        if (Number.isInteger(targetIdx) && targetIdx !== this.state.currentPage) {
          tab.classList.add('drop-hover');
        }
      }
    }

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    d.card.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;

    // Determine the drop target. Two-stage detection:
    //   1) Direct hit-test under the cursor (elementsFromPoint, skipping the
    //      dragged card itself) — most accurate when pointer is over a card.
    //   2) Closest-card-to-CURSOR fallback when the pointer is in a gutter
    //      between cards (the cursor proximity, not the dragged card's
    //      projected center, gives more intuitive snapping near edges).
    let best = -1;
    if (typeof document.elementsFromPoint === 'function') {
      const stack = document.elementsFromPoint(e.clientX, e.clientY);
      for (const el of stack) {
        if (el === d.card || d.card.contains(el)) continue;
        const cardEl = el.closest && el.closest('.shortcut-card');
        if (cardEl && this.dom.shortcutsGrid.contains(cardEl)) {
          const idx = d.cards.indexOf(cardEl);
          if (idx !== -1) { best = idx; break; }
        }
      }
    }
    if (best === -1) {
      // Cursor-based proximity. Skip the dragged card so we don't snap onto
      // ourselves while drifting in a gap.
      let bestDist = Infinity;
      best = d.srcLocal;
      for (let i = 0; i < d.rects.length; i++) {
        if (i === d.srcLocal) continue;
        const r = d.rects[i];
        const dist = (e.clientX - r.cx) ** 2 + (e.clientY - r.cy) ** 2;
        if (dist < bestDist) { bestDist = dist; best = i; }
      }
    }

    // Visual feedback on the destination card so the user has a clear
    // "this is where it lands" signal even when applyShift's slot animation
    // is subtle.
    const targetCard = d.cards[best];
    if (this._lastDropCard !== targetCard) {
      if (this._lastDropCard) this._lastDropCard.classList.remove('drop-target');
      if (targetCard && best !== d.srcLocal) targetCard.classList.add('drop-target');
      this._lastDropCard = targetCard && best !== d.srcLocal ? targetCard : null;
    }

    if (best !== d.dstLocal) {
      d.dstLocal = best;
      this.applyShift();
    }
  }

  beginDrag() {
    const d = this._drag;
    d.active = true;
    this._didDrag = true;

    // Original geometry of each card: fixed reference during the drag
    d.rects = d.cards.map((c) => {
      const r = c.getBoundingClientRect();
      return { left: r.left, top: r.top, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    });

    // Allow the lifted card to escape the container without being clipped
    d.container = this.dom.shortcutsGrid.parentElement;
    d.prevOverflow = d.container.style.overflow;
    d.container.style.overflow = 'visible';

    document.body.style.userSelect = 'none';
    this.dom.shortcutsGrid.classList.add('is-reordering');
    // Light up the pagination bar so the user knows page tabs are drop targets.
    if (this.dom.paginationDots) {
      this.dom.paginationDots.classList.add('drop-target-active');
    }
    d.card.classList.add('lifted');
    d.card.style.transition = 'none'; // must track the cursor with no delay
    try { d.card.setPointerCapture(d.pointerId); } catch (_) {}

    this.applyShift(); // set a base transform on every card (neutralizes hover)
  }

  /**
   * Uses transform to shift every card (except the dragged one) so the
   * empty slot appears at the current destination position.
   */
  applyShift() {
    const d = this._drag;
    const n = d.cards.length;

    // Live preview: every other card translates from its old slot to its new
    // slot so the dragged card has space to drop into.
    const order = [];
    for (let k = 0; k < n; k++) if (k !== d.srcLocal) order.push(k);
    order.splice(d.dstLocal, 0, d.srcLocal);

    for (let slot = 0; slot < n; slot++) {
      const i = order[slot];
      if (i === d.srcLocal) continue;
      const tx = d.rects[slot].left - d.rects[i].left;
      const ty = d.rects[slot].top - d.rects[i].top;
      d.cards[i].style.transform = `translate(${tx}px, ${ty}px)`;
    }
  }

  handleDragEnd(e) {
    const d = this._drag;
    if (!d) return;

    window.removeEventListener('pointermove', this._onDragMove);
    window.removeEventListener('pointerup', this._onDragEnd);
    window.removeEventListener('pointercancel', this._onDragEnd);
    this._drag = null;

    // Clear the drop target ring no matter how the drag ended.
    if (this._lastDropCard) {
      this._lastDropCard.classList.remove('drop-target');
      this._lastDropCard = null;
    }

    // Never crossed the threshold: it was a plain click, nothing to reorder
    if (!d.active) {
      this.dom.paginationDots.classList.remove('drop-target-active');
      return;
    }

    const { srcLocal, dstLocal } = d;
    // Coalesced rendering means visual position != array position, so we read
    // each card's true index from its dataset (set when buildShortcutCard
    // wired the card up).
    const srcGlobal = parseInt(d.card.dataset.index, 10);
    const dstCard = d.cards[dstLocal];
    const dstGlobal = dstCard ? parseInt(dstCard.dataset.index, 10) : srcGlobal;

    // Cross-page drop: did the user release the pointer over a different
    // page's tab/dot in the pagination bar? If so, move this shortcut to
    // that page instead of doing the same-page reorder.
    let crossPageTarget = null;
    if (e && typeof e.clientX === 'number' && typeof e.clientY === 'number') {
      const tab = this._findPageDropTarget(e, d);
      if (tab) {
        const targetPage = parseInt(tab.dataset.pageIndex, 10);
        if (Number.isInteger(targetPage) && targetPage !== this.state.currentPage) {
          crossPageTarget = targetPage;
        }
      }
    }
    this.dom.paginationDots.classList.remove('drop-target-active');

    d.container.style.overflow = d.prevOverflow;
    document.body.style.userSelect = '';

    if (crossPageTarget !== null) {
      // Skip the in-page slot animation and just hand off to the cross-page
      // mover. The destination page renders fresh so the dragged card lands
      // somewhere visible.
      d.card.style.transition = 'opacity 0.18s ease';
      d.card.style.opacity = '0';
      this._reorderAnim = true;
      setTimeout(() => {
        this._reorderAnim = false;
        this.dom.shortcutsGrid.classList.remove('is-reordering');
        this.moveShortcutToPage(srcGlobal, crossPageTarget);
      }, 180);
      return;
    }

    // Animate the dragged card to its final slot
    const tx = d.rects[dstLocal].left - d.rects[srcLocal].left;
    const ty = d.rects[dstLocal].top - d.rects[srcLocal].top;
    d.card.style.transition = 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)';
    d.card.style.transform = `translate(${tx}px, ${ty}px) scale(1)`;

    // After the animation, persist the new order and re-render cleanly
    this._reorderAnim = true;
    setTimeout(() => {
      this._reorderAnim = false;
      this.dom.shortcutsGrid.classList.remove('is-reordering');
      if (srcLocal !== dstLocal) {
        this.reorderShortcutsUseCase(srcGlobal, dstGlobal);
      } else {
        this.renderShortcuts(); // clears inline transforms
      }
    }, 200);
  }

  /**
   * Hit-test the pagination bar for a drop target without picking the dragged
   * card itself (which is scaled and floats above the bar — elementFromPoint
   * would otherwise return it instead of the dot underneath). Returns the
   * nearest [data-page-index] element inside the pagination bar, or null.
   */
  _findPageDropTarget(e, d) {
    if (!this.dom.paginationDots) return null;
    if (typeof document.elementsFromPoint !== 'function') {
      // Single-element fallback for ancient browsers (not used in Chrome MV3).
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const tab = hit && hit.closest && hit.closest('[data-page-index]');
      return (tab && this.dom.paginationDots.contains(tab)) ? tab : null;
    }
    const stack = document.elementsFromPoint(e.clientX, e.clientY);
    for (const el of stack) {
      if (d && d.card && (el === d.card || d.card.contains(el))) continue;
      const tab = el.closest && el.closest('[data-page-index]');
      if (tab && this.dom.paginationDots.contains(tab)) return tab;
    }
    return null;
  }

  /**
   * Move a shortcut from its current global index to the destination page.
   * Inserts at the end of the destination page's slice so it lands somewhere
   * visible; user can fine-tune with another drag.
   */
  async moveShortcutToPage(srcGlobal, destPage) {
    const arr = this.state.shortcuts;
    if (srcGlobal < 0 || srcGlobal >= arr.length) return;
    const slots = this.state.slotsPerPage || this.computeSlotsPerPage();
    const totalPages = Math.ceil(arr.length / slots) || 1;
    if (destPage < 0 || destPage >= totalPages) return;

    // Pick the insertion target BEFORE splicing: end of the destination page's
    // slice so the moved shortcut lands at the tail of that page.
    let insertAt = Math.min((destPage + 1) * slots, arr.length);
    const [moved] = arr.splice(srcGlobal, 1);
    if (srcGlobal < insertAt) insertAt -= 1;
    insertAt = Math.max(0, Math.min(insertAt, arr.length));
    arr.splice(insertAt, 0, moved);

    await this.repository.saveShortcuts(this.state.shortcuts);
    this.state.currentPage = destPage;
    this.renderShortcuts();
  }

  exportBackupUseCase() {
    const backupData = {
      settings: this.state.settings,
      shortcuts: this.state.shortcuts
    };

    const jsonStr = JSON.stringify(backupData, null, 2);

    try {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tabline-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showToast(this.t('toast.exported'));
    } catch (err) {
      navigator.clipboard.writeText(jsonStr)
        .then(() => this.showToast(this.t('toast.jsonCopied')))
        .catch(() => this.showToast(this.t('toast.exportFailed')));
    }
  }

  /**
   * INTELLIGENT IMPORT ALGORITHM
   * Reads a .json backup file from the file input.
   * Supports both current format and legacy Chrome extension format.
   */
  async importBackupUseCase() {
    const file = this.dom.importJsonFile.files[0];
    if (!file) {
      this.showToast(this.t('toast.selectJson'));
      return;
    }

    try {
      const rawText = await file.text();
      const parsed = JSON.parse(rawText);
      let importedShortcuts = [];
      let importedSettings = {};

      // 1. CHECK IF LEGACY FORMAT (User's shared backup structure)
      if (parsed.user_app_ids || (parsed.settings && typeof parsed.settings === 'string')) {
        this.showToast(this.t('toast.legacyDetected'));

        if (parsed.settings) {
          try {
            const legacySettings = JSON.parse(parsed.settings);
            importedSettings = {
              timeFormat12: legacySettings.time_format === '12',
              showSearchBar: legacySettings.search_bar !== false,
              bgProvider: 'gradient',
              bgUrl: '',
              bgFileBase64: '',
              dimNight: legacySettings.dim_at_night || false,
              dimStart: '19:00',
              dimEnd: '07:00'
            };
          } catch (e) {
            importedSettings = this.repository.getDefaultSettings();
          }
        }

        const keys = Object.keys(parsed);
        keys.forEach(key => {
          if (key.startsWith('user_app_') && key !== 'user_app_ids' && key !== 'user_app_id_inc') {
            try {
              const appData = JSON.parse(parsed[key]);
              if (appData && appData.name && appData.appLaunchUrl) {
                let iconBase64 = '';
                if (appData.icons && appData.icons.length > 0) {
                  const dataIconObj = appData.icons.find(ico => ico.dataURL && ico.dataURL.startsWith('data:'));
                  if (dataIconObj) iconBase64 = dataIconObj.dataURL;
                }
                importedShortcuts.push(new Shortcut(
                  appData.id || 'imported_' + Math.random().toString(36).substr(2, 9),
                  appData.name, appData.appLaunchUrl, iconBase64, '#D0BCFF', 1.0, 'contain'
                ));
              }
            } catch (err) {
              console.warn('Skipping unparsable legacy app element:', key, err);
            }
          }
        });
      } else {
        // 2. STANDARD FORMAT IMPORT
        if (parsed.settings) importedSettings = parsed.settings;
        if (parsed.shortcuts) {
          importedShortcuts = parsed.shortcuts.map(s => new Shortcut(s.id, s.name, s.url, s.icon, s.color, s.zoom, s.fit || 'contain'));
        }
      }

      if (importedShortcuts.length === 0 && Object.keys(importedSettings).length === 0) {
        throw new Error('No valid data found in the file.');
      }

      if (importedShortcuts.length > 0) this.state.shortcuts = importedShortcuts;
      if (Object.keys(importedSettings).length > 0) this.state.settings = { ...this.state.settings, ...importedSettings };

      await this.repository.saveSettings(this.state.settings);
      await this.repository.saveShortcuts(this.state.shortcuts);

      this.renderSettingsUI();
      this.renderBackground();
      this.renderSearchUI();
      this.renderShortcuts();
      this.renderWallpaperDrawer();

      // Reset file input and re-disable the button until another file is picked.
      this.dom.importJsonFile.value = '';
      this.dom.importFileLabel.textContent = this.t('settings.selectBackup');
      this.dom.importJsonBtn.disabled = true;
      this.toggleDrawer(false);
      this.showToast(this.t('toast.importOk', { count: importedShortcuts.length }));

    } catch (error) {
      console.error(error);
      this.showToast(this.t('toast.importError'));
    }
  }

  /**
   * Reset all settings and shortcuts to factory defaults.
   * Asks for native confirmation before proceeding.
   */
  async resetConfigUseCase() {
    const confirmed = confirm(this.t('dialog.resetConfirm'));
    if (!confirmed) return;

    const defaultSettings = this.repository.getDefaultSettings();
    const defaultShortcuts = this.repository.getDefaultShortcuts();

    this.state.settings = defaultSettings;
    this.state.shortcuts = defaultShortcuts;

    await this.repository.saveSettings(this.state.settings);
    await this.repository.saveShortcuts(this.state.shortcuts);

    this.renderSettingsUI();
    this.renderBackground();
    this.renderSearchUI();
    this.renderShortcuts();
    this.renderWallpaperDrawer();

    this.toggleDrawer(false);
    this.showToast(this.t('toast.resetDone'));
  }
}

// Surface silent async failures (storage writes, fetches, etc.) in DevTools
// instead of letting them disappear into the void. Bookended by [TabLine] so
// the noise is easy to filter when triaging.
window.addEventListener('unhandledrejection', (event) => {
  console.error('[TabLine] Unhandled promise rejection:', event && event.reason);
});

window.addEventListener('error', (event) => {
  // Only log script errors — resource loading failures (e.g. a missing favicon)
  // also fire 'error' on elements; those bubble to window with event.target set.
  if (event && event.target && event.target !== window) return;
  console.error('[TabLine] Uncaught error:', event.error || event.message);
});

// Instantiate and start Controller on Page Load
document.addEventListener('DOMContentLoaded', () => {
  const controller = new NewTabController();
  controller.init();
});
