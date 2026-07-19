import type { SupportedLanguage } from './prompts'

/**
 * UI copy for the three official FIFA World Cup 2026 languages.
 * AC-IN-04: the app's own UI labels must switch with the language selector.
 */
export interface UiStrings {
  tagline: string
  languageLabel: string
  textInputLabel: string
  textInputPlaceholder: string
  micButtonLabel: string
  micButtonLabelStop: string
  imageUploadLabel: string
  removeImageLabel: string
  submitButtonLabel: string
  sampleQuestionsHeading: string
  responseHeading: string
  playAloud: string
  stopPlaying: string
  copyButton: string
  translateToggle: string
  showOriginal: string
  skipToMain: string
  charCounterSuffix: string
  thinking: string
  speakingIndicator: string
  fallbackHeading: string
  tryAgain: string
  errorGeneric: string

  // v2 — role selector
  roleSelectorHeading: string
  roleSelectorIntro: string
  roleFanLabel: string
  roleStaffLabel: string
  roleSecurityLabel: string
  sectionInputLabel: string
  sectionInputPlaceholder: string
  zoneInputLabel: string
  zoneInputPlaceholder: string
  continueButtonLabel: string
  sectionRequiredError: string
  switchRoleButtonLabel: string
  demoModeBadge: string

  // v2 — fan dashboard tabs
  tabConcierge: string
  tabLost: string
  tabOrder: string
  tabHelp: string

  // v2 — lost & found
  lostInputLabel: string
  lostInputPlaceholder: string
  lostSubmitLabel: string

  // v2 — order from your seat
  orderMenuHeading: string
  orderQtyLabel: string
  orderNotesLabel: string
  orderNotesPlaceholder: string
  orderSubmitLabel: string
  orderSectionPrefix: string
  orderNoSectionFallback: string
  orderConfirmation: string
  orderEmptySelectionError: string
  myOrdersHeading: string
  orderStatusPending: string
  orderStatusFulfilled: string
  upsellPrefix: string

  // v2 — request help / report a disturbance
  helpHeading: string
  helpIntro: string
  helpKindLostLabel: string
  helpKindDisturbanceLabel: string
  helpKindGeneralLabel: string
  helpDescriptionLabel: string
  helpDescriptionPlaceholder: string
  helpSubmitLabel: string
  helpConfirmation: string
  myHelpRequestsHeading: string
  helpStatusOpen: string
  helpStatusAcknowledged: string
  helpStatusResolved: string
  goToLostTabPrompt: string
  goToLostTabButton: string

  // v2 — urgency labels (shared by fan confirmation + staff queue)
  urgencyLow: string
  urgencyMedium: string
  urgencyHigh: string

  // v2 — staff order queue
  staffOrderQueueHeading: string
  staffNoOrders: string
  staffMarkFulfilled: string
  staffSectionFilterLabel: string
  staffAllSections: string

  // v2 — security help queue
  securityHelpQueueHeading: string
  securityNoRequests: string
  securityAcknowledge: string
  securityResolve: string
}

export const UI_STRINGS: Record<SupportedLanguage, UiStrings> = {
  en: {
    tagline: 'Accessible wayfinding for FIFA World Cup 2026',
    languageLabel: 'Language',
    textInputLabel: 'Ask AccessPath a question',
    textInputPlaceholder: 'e.g. How do I reach Section 114 at MetLife Stadium without stairs?',
    micButtonLabel: 'Start voice input',
    micButtonLabelStop: 'Stop voice input',
    imageUploadLabel: 'Upload a photo of your ticket or seating map',
    removeImageLabel: 'Remove uploaded image',
    submitButtonLabel: 'Ask AccessPath',
    sampleQuestionsHeading: 'Try a sample question',
    responseHeading: 'AccessPath\u2019s answer',
    playAloud: 'Play answer aloud',
    stopPlaying: 'Stop',
    copyButton: 'Copy',
    translateToggle: 'Translate to my language',
    showOriginal: 'Show original',
    skipToMain: 'Skip to main content',
    charCounterSuffix: 'characters',
    thinking: 'Still thinking\u2026',
    speakingIndicator: 'Speaking\u2026',
    fallbackHeading: 'AccessPath is temporarily unavailable',
    tryAgain: 'Try again',
    errorGeneric: 'Something went wrong. Please try again.',

    roleSelectorHeading: 'Who are you today?',
    roleSelectorIntro:
      'AccessPath adapts to your role at the venue. Pick one to continue \u2014 you can switch anytime.',
    roleFanLabel: 'Fan',
    roleStaffLabel: 'Staff (orders)',
    roleSecurityLabel: 'Security / Volunteer (help requests)',
    sectionInputLabel: 'Your seat section',
    sectionInputPlaceholder: 'e.g. Section 114',
    zoneInputLabel: 'Zone you\u2019re covering (optional)',
    zoneInputPlaceholder: 'e.g. Gate 5 / North concourse',
    continueButtonLabel: 'Continue',
    sectionRequiredError: 'Please enter your seat section.',
    switchRoleButtonLabel: 'Switch role',
    demoModeBadge: 'Demo mode: synced across tabs in this browser only',

    tabConcierge: 'Accessibility Q&A',
    tabLost: 'Lost & Found',
    tabOrder: 'Order',
    tabHelp: 'Help',

    lostInputLabel: 'Where do you need to get back to?',
    lostInputPlaceholder:
      'e.g. I got separated from my group near Gate 5 and need to get back to Section 114',
    lostSubmitLabel: 'Get directions back',

    orderMenuHeading: 'What would you like?',
    orderQtyLabel: 'Quantity for',
    orderNotesLabel: 'Order notes (optional)',
    orderNotesPlaceholder: 'e.g. no ice, extra napkins',
    orderSubmitLabel: 'Place order for',
    orderSectionPrefix: 'Section',
    orderNoSectionFallback: '(unspecified)',
    orderConfirmation: 'Order sent \u2014 staff can see it now.',
    orderEmptySelectionError: 'Select at least one item before ordering.',
    myOrdersHeading: 'Your orders',
    orderStatusPending: 'Preparing',
    orderStatusFulfilled: 'Delivered',
    upsellPrefix: 'Also consider:',

    helpHeading: 'Request help',
    helpIntro: 'One tap alerts the nearest staff or security member with your section.',
    helpKindLostLabel: 'I\u2019m lost / I\u2019ve lost someone',
    helpKindDisturbanceLabel: 'Report a disturbance',
    helpKindGeneralLabel: 'Other assistance',
    helpDescriptionLabel: 'Briefly describe what\u2019s happening',
    helpDescriptionPlaceholder: 'e.g. the person behind me is being disruptive',
    helpSubmitLabel: 'Send request',
    helpConfirmation: 'Help request sent \u2014 staff have been notified.',
    myHelpRequestsHeading: 'Your requests',
    helpStatusOpen: 'Sent',
    helpStatusAcknowledged: 'Staff notified, on the way',
    helpStatusResolved: 'Resolved',
    goToLostTabPrompt: 'Need walking directions instead?',
    goToLostTabButton: 'Open Lost & Found',

    urgencyLow: 'Low',
    urgencyMedium: 'Medium',
    urgencyHigh: 'High',

    staffOrderQueueHeading: 'Live order queue',
    staffNoOrders: 'No orders yet. New orders will appear here instantly.',
    staffMarkFulfilled: 'Mark fulfilled',
    staffSectionFilterLabel: 'Filter by section',
    staffAllSections: 'All sections',

    securityHelpQueueHeading: 'Live help queue',
    securityNoRequests: 'No open requests. New requests will appear here instantly.',
    securityAcknowledge: 'Acknowledge',
    securityResolve: 'Resolve',
  },
  es: {
    tagline: 'Orientaci\u00f3n accesible para la Copa Mundial de la FIFA 2026',
    languageLabel: 'Idioma',
    textInputLabel: 'Hazle una pregunta a AccessPath',
    textInputPlaceholder:
      'p. ej. \u00bfC\u00f3mo llego a la Secci\u00f3n 114 en el MetLife Stadium sin escaleras?',
    micButtonLabel: 'Iniciar entrada de voz',
    micButtonLabelStop: 'Detener entrada de voz',
    imageUploadLabel: 'Sube una foto de tu boleto o mapa de asientos',
    removeImageLabel: 'Quitar imagen subida',
    submitButtonLabel: 'Preguntar a AccessPath',
    sampleQuestionsHeading: 'Prueba una pregunta de ejemplo',
    responseHeading: 'Respuesta de AccessPath',
    playAloud: 'Reproducir respuesta en voz alta',
    stopPlaying: 'Detener',
    copyButton: 'Copiar',
    translateToggle: 'Traducir a mi idioma',
    showOriginal: 'Mostrar original',
    skipToMain: 'Saltar al contenido principal',
    charCounterSuffix: 'caracteres',
    thinking: 'Pensando\u2026',
    speakingIndicator: 'Hablando\u2026',
    fallbackHeading: 'AccessPath no est\u00e1 disponible temporalmente',
    tryAgain: 'Intentar de nuevo',
    errorGeneric: 'Algo sali\u00f3 mal. Int\u00e9ntalo de nuevo.',

    roleSelectorHeading: '\u00bfQui\u00e9n eres hoy?',
    roleSelectorIntro:
      'AccessPath se adapta a tu rol en el estadio. Elige uno para continuar \u2014 puedes cambiarlo en cualquier momento.',
    roleFanLabel: 'Aficionado',
    roleStaffLabel: 'Personal (pedidos)',
    roleSecurityLabel: 'Seguridad / Voluntariado (solicitudes de ayuda)',
    sectionInputLabel: 'Tu secci\u00f3n de asiento',
    sectionInputPlaceholder: 'p. ej. Secci\u00f3n 114',
    zoneInputLabel: 'Zona que cubres (opcional)',
    zoneInputPlaceholder: 'p. ej. Puerta 5 / Explanada norte',
    continueButtonLabel: 'Continuar',
    sectionRequiredError: 'Por favor ingresa tu secci\u00f3n de asiento.',
    switchRoleButtonLabel: 'Cambiar rol',
    demoModeBadge: 'Modo demo: sincronizado solo entre pesta\u00f1as de este navegador',

    tabConcierge: 'Preguntas de accesibilidad',
    tabLost: 'Objetos y personas perdidas',
    tabOrder: 'Pedido',
    tabHelp: 'Ayuda',

    lostInputLabel: '\u00bfA d\u00f3nde necesitas volver?',
    lostInputPlaceholder:
      'p. ej. Me separ\u00e9 de mi grupo cerca de la Puerta 5 y necesito volver a la Secci\u00f3n 114',
    lostSubmitLabel: 'Obtener direcciones',

    orderMenuHeading: '\u00bfQu\u00e9 te gustar\u00eda pedir?',
    orderQtyLabel: 'Cantidad de',
    orderNotesLabel: 'Notas del pedido (opcional)',
    orderNotesPlaceholder: 'p. ej. sin hielo, servilletas extra',
    orderSubmitLabel: 'Enviar pedido para',
    orderSectionPrefix: 'Secci\u00f3n',
    orderNoSectionFallback: '(sin especificar)',
    orderConfirmation: 'Pedido enviado \u2014 el personal ya puede verlo.',
    orderEmptySelectionError: 'Selecciona al menos un art\u00edculo antes de pedir.',
    myOrdersHeading: 'Tus pedidos',
    orderStatusPending: 'Preparando',
    orderStatusFulfilled: 'Entregado',
    upsellPrefix: 'Tambi\u00e9n considera:',

    helpHeading: 'Solicitar ayuda',
    helpIntro: 'Un toque avisa al personal o seguridad m\u00e1s cercano con tu secci\u00f3n.',
    helpKindLostLabel: 'Estoy perdido / perd\u00ed a alguien',
    helpKindDisturbanceLabel: 'Reportar una alteraci\u00f3n',
    helpKindGeneralLabel: 'Otra asistencia',
    helpDescriptionLabel: 'Describe brevemente lo que sucede',
    helpDescriptionPlaceholder: 'p. ej. la persona detr\u00e1s de m\u00ed est\u00e1 siendo disruptiva',
    helpSubmitLabel: 'Enviar solicitud',
    helpConfirmation: 'Solicitud enviada \u2014 el personal ha sido notificado.',
    myHelpRequestsHeading: 'Tus solicitudes',
    helpStatusOpen: 'Enviada',
    helpStatusAcknowledged: 'Personal notificado, en camino',
    helpStatusResolved: 'Resuelta',
    goToLostTabPrompt: '\u00bfNecesitas indicaciones en su lugar?',
    goToLostTabButton: 'Abrir Objetos y personas perdidas',

    urgencyLow: 'Baja',
    urgencyMedium: 'Media',
    urgencyHigh: 'Alta',

    staffOrderQueueHeading: 'Cola de pedidos en vivo',
    staffNoOrders: 'A\u00fan no hay pedidos. Los nuevos aparecer\u00e1n aqu\u00ed al instante.',
    staffMarkFulfilled: 'Marcar como entregado',
    staffSectionFilterLabel: 'Filtrar por secci\u00f3n',
    staffAllSections: 'Todas las secciones',

    securityHelpQueueHeading: 'Cola de ayuda en vivo',
    securityNoRequests: 'No hay solicitudes abiertas. Las nuevas aparecer\u00e1n aqu\u00ed al instante.',
    securityAcknowledge: 'Reconocer',
    securityResolve: 'Resolver',
  },
  fr: {
    tagline: 'Orientation accessible pour la Coupe du Monde de la FIFA 2026',
    languageLabel: 'Langue',
    textInputLabel: 'Posez une question \u00e0 AccessPath',
    textInputPlaceholder:
      'ex. Comment aller \u00e0 la Section 114 au MetLife Stadium sans escaliers\u00a0?',
    micButtonLabel: 'D\u00e9marrer la saisie vocale',
    micButtonLabelStop: 'Arr\u00eater la saisie vocale',
    imageUploadLabel: 'T\u00e9l\u00e9versez une photo de votre billet ou plan de si\u00e8ges',
    removeImageLabel: 'Retirer l\u2019image t\u00e9l\u00e9vers\u00e9e',
    submitButtonLabel: 'Demander \u00e0 AccessPath',
    sampleQuestionsHeading: 'Essayez une question exemple',
    responseHeading: 'R\u00e9ponse d\u2019AccessPath',
    playAloud: 'Lire la r\u00e9ponse \u00e0 voix haute',
    stopPlaying: 'Arr\u00eater',
    copyButton: 'Copier',
    translateToggle: 'Traduire dans ma langue',
    showOriginal: 'Afficher l\u2019original',
    skipToMain: 'Aller au contenu principal',
    charCounterSuffix: 'caract\u00e8res',
    thinking: 'R\u00e9flexion en cours\u2026',
    speakingIndicator: 'Parle\u2026',
    fallbackHeading: 'AccessPath est temporairement indisponible',
    tryAgain: 'R\u00e9essayer',
    errorGeneric: 'Une erreur est survenue. Veuillez r\u00e9essayer.',

    roleSelectorHeading: 'Qui \u00eates-vous aujourd\u2019hui\u00a0?',
    roleSelectorIntro:
      'AccessPath s\u2019adapte \u00e0 votre r\u00f4le au stade. Choisissez-en un pour continuer \u2014 vous pouvez changer \u00e0 tout moment.',
    roleFanLabel: 'Supporter',
    roleStaffLabel: 'Personnel (commandes)',
    roleSecurityLabel: 'S\u00e9curit\u00e9 / B\u00e9n\u00e9vole (demandes d\u2019aide)',
    sectionInputLabel: 'Votre section de si\u00e8ge',
    sectionInputPlaceholder: 'ex. Section 114',
    zoneInputLabel: 'Zone que vous couvrez (optionnel)',
    zoneInputPlaceholder: 'ex. Porte 5 / Esplanade nord',
    continueButtonLabel: 'Continuer',
    sectionRequiredError: 'Veuillez indiquer votre section de si\u00e8ge.',
    switchRoleButtonLabel: 'Changer de r\u00f4le',
    demoModeBadge: 'Mode d\u00e9mo\u00a0: synchronis\u00e9 uniquement entre les onglets de ce navigateur',

    tabConcierge: 'Questions d\u2019accessibilit\u00e9',
    tabLost: 'Objets et personnes perdus',
    tabOrder: 'Commande',
    tabHelp: 'Aide',

    lostInputLabel: 'O\u00f9 devez-vous retourner\u00a0?',
    lostInputPlaceholder:
      'ex. Je me suis s\u00e9par\u00e9 de mon groupe pr\u00e8s de la Porte 5 et je dois retourner \u00e0 la Section 114',
    lostSubmitLabel: 'Obtenir l\u2019itin\u00e9raire',

    orderMenuHeading: 'Que souhaitez-vous commander\u00a0?',
    orderQtyLabel: 'Quantit\u00e9 pour',
    orderNotesLabel: 'Notes de commande (optionnel)',
    orderNotesPlaceholder: 'ex. sans glace, serviettes suppl\u00e9mentaires',
    orderSubmitLabel: 'Envoyer la commande pour',
    orderSectionPrefix: 'Section',
    orderNoSectionFallback: '(non pr\u00e9cis\u00e9)',
    orderConfirmation: 'Commande envoy\u00e9e \u2014 le personnel peut d\u00e9j\u00e0 la voir.',
    orderEmptySelectionError: 'S\u00e9lectionnez au moins un article avant de commander.',
    myOrdersHeading: 'Vos commandes',
    orderStatusPending: 'En pr\u00e9paration',
    orderStatusFulfilled: 'Livr\u00e9e',
    upsellPrefix: '\u00c0 consid\u00e9rer aussi\u00a0:',

    helpHeading: 'Demander de l\u2019aide',
    helpIntro: 'Un seul tap alerte le membre du personnel ou de la s\u00e9curit\u00e9 le plus proche avec votre section.',
    helpKindLostLabel: 'Je suis perdu / j\u2019ai perdu quelqu\u2019un',
    helpKindDisturbanceLabel: 'Signaler une perturbation',
    helpKindGeneralLabel: 'Autre assistance',
    helpDescriptionLabel: 'D\u00e9crivez bri\u00e8vement ce qui se passe',
    helpDescriptionPlaceholder: 'ex. la personne derri\u00e8re moi est perturbatrice',
    helpSubmitLabel: 'Envoyer la demande',
    helpConfirmation: 'Demande d\u2019aide envoy\u00e9e \u2014 le personnel a \u00e9t\u00e9 notifi\u00e9.',
    myHelpRequestsHeading: 'Vos demandes',
    helpStatusOpen: 'Envoy\u00e9e',
    helpStatusAcknowledged: 'Personnel notifi\u00e9, en route',
    helpStatusResolved: 'R\u00e9solue',
    goToLostTabPrompt: 'Besoin d\u2019un itin\u00e9raire \u00e0 la place\u00a0?',
    goToLostTabButton: 'Ouvrir Objets et personnes perdus',

    urgencyLow: 'Faible',
    urgencyMedium: 'Moyenne',
    urgencyHigh: '\u00c9lev\u00e9e',

    staffOrderQueueHeading: 'File de commandes en direct',
    staffNoOrders: 'Aucune commande pour l\u2019instant. Les nouvelles commandes appara\u00eetront ici instantan\u00e9ment.',
    staffMarkFulfilled: 'Marquer comme livr\u00e9e',
    staffSectionFilterLabel: 'Filtrer par section',
    staffAllSections: 'Toutes les sections',

    securityHelpQueueHeading: 'File d\u2019aide en direct',
    securityNoRequests: 'Aucune demande ouverte. Les nouvelles demandes appara\u00eetront ici instantan\u00e9ment.',
    securityAcknowledge: 'Accuser r\u00e9ception',
    securityResolve: 'R\u00e9soudre',
  },
}
