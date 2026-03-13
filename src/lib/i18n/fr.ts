export const fr = {
  nav: {
    specialists: 'Spécialistes',
    pricing: 'Tarifs',
    login: 'Se connecter',
    mainNav: 'Navigation principale',
    mobileMenu: 'Ouvrir le menu',
    mobileNav: 'Navigation mobile',
    mobileTitle: 'Menu de navigation',
  },
  userMenu: {
    ariaLabel: "Menu de l'utilisateur",
    profile: 'Mon profil',
    admin: 'Painel Admin',
    logout: 'Déconnexion',
    loggingOut: 'Déconnexion...',
  },
  footer: {
    tagline: 'Experts IA spécialisés disponibles 24h/24 pour vous accompagner.',
    usefulLinks: 'Liens utiles',
    usefulLinksAria: 'Liens utiles',
    experts: 'Nos experts',
    pricing: 'Tarifs',
    legal: 'Légal',
    legalAria: 'Liens légaux',
    privacy: 'Politique de confidentialité',
    terms: "Conditions d'utilisation",
    rights: 'Tous droits réservés.',
  },
  disclaimer: {
    ariaLabel: 'Aviso legal',
    text: 'Je suis une IA spécialisée et ne remplace pas un professionnel certifié.',
  },
  chat: {
    placeholder: 'Posez votre question au spécialiste...',
    send: 'Envoyer un message',
    write: 'Écrire un message',
  },
  landing: {
    heroTitle: 'Votre expert IA, disponible 24h/24',
    heroDesc:
      'Accédez à des spécialistes IA dans divers domaines. Des conseils personnalisés, adaptés à votre situation, à tout moment.',
    discover: 'Découvrir nos experts',
    demo: 'Voir la démo',
    sectionTitle: 'Nos Experts IA',
    sectionDesc: 'Des spécialistes IA disponibles 24h/24 pour répondre à vos besoins.',
    comingSoon: 'Nos experts arrivent bientôt...',
  },
  pricing: {
    metaTitle: 'Tarifs | ultra-ia',
    metaDesc: 'Accédez à votre expert IA pour 99€/mois. Annulation à tout moment.',
    title: 'Tarifs simples et transparents',
    subtitle: 'Votre expert IA spécialisé, disponible à tout moment pour',
    perMonth: '/mois',
    expertLabel: 'Expert IA',
    ctaSubscribe: "S'abonner maintenant",
    ctaAccess: 'Accéder à mon expert',
    ctaStart: 'Commencer',
    benefitsAria: 'Avantages inclus',
    cancelNote: 'Annulation à tout moment. Aucun engagement.',
    benefits: [
      'Accès 24h/24, 7j/7 à votre expert IA',
      'Questions illimitées (dans la limite journalière)',
      'Historique complet de vos conversations',
      'Réponses personnalisées selon votre contexte',
      'Expert spécialisé dans votre domaine',
    ],
    faqTitle: 'Questions fréquentes',
    faqs: [
      {
        value: 'payment',
        question: 'Comment fonctionne le paiement ?',
        answer: 'Paiement sécurisé via Stripe. Votre carte est débitée mensuellement au même jour.',
      },
      {
        value: 'cancel',
        question: 'Puis-je annuler à tout moment ?',
        answer:
          "Oui, depuis votre espace \"Facturation\". L'accès reste actif jusqu'à la fin de la période payée.",
      },
      {
        value: 'commitment',
        question: 'Y a-t-il un engagement ?',
        answer: 'Aucun engagement. Abonnement mensuel résiliable à tout moment sans frais.',
      },
      {
        value: 'missed-payment',
        question: 'Que se passe-t-il si je rate un paiement ?',
        answer:
          "Vous bénéficiez d'une période de grâce. Nous vous contactons avant toute interruption de service.",
      },
      {
        value: 'data-security',
        question: 'Les données de ma conversation sont-elles sécurisées ?',
        answer:
          'Oui, vos conversations sont chiffrées. Vous pouvez demander leur suppression à tout moment (conformité RGPD).',
      },
    ],
  },
  profile: {
    chat: 'Discuter',
    call: 'Appeler',
    callSoon: 'Appeler (bientôt disponible)',
    listen: 'Écouter',
    listenAria: 'Écouter la présentation audio',
    backAria: 'Retour aux experts',
    subscribers: '+250 inscrits',
    perMonth: '/mois',
    unlimitedAccess: 'Accès illimité à',
    frequentQuestions: 'Questions fréquentes',
    startConversation: 'Démarrer une conversation',
    startConversationAria: 'Démarrer une conversation avec',
    askQuestion: 'Poser une question à',
  },
};

export type Translation = typeof fr;
