import { getLocale } from '@/i18n';

export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalDocument {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}

const PRIVACY_ES: LegalDocument = {
  title: 'Política de privacidad',
  lastUpdated: 'Última actualización: 1 de mayo de 2026',
  sections: [
    {
      heading: 'Resumen',
      body: 'Mimi te ayuda a registrar y entender el sueño de tu bebé. Esta política explica qué datos recogemos, por qué, dónde se guardan y cómo puedes borrarlos en cualquier momento.',
    },
    {
      heading: 'Qué datos recogemos',
      body: 'Datos que tú introduces sobre tu bebé: nombre, fecha de nacimiento, sexo (opcional), si nació antes de tiempo, sus sesiones de sueño y eventos de cuidado (tomas, cambios, despertares). Si inicias sesión con Apple o Google, también guardamos tu email y nombre de cuenta. Tus preferencias de la app (formato de hora, recordatorios) también se guardan.',
    },
    {
      heading: 'Para qué usamos los datos',
      body: 'Para mostrarte recomendaciones personalizadas según la edad de tu bebé, sincronizar la información entre tus dispositivos y enviarte recordatorios opcionales sólo si los activas. No usamos tus datos para publicidad ni para entrenar modelos de inteligencia artificial.',
    },
    {
      heading: 'Dónde se guardan los datos',
      body: 'En tu dispositivo (modo invitado) y, si inicias sesión, en Supabase, un proveedor de base de datos en la Unión Europea. Las comunicaciones siempre van por HTTPS. Tu identidad ante Apple o Google sólo la usan ellos para verificar el acceso; nosotros recibimos un identificador único y tu email.',
    },
    {
      heading: 'Compartir con terceros',
      body: 'No vendemos ni cedemos tus datos a terceros con fines publicitarios. Los únicos servicios que tratan tus datos en nuestro nombre son Supabase (alojamiento de la base de datos) y Apple / Google (sólo para la autenticación si la usas).',
    },
    {
      heading: 'Tus derechos (RGPD)',
      body: 'Puedes acceder, modificar y exportar tus datos desde la propia app. Puedes eliminar tu cuenta y todos tus datos de forma permanente desde Ajustes → Eliminar cuenta. Esa acción es irreversible y borra tus datos del servidor inmediatamente.',
    },
    {
      heading: 'Niños',
      body: 'Mimi está dirigida a padres y cuidadores adultos que registran datos sobre su bebé. La app no está destinada a menores de 13 años y no recogemos datos directamente del bebé. Los datos del bebé son introducidos voluntariamente por el adulto a cargo.',
    },
    {
      heading: 'Conservación',
      body: 'Mantenemos tus datos mientras tu cuenta esté activa. Si eliminas la cuenta, los datos se borran inmediatamente. En modo invitado, los datos sólo viven en tu dispositivo y se eliminan al desinstalar la app.',
    },
    {
      heading: 'Cambios en esta política',
      body: 'Si hacemos cambios materiales en esta política, lo comunicaremos en la app antes de que tengan efecto.',
    },
    {
      heading: 'Contacto',
      body: 'Para cualquier duda sobre privacidad, escríbenos a hola@mimi.app.',
    },
  ],
};

const PRIVACY_EN: LegalDocument = {
  title: 'Privacy policy',
  lastUpdated: 'Last updated: May 1, 2026',
  sections: [
    {
      heading: 'Summary',
      body: 'Mimi helps you track and understand your baby’s sleep. This policy explains what data we collect, why, where it lives, and how you can wipe it whenever you want.',
    },
    {
      heading: 'What data we collect',
      body: 'Information you enter about your baby: name, date of birth, sex (optional), whether they were born early, sleep sessions and care events (feeds, diapers, night wakes). If you sign in with Apple or Google we also keep your email and account name. Your in-app preferences (24h clock, reminders) are stored too.',
    },
    {
      heading: 'How we use it',
      body: 'To show personalised recommendations based on your baby’s age, sync your data across your devices, and send optional reminders only when you enable them. We do not use your data for advertising and we do not train AI models with it.',
    },
    {
      heading: 'Where it lives',
      body: 'On your device (guest mode) and, if you sign in, in Supabase, an EU-based database provider. All traffic uses HTTPS. Apple and Google only see your identity to confirm sign-in; we receive a unique identifier and your email.',
    },
    {
      heading: 'Sharing with third parties',
      body: 'We do not sell or share your data with third parties for advertising. The only services that process data on our behalf are Supabase (database hosting) and Apple / Google (only when you use their sign-in).',
    },
    {
      heading: 'Your rights (GDPR)',
      body: 'You can access, edit and export your data from inside the app. You can permanently delete your account and all data from Settings → Delete account. That action is irreversible and removes server-side data right away.',
    },
    {
      heading: 'Children',
      body: 'Mimi is intended for adult parents and caregivers who track data about their baby. The app is not aimed at children under 13 and we do not collect any data from the baby directly. The baby’s data is voluntarily entered by the responsible adult.',
    },
    {
      heading: 'Retention',
      body: 'We keep your data while your account is active. If you delete the account the data is removed immediately. In guest mode the data only lives on your device and is gone when you uninstall the app.',
    },
    {
      heading: 'Changes to this policy',
      body: 'If we make material changes to this policy we will surface them in the app before they take effect.',
    },
    {
      heading: 'Contact',
      body: 'For privacy questions: hola@mimi.app.',
    },
  ],
};

const TERMS_ES: LegalDocument = {
  title: 'Términos de uso',
  lastUpdated: 'Última actualización: 1 de mayo de 2026',
  sections: [
    {
      heading: 'Aceptación',
      body: 'Al usar Mimi aceptas estos términos. Si no estás de acuerdo, no uses la app.',
    },
    {
      heading: 'Uso de la app',
      body: 'Mimi es una herramienta de seguimiento del sueño infantil. Las sugerencias de la app son orientativas, basadas en patrones generales por edad, y no sustituyen el consejo de tu pediatra ni de ningún profesional de la salud.',
    },
    {
      heading: 'Tu cuenta',
      body: 'Si creas una cuenta, eres responsable de mantener tus credenciales seguras. Comprométete a no usar la app para fines ilegales, ofensivos o que puedan dañar a terceros.',
    },
    {
      heading: 'Limitación de responsabilidad',
      body: 'Mimi se ofrece "tal cual", sin garantías explícitas o implícitas de que las recomendaciones encajen con tu bebé concreto. Para cualquier decisión médica o de salud, consulta siempre con un profesional cualificado.',
    },
    {
      heading: 'Cambios en el servicio',
      body: 'Podemos modificar, suspender o discontinuar funciones de la app sin previo aviso. Avisaremos en la propia app si los cambios son materiales.',
    },
    {
      heading: 'Cambios en estos términos',
      body: 'Si actualizamos estos términos, lo comunicaremos en la app antes de que tengan efecto.',
    },
    {
      heading: 'Contacto',
      body: 'Cualquier consulta sobre estos términos: hola@mimi.app.',
    },
  ],
};

const TERMS_EN: LegalDocument = {
  title: 'Terms of use',
  lastUpdated: 'Last updated: May 1, 2026',
  sections: [
    {
      heading: 'Acceptance',
      body: 'By using Mimi you accept these terms. If you do not agree, please do not use the app.',
    },
    {
      heading: 'Using the app',
      body: 'Mimi is a baby-sleep tracking tool. The suggestions in the app are guidance based on general age patterns; they do not replace the advice of your paediatrician or any health professional.',
    },
    {
      heading: 'Your account',
      body: 'If you create an account you are responsible for keeping your credentials safe. You agree not to use the app for illegal, harmful or offensive purposes.',
    },
    {
      heading: 'Limitation of liability',
      body: 'Mimi is provided "as is", with no explicit or implicit warranty that the recommendations match your specific baby. For any medical or health decision always consult a qualified professional.',
    },
    {
      heading: 'Service changes',
      body: 'We may modify, suspend or discontinue features without prior notice. Material changes will be surfaced in the app.',
    },
    {
      heading: 'Changes to these terms',
      body: 'If we update these terms we will surface them in the app before they take effect.',
    },
    {
      heading: 'Contact',
      body: 'Questions about these terms: hola@mimi.app.',
    },
  ],
};

export const getPrivacyDocument = (): LegalDocument =>
  getLocale() === 'es' ? PRIVACY_ES : PRIVACY_EN;

export const getTermsDocument = (): LegalDocument =>
  getLocale() === 'es' ? TERMS_ES : TERMS_EN;
