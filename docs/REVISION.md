# Guía de revisión con el equipo

Esta guía es para que el equipo general revise la cartelera **antes** de abrirla a todos los coordinadores y antes de conectar la edición en línea.

---

## Cómo abrirla

1. Abre la dirección publicada (o `http://localhost:8000` si la estás viendo en una computadora).
2. Mírala primero en la computadora y luego en el teléfono.
3. Recorre las secciones del menú: **Inicio, Calendario, Avisos, Comunidad, Recursos**.

> Mientras no se conecte Supabase, la web está en **modo demostración**. Eso significa que los cambios que hagas (propuestas, oración, panel) se guardan solo en tu navegador y **no** los ve el resto del equipo. Es ideal para revisar sin riesgo.

---

## Qué revisar

### 1. Identidad
- [ ] Nombre: Pastoral Familiar · Parroquia Monte Tabor.
- [ ] Lema: “Ante todo, amar y servir”.
- [ ] Logo en la cabecera, el pie y la pestaña del navegador.
- [ ] Dirección y datos de contacto (teléfono y WhatsApp aún vacíos).

### 2. Calendario
- [ ] La **misa de comunidad** aparece todos los viernes a las 6:00 p. m.
- [ ] La **misa parroquial** aparece el primer domingo de cada mes a las 5:00 p. m.
- [ ] Al abrir una misa de viernes, se ve la **comunidad asignada**.
- [ ] Una actividad con imagen muestra la foto completa en su ficha y en la agenda del día.
- [ ] Al tocar la imagen se abre en grande, sin recortes.
- [ ] Un aviso con imagen muestra la foto en la tarjeta y al abrirlo.
- [ ] La fila **Comunidad** filtra las actividades (por ejemplo, Santa Mónica).
- [ ] Los filtros por tipo de actividad funcionan.
- [ ] **Compartir**: un mensaje enviado queda pendiente y aparece solo después de aprobarlo.
- [ ] **Compartir**: un enlace de YouTube se muestra como video.
- [ ] **Compartir QR**: el código se genera y cambia al elegir Inicio, Calendario o Compartir.
- [ ] El QR se puede descargar, imprimir y enviar por WhatsApp.
- [ ] El pie muestra **Redes sociales** arriba de Facebook/Instagram.
- [ ] El botón **Activar notificaciones** pide permiso y avisa de una publicación nueva.
- [ ] La vista **Agenda** y la exportación `.ics` funcionan.

### 3. Santísimo
- [ ] La página dice que es el horario de los **domingos**.
- [ ] Noviembre tiene las cinco comunidades con sus horas (7:00 a 12:00).
- [ ] Se puede cambiar de mes con las flechas.

### 4. Equipo y comunidades
- [ ] Aparecen los **cinco ejes**: Coordinación General, Matrimonios, Jóvenes, Encuentro y Convivencia, Tema Fijo.
- [ ] Aparecen las **cinco comunidades**: Santa Mónica, San Juan Pablo II, San José, San Francisco de Asís, Jóvenes.
- [ ] Los nombres y contactos pendientes se ven claramente como “por confirmar”.

### 5. Contenido
- [ ] Avisos: prioridad, fijados y búsqueda.
- [ ] Recursos: documentos y enlaces.
- [ ] Galería: álbumes (las fotos reales se subirán después).
- [ ] **Fotos por comunidad**: cada comunidad tiene su espacio y su botón “Subir fotos”.
- [ ] Oración: envío de una intención.
- [ ] “Proponer actividad”: una propuesta queda pendiente de aprobación.
- [ ] Panel (`/#/admin`): se puede entrar en modo demo con cualquier correo y contraseña.
- [ ] En celular, el panel muestra **Cerrar sesión** debajo del menú de secciones.

### 6. Teléfono
- [ ] El menú se abre bien.
- [ ] Las tarjetas y el calendario no se salen de la pantalla.
- [ ] Los botones se pueden tocar con comodidad.

---

## Cómo mandar observaciones

Para cada detalle, anota:

1. **Sección** (por ejemplo, Calendario).
2. **Qué pasa** (por ejemplo, “la misa del domingo aparece a las 5, correcto”).
3. **Qué debería pasar**.
4. Si puedes, una **captura de pantalla**.

Envíalas por el grupo de coordinación o directamente al responsable de la web. No hace falta entrar al panel para opinar.

---

## Datos que faltan y conviene recoger en la revisión

- [x] Nombres y teléfonos de los **cinco responsables de eje**.
- [x] Nombres y teléfonos de los **cinco coordinadores de comunidad**.
- [ ] Teléfono y WhatsApp generales de la pastoral.
- [ ] Si la **misa del primer domingo** tiene comunidad asignada.
- [ ] Horarios del Santísimo de **diciembre en adelante**.
- [ ] Rotación de comunidades de las misas de **enero en adelante**.
- [ ] Fotos reales de las actividades (con permiso de las familias).
- [ ] Confirmar si se mantienen los nombres “Comunidad San Francisco de Asís” y “Comunidad de Jóvenes”.

---

## Después de la revisión

Cuando el equipo apruebe el contenido:

1. Se conecta **Supabase** para que los coordinadores editen desde sus teléfonos.
2. Se crean las cuentas:
   - **Coordinador general** → administrador.
   - **Responsables de eje** → editores.
   - **Coordinadores de comunidad** → editores (más adelante se puede limitar a su comunidad).
3. Se cargan los nombres y contactos reales.
4. Se hace una prueba con dos coordinadores antes de compartirla con toda la pastoral.

---

## Lo que todavía no debe esperarse

- Iniciar sesión con correo y contraseña reales (eso llega con Supabase).
- Que los cambios de una persona aparezcan en el teléfono de otra.
- Notificaciones automáticas por WhatsApp o correo.

Todo eso es la siguiente fase, no un defecto de esta revisión.
