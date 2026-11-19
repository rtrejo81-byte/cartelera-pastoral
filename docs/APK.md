# Instalar la cartelera como app (PWA) y generar un APK

La web ya es una **PWA**: se puede instalar en el teléfono con su propio icono, abrir a pantalla completa y guardar el armazón para cargar rápido. No necesita APK para funcionar.

## Instalar sin APK

### Android (Chrome)

1. Abre **https://rtrejo81-byte.github.io/cartelera-pastoral/**.
2. Toca el menú **⋮**.
3. Elige **“Instalar app”** o **“Agregar a pantalla principal”**.
4. Confirma. Aparece el icono de la Pastoral Familiar.

### iPhone (Safari)

1. Abre la misma dirección en **Safari**.
2. Toca **Compartir** → **Agregar a pantalla de inicio**.
3. Confirma.

En iPhone no se puede instalar un APK; la PWA es la forma correcta.

## Generar un APK para Android

El APK se puede crear sin programar usando **PWABuilder**:

1. Entra a **https://www.pwabuilder.com/**.
2. Pega la URL:
   `https://rtrejo81-byte.github.io/cartelera-pastoral/`
3. Pulsa **Start** y espera el análisis.
4. Elige **Android** → **Generate package**.
5. Descarga el **APK** (para instalar directo) o el **AAB** (para Play Store).
6. Instala el APK en el teléfono permitiendo “instalar apps de origen desconocido”, o súbelo a Google Play Console.

### Firma

PWABuilder puede crear una **firma nueva** por ti. Guarda el archivo `.keystore` y su contraseña en un lugar seguro: sin ellos no podrás publicar actualizaciones del APK.

### Sin barra de direcciones

Para que el APK se vea como app y no como navegador, PWABuilder pide un archivo:

```
https://rtrejo81-byte.github.io/cartelera-pastoral/.well-known/assetlinks.json
```

Ese archivo lleva la huella SHA-256 de la firma. PWABuilder te muestra el contenido exacto; cuando tengas la huella, se puede agregar al repositorio.

### Actualizaciones

El APK es solo el “envoltorio”: cuando cambias actividades, fotos o avisos en la web, el APK muestra lo nuevo automáticamente. Solo hay que volver a generar el APK si cambia el icono, el nombre o la configuración de la app.

## ¿APK propio con Android Studio?

También se puede con **Capacitor** o un WebView, pero requiere Java + Android SDK y mantener un proyecto aparte. Para esta pastoral no aporta ventajas frente a la PWA o al APK de PWABuilder, y un WebView pierde cosas como el botón atrás o la instalación limpia.

## Play Store

- Cuenta de desarrollador: pago único de **$25**.
- Hay que subir el **AAB**, no el APK.
- Google revisa la app y pide política de privacidad.
- Para compartir con el equipo alcanza el APK directo o la PWA; Play Store es opcional.

## Resumen

| Opción | Android | iPhone | Actualización | Costo |
| --- | --- | --- | --- | --- |
| PWA (instalar desde el navegador) | Sí | Sí | Automática | $0 |
| APK con PWABuilder | Sí | No | Automática | $0 |
| Play Store | Sí | No | Automática | $25 único |
| App nativa con Android Studio | Sí | No | Manual | Tiempo de desarrollo |
