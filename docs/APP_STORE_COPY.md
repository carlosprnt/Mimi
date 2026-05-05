# App Store Connect — Copy listo para pegar

Versión 1.0 · iOS

---

## Subtitle (máx. 30 caracteres)

```
Sueño tranquilo, noches mejores
```

(30 caracteres exactos.)

---

## Promotional text (opcional, máx. 170 caracteres)

```
Mimi te avisa antes de la rutina de sueño y te muestra lo que necesita tu bebé según su edad. Sin publicidad, sin rastreo, con sincronización entre tus dispositivos.
```

(170 caracteres.)

---

## Description (máx. 4000 caracteres)

```
Mimi es la app de seguimiento de sueño infantil que cabe en un gesto. Diseñada para padres y cuidadores que quieren entender el ritmo de su bebé sin pelearse con un cronómetro a las tres de la madrugada.

QUÉ HACE MIMI
• Empieza y termina sesiones de sueño con un toque.
• Distingue automáticamente entre siesta, microsueño y sueño nocturno según la hora.
• Registra despertares nocturnos, tomas, cambios y la hora del despertar matinal.
• Calcula sugerencias suaves según la edad de tu bebé: ventana de vigilia, número de siestas esperadas, hora aproximada de dormir.
• Te avisa veinte minutos antes del bedtime estimado, sólo si tú lo activas.
• Resumen visual de la última semana: noches completas, siestas, despertares.

POR QUÉ MIMI ES DISTINTA
• Sin publicidad, sin rastreo, sin compartir datos con terceros para marketing.
• Sólo recoge lo imprescindible: lo que tú introduces sobre tu bebé.
• Modo invitado para usar la app sin crear cuenta. Tus datos se quedan en el dispositivo.
• Si quieres sincronizar entre tu iPhone y otros dispositivos, inicia sesión con Apple o Google. La sincronización es opcional.
• Pensada para varios bebés en la misma cuenta. Cambia entre ellos con un toque.

PRIVACIDAD
• Eliminar tu cuenta y todos los datos es un único toque desde Ajustes. La acción es inmediata e irreversible.
• Cumplimiento con RGPD. Datos alojados en la Unión Europea.
• Política de privacidad y términos disponibles en la propia app.

UN PEQUEÑO RECORDATORIO
Mimi acompaña, no sustituye al pediatra. Las sugerencias son orientativas y se basan en patrones generales por edad. Para cualquier decisión de salud, consulta siempre con un profesional.

Hecho con cariño para padres y madres que quieren noches más tranquilas.
```

(~1750 caracteres, sobra mucho margen.)

---

## Keywords (máx. 100 caracteres, separados por comas, sin espacios extra)

```
baby,sleep,tracker,naps,bedtime,routine,parents,newborn,infant,nights,wakes
```

(80 caracteres. Cabe espacio si quieres añadir alguno como `lullaby`, `nursery`, `colic`.)

---

## Support URL

```
https://carlosprnt.github.io/mimi/support.html
```

## Marketing URL (opcional)

```
https://carlosprnt.github.io/mimi/
```

## Privacy Policy URL (REQUERIDA)

```
https://carlosprnt.github.io/mimi/privacy.html
```

---

## App Review notes (campo "Notes" en App Review Information)

```
Hola equipo de App Review,

Mimi es una app de seguimiento de sueño infantil. Notas para revisión:

• Sign in: la app ofrece "Sign in with Apple" y "Sign in with Google". Para Apple, basta con el Apple ID del dispositivo de prueba (no se requiere cuenta demo). El botón de Apple aparece en la pantalla de bienvenida bajo "Ya tengo cuenta", y también en Ajustes → Cuenta cuando se entra como invitado.

• Account deletion: el botón de eliminar cuenta está en Ajustes → Eliminar cuenta. Al confirmar, la app llama a una Supabase Edge Function que invoca auth.admin.deleteUser sobre el usuario autenticado, lo que en cascada borra todos los datos del servidor (bebés, sesiones de sueño, eventos de cuidado, preferencias). Acto seguido la app limpia el almacenamiento local del dispositivo. Es inmediato e irreversible.

• Modo invitado: la app es totalmente funcional sin crear cuenta. Toca "Empezar" en la pantalla de bienvenida.

• Notificaciones: opcionales. Sólo se programa una notificación local diaria si el usuario activa el toggle "Recordar hora de dormir" en Ajustes.

• Datos: no usamos servicios de tracking de terceros. La sincronización opcional usa Supabase (UE).

Cualquier consulta: carlosprnt@gmail.com.

Gracias.
```

---

## Contact info (App Review)

- First name: Carlos
- Last name: Pariente
- Phone: (tu teléfono)
- Email: carlosprnt@gmail.com

---

## Categoría

- Primary: **Health & Fitness**
- Secondary: **Lifestyle** (opcional)

---

## Age rating

Cuestionario: todo a "None / Not present" → resultado **4+**.

---

## App Privacy questionnaire (resumen rápido)

Marcar como "Linked to user" + "Used for: App Functionality" para:
- **Email Address** (de OAuth)
- **Name** (de OAuth)
- **User ID** (Supabase user id)
- **Health & Fitness → Sleep** (sesiones de sueño)
- **Sensitive Info → Other** (DOB del bebé, sexo opcional)

**Tracking**: NO. La app no rastrea usuarios entre apps ni sitios.
