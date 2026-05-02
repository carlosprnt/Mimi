export const strings = {
  pro: {
    title: 'Mimi Pro',
    activeTitle: 'Mimi Pro activo',
    activeBody: 'Tienes acceso a todas las funciones Pro.',
    settingsTitle: 'Mimi Pro',
    settingsBody:
      'Desbloquea más bebés, histórico completo, estadísticas y recordatorios.',
    unlock: 'Desbloquear Mimi Pro',
    manage: 'Gestionar suscripción',
    restore: 'Restaurar compras',
    restoreSuccess: 'Compras restauradas',
    restoreError: 'No se pudieron restaurar las compras',
    notNow: 'Ahora no',
    badge: 'Pro',
    locked: 'Disponible en Mimi Pro',
    unlockFeature: 'Desbloquear',

    paywall: {
      title: 'Mimi Pro',
      subtitle: 'Más claridad para acompañar el sueño de tu bebé.',
      monthly: 'Continuar con mensual',
      yearly: 'Continuar con anual',
      restore: 'Restaurar compras',
      notNow: 'Ahora no',
      monthlyFallback: 'Mensual',
      yearlyFallback: 'Anual',
      bullet: {
        multipleBabies: 'Añade más de un bebé',
        fullHistory: 'Consulta todo el histórico',
        fullStats: 'Desbloquea todas las estadísticas',
        notifications: 'Activa recordatorios suaves',
      },
    },

    reason: {
      multipleBabies: {
        title: 'Cuida más de una rutina',
        body: 'Con Mimi Pro puedes añadir más de un bebé y seguir el sueño de cada uno por separado.',
      },
      fullStats: {
        title: 'Entiende mejor su evolución',
        body: 'Desbloquea todas las estadísticas para ver sueño total, siestas, despertares y cambios de rutina con más claridad.',
      },
      fullHistory: {
        title: 'Vuelve a cualquier día',
        body: 'Con Mimi Pro puedes consultar todo el histórico y revisar cómo ha ido cambiando su descanso.',
      },
      notifications: {
        title: 'Recibe recordatorios suaves',
        body: 'Activa avisos para la hora de dormir y otros recordatorios, sin tener que estar pendiente del reloj.',
      },
      settings: {
        title: 'Desbloquea Mimi Pro',
        body: 'Más bebés, histórico completo, todas las estadísticas y recordatorios para acompañar mejor cada rutina.',
      },
      generic: {
        title: 'Desbloquea Mimi Pro',
        body: 'Más seguimiento, más histórico y más claridad para entender el sueño de tu bebé.',
      },
    },
  },
} as const;

export type StringTree = typeof strings;
