import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Language definitions
export const languages = {
  en: {
    name: 'English',
    flag: '🇺🇸',
    code: 'en'
  },
  es: {
    name: 'Español',
    flag: '🇪🇸',
    code: 'es'
  },
  fr: {
    name: 'Français',
    flag: '🇫🇷',
    code: 'fr'
  },
  de: {
    name: 'Deutsch',
    flag: '🇩🇪',
    code: 'de'
  },
  zh: {
    name: '中文',
    flag: '🇨🇳',
    code: 'zh'
  },
  ja: {
    name: '日本語',
    flag: '🇯🇵',
    code: 'ja'
  },
  ar: {
    name: 'العربية',
    flag: '🇸🇦',
    code: 'ar'
  },
  ru: {
    name: 'Русский',
    flag: '🇷🇺',
    code: 'ru'
  }
};

// Translation keys
export const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    trading: 'Trading',
    market: 'Market',
    wallet: 'Wallet',
    settings: 'Settings',
    profile: 'Profile',
    admin: 'Admin',
    logout: 'Logout',
    
    // Dashboard
    welcomeBack: 'Welcome back',
    totalBalance: 'Total Balance',
    totalPnl: 'Total P&L',
    winRate: 'Win Rate',
    activePositions: 'Active Positions',
    recentTrades: 'Recent Trades',
    
    // Trading
    spot: 'Spot',
    futures: 'Futures',
    options: 'Options',
    binaryOptions: 'Binary Options',
    quantTrading: 'Quant Trading',
    tradingBots: 'Trading Bots',
    staking: 'Staking',
    buy: 'Buy',
    sell: 'Sell',
    amount: 'Amount',
    price: 'Price',
    total: 'Total',
    execute: 'Execute',
    cancel: 'Cancel',
    
    // Wallet
    fundingAccount: 'Funding Account',
    tradingAccount: 'Trading Account',
    transfer: 'Transfer',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    balance: 'Balance',
    available: 'Available',
    totalPortfolio: 'Total Portfolio',
    overview: 'Overview',
    history: 'History',
    hideSmall: 'Hide Small',
    showAll: 'Show All',
    
    // Settings
    profileSettings: 'Profile & Settings',
    generalPreferences: 'General Preferences',
    securitySettings: 'Security Settings',
    notificationPreferences: 'Notification Preferences',
    displayPreferences: 'Display Preferences',
    kycVerification: 'KYC Verification',
    saveChanges: 'Save Changes',
    savePreferences: 'Save Preferences',
    language: 'Language',
    defaultCurrency: 'Default Currency',
    timezone: 'Timezone',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    
    // Notifications
    tradeExecuted: 'Trade Executed',
    withdrawals: 'Withdrawals',
    promotions: 'Promotions',
    priceAlerts: 'Price Alerts',
    orderAlerts: 'Order Alerts',
    
    // KYC
    level1: 'Level 1',
    level2: 'Level 2',
    level3: 'Level 3',
    completed: 'Completed',
    pending: 'Pending',
    failed: 'Failed',
    completeVerification: 'Complete Verification',
    uploadDocuments: 'Upload Documents',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    save: 'Save',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    
    // Messages
    settingsSaved: 'Settings saved successfully',
    profileUpdated: 'Profile updated successfully',
    passwordChanged: 'Password changed successfully',
    twoFactorEnabled: 'Two-factor authentication enabled',
    twoFactorDisabled: 'Two-factor authentication disabled',
    kycSubmitted: 'KYC documents submitted for review',
    profilePictureUpdated: 'Profile picture updated successfully',
    insufficientFunds: 'Insufficient Trading Funds. Please transfer from Funding Account.',
    tradeExecutedSuccess: 'Trade executed successfully',
    tradeFailed: 'Trade failed',
    
    // Auth
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    username: 'Username',
    forgotPassword: 'Forgot Password?',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    
    // Admin
    adminDashboard: 'Admin Dashboard',
    userManagement: 'User Management',
    tradeManagement: 'Trade Management',
    kycManagement: 'KYC Management',
    auditTrail: 'Audit Trail',
    recentActivity: 'Recent Activity',
    totalUsers: 'Total Users',
    activeUsers: 'Active Users',
    totalTrades: 'Total Trades',
    totalVolume: 'Total Volume'
  },
  es: {
    // Navigation
    dashboard: 'Panel de Control',
    trading: 'Trading',
    market: 'Mercado',
    wallet: 'Billetera',
    settings: 'Configuración',
    profile: 'Perfil',
    admin: 'Admin',
    logout: 'Cerrar Sesión',
    
    // Dashboard
    welcomeBack: 'Bienvenido de vuelta',
    totalBalance: 'Balance Total',
    totalPnl: 'P&L Total',
    totalTrades: 'Total de Operaciones',
    winRate: 'Tasa de Éxito',
    activePositions: 'Posiciones Activas',
    recentTrades: 'Operaciones Recientes',
    recentActivity: 'Actividad Reciente',
    
    // Trading
    spot: 'Spot',
    futures: 'Futuros',
    options: 'Opciones',
    binaryOptions: 'Opciones Binarias',
    quantTrading: 'Trading Cuantitativo',
    tradingBots: 'Bots de Trading',
    staking: 'Staking',
    buy: 'Comprar',
    sell: 'Vender',
    amount: 'Cantidad',
    price: 'Precio',
    total: 'Total',
    execute: 'Ejecutar',
    cancel: 'Cancelar',
    
    // Wallet
    fundingAccount: 'Cuenta de Financiamiento',
    tradingAccount: 'Cuenta de Trading',
    transfer: 'Transferir',
    deposit: 'Depositar',
    withdraw: 'Retirar',
    balance: 'Balance',
    available: 'Disponible',
    totalPortfolio: 'Portafolio Total',
    overview: 'Vista General',
    history: 'Historial',
    hideSmall: 'Ocultar Pequeño',
    showAll: 'Mostrar Todo',
    
    // Settings
    profileSettings: 'Perfil y Configuración',
    generalPreferences: 'Preferencias Generales',
    securitySettings: 'Configuración de Seguridad',
    notificationPreferences: 'Preferencias de Notificación',
    displayPreferences: 'Preferencias de Visualización',
    kycVerification: 'Verificación KYC',
    saveChanges: 'Guardar Cambios',
    savePreferences: 'Guardar Preferencias',
    language: 'Idioma',
    defaultCurrency: 'Moneda Predeterminada',
    timezone: 'Zona Horaria',
    theme: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    system: 'Sistema',
    
    // Notifications
    tradeExecuted: 'Operación Ejecutada',
    withdrawals: 'Retiros',
    promotions: 'Promociones',
    priceAlerts: 'Alertas de Precio',
    orderAlerts: 'Alertas de Orden',
    
    // KYC
    level1: 'Nivel 1',
    level2: 'Nivel 2',
    level3: 'Nivel 3',
    completed: 'Completado',
    pending: 'Pendiente',
    failed: 'Fallido',
    completeVerification: 'Completar Verificación',
    uploadDocuments: 'Subir Documentos',
    
    // Common
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    save: 'Guardar',
    confirm: 'Confirmar',
    delete: 'Eliminar',
    edit: 'Editar',
    view: 'Ver',
    close: 'Cerrar',
    back: 'Atrás',
    next: 'Siguiente',
    previous: 'Anterior',
    
    // Messages
    settingsSaved: 'Configuración guardada exitosamente',
    profileUpdated: 'Perfil actualizado exitosamente',
    passwordChanged: 'Contraseña cambiada exitosamente',
    twoFactorEnabled: 'Autenticación de dos factores habilitada',
    twoFactorDisabled: 'Autenticación de dos factores deshabilitada',
    kycSubmitted: 'Documentos KYC enviados para revisión',
    profilePictureUpdated: 'Foto de perfil actualizada exitosamente',
    insufficientFunds: 'Fondos insuficientes en cuenta de trading. Por favor transfiera desde la cuenta de financiamiento.',
    tradeExecutedSuccess: 'Operación ejecutada exitosamente',
    tradeFailed: 'Operación fallida',
    
    // Auth
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    username: 'Nombre de Usuario',
    forgotPassword: '¿Olvidaste tu contraseña?',
    signIn: 'Iniciar Sesión',
    signUp: 'Registrarse',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    dontHaveAccount: '¿No tienes una cuenta?',
    
    // Admin
    adminDashboard: 'Panel de Administración',
    userManagement: 'Gestión de Usuarios',
    tradeManagement: 'Gestión de Operaciones',
    kycManagement: 'Gestión KYC',
    auditTrail: 'Registro de Auditoría',
    totalUsers: 'Total de Usuarios',
    activeUsers: 'Usuarios Activos',
    totalVolume: 'Volumen Total'
  },
  fr: {
    // Navigation
    dashboard: 'Tableau de Bord',
    trading: 'Trading',
    market: 'Marché',
    wallet: 'Portefeuille',
    settings: 'Paramètres',
    profile: 'Profil',
    admin: 'Admin',
    logout: 'Déconnexion',
    
    // Dashboard
    welcomeBack: 'Bon retour',
    totalBalance: 'Solde Total',
    totalPnl: 'P&L Total',
    totalTrades: 'Total des Trades',
    winRate: 'Taux de Réussite',
    activePositions: 'Positions Actives',
    recentTrades: 'Trades Récents',
    recentActivity: 'Activité Récente',
    
    // Trading
    spot: 'Spot',
    futures: 'Futures',
    options: 'Options',
    binaryOptions: 'Options Binaires',
    quantTrading: 'Trading Quantitatif',
    tradingBots: 'Bots de Trading',
    staking: 'Staking',
    buy: 'Acheter',
    sell: 'Vendre',
    amount: 'Montant',
    price: 'Prix',
    total: 'Total',
    execute: 'Exécuter',
    cancel: 'Annuler',
    
    // Wallet
    fundingAccount: 'Compte de Financement',
    tradingAccount: 'Compte de Trading',
    transfer: 'Transférer',
    deposit: 'Déposer',
    withdraw: 'Retirer',
    balance: 'Solde',
    available: 'Disponible',
    totalPortfolio: 'Portefeuille Total',
    overview: 'Aperçu',
    history: 'Historique',
    hideSmall: 'Masquer Petit',
    showAll: 'Afficher Tout',
    
    // Settings
    profileSettings: 'Profil et Paramètres',
    generalPreferences: 'Préférences Générales',
    securitySettings: 'Paramètres de Sécurité',
    notificationPreferences: 'Préférences de Notification',
    displayPreferences: 'Préférences d\'Affichage',
    kycVerification: 'Vérification KYC',
    saveChanges: 'Enregistrer les Modifications',
    savePreferences: 'Enregistrer les Préférences',
    language: 'Langue',
    defaultCurrency: 'Devise par Défaut',
    timezone: 'Fuseau Horaire',
    theme: 'Thème',
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système',
    
    // Notifications
    tradeExecuted: 'Trade Exécuté',
    withdrawals: 'Retraits',
    promotions: 'Promotions',
    priceAlerts: 'Alertes de Prix',
    orderAlerts: 'Alertes de Commande',
    
    // KYC
    level1: 'Niveau 1',
    level2: 'Niveau 2',
    level3: 'Niveau 3',
    completed: 'Terminé',
    pending: 'En Attente',
    failed: 'Échoué',
    completeVerification: 'Terminer la Vérification',
    uploadDocuments: 'Télécharger les Documents',
    
    // Common
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    save: 'Enregistrer',
    confirm: 'Confirmer',
    delete: 'Supprimer',
    edit: 'Modifier',
    view: 'Voir',
    close: 'Fermer',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    
    // Messages
    settingsSaved: 'Paramètres enregistrés avec succès',
    profileUpdated: 'Profil mis à jour avec succès',
    passwordChanged: 'Mot de passe modifié avec succès',
    twoFactorEnabled: 'Authentification à deux facteurs activée',
    twoFactorDisabled: 'Authentification à deux facteurs désactivée',
    kycSubmitted: 'Documents KYC soumis pour examen',
    profilePictureUpdated: 'Photo de profil mise à jour avec succès',
    insufficientFunds: 'Fonds insuffisants dans le compte de trading. Veuillez transférer depuis le compte de financement.',
    tradeExecutedSuccess: 'Trade exécuté avec succès',
    tradeFailed: 'Trade échoué',
    
    // Auth
    login: 'Connexion',
    register: 'S\'inscrire',
    email: 'Email',
    password: 'Mot de Passe',
    confirmPassword: 'Confirmer le Mot de Passe',
    username: 'Nom d\'Utilisateur',
    forgotPassword: 'Mot de passe oublié?',
    signIn: 'Se Connecter',
    signUp: 'S\'inscrire',
    alreadyHaveAccount: 'Vous avez déjà un compte?',
    dontHaveAccount: 'Vous n\'avez pas de compte?',
    
    // Admin
    adminDashboard: 'Tableau de Bord Admin',
    userManagement: 'Gestion des Utilisateurs',
    tradeManagement: 'Gestion des Trades',
    kycManagement: 'Gestion KYC',
    auditTrail: 'Trail d\'Audit',
    totalUsers: 'Total des Utilisateurs',
    activeUsers: 'Utilisateurs Actifs',
    totalVolume: 'Volume Total'
  }
};

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
  getAvailableLanguages: () => typeof languages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && languages[savedLanguage as keyof typeof languages]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', currentLanguage);
  }, [currentLanguage]);

  const setLanguage = (language: string) => {
    if (languages[language as keyof typeof languages]) {
      setCurrentLanguage(language);
    }
  };

  const t = (key: string): string => {
    const currentTranslations = translations[currentLanguage as keyof typeof translations];
    if (!currentTranslations) {
      // Fallback to English
      return translations.en[key as keyof typeof translations.en] || key;
    }
    return currentTranslations[key as keyof typeof currentTranslations] || key;
  };

  const getAvailableLanguages = () => languages;

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
    getAvailableLanguages
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 