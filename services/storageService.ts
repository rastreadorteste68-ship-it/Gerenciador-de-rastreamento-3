import { Client, Template, INITIAL_TEMPLATES } from '../types';

const KEYS = {
  CLIENTS: 'rastreador_clients',
  TEMPLATES: 'rastreador_templates',
};

export const StorageService = {
  getClients: (): Client[] => {
    try {
      const stored = localStorage.getItem(KEYS.CLIENTS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load clients", e);
      return [];
    }
  },

  saveClients: (clients: Client[]) => {
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
  },

  getTemplates: (): Template[] => {
    try {
      const stored = localStorage.getItem(KEYS.TEMPLATES);
      return stored ? JSON.parse(stored) : INITIAL_TEMPLATES;
    } catch (e) {
      return INITIAL_TEMPLATES;
    }
  },

  saveTemplates: (templates: Template[]) => {
    localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(templates));
  },
};