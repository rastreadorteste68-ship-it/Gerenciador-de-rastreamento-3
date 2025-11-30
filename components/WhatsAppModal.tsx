import React, { useState, useEffect } from 'react';
import { Client, Template } from '../types';
import { MessageCircle, Send, X, Edit, Smartphone, Monitor } from 'lucide-react';

interface Props {
  client: Client;
  templates: Template[];
  onClose: () => void;
}

export const WhatsAppModal: React.FC<Props> = ({ client, templates, onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(templates[0]?.id || '');
  const [customMessage, setCustomMessage] = useState('');
  const [userEdited, setUserEdited] = useState(false);

  // ---------------------------
  // Função que substitui as variáveis do template
  // ---------------------------
  const getProcessedMessage = (templateId: string) => {
    const tmpl = templates.find(t => t.id === templateId);
    if (!tmpl) return '';

    let msg = tmpl.content;

    const replacements: Record<string, string> = {
      '{name}': client.name || 'Cliente',
      '{plate}': client.plate || '---',
      '{vehicle}': client.vehicle || 'seu veículo',
      '{date}': client.scheduledDate
        ? new Date(client.scheduledDate).toLocaleDateString('pt-BR')
        : '---',
      '{time}': client.scheduledTime || '---',
      '{address}': client.address || 'nosso endereço'
    };

    // Aplica todas as substituições
    for (const key of Object.keys(replacements)) {
      msg = msg.replace(new RegExp(key, 'g'), replacements[key]);
    }

    return msg;
  };

  // ------------------------------------
  // Gera link para WhatsApp Web ou App
  // ------------------------------------
  const generateLink = (type: 'web' | 'app') => {
    const message = customMessage || getProcessedMessage(selectedTemplate);
    const encoded = encodeURIComponent(message);

    let phone = client.phone?.replace(/\D/g, '') || '';

    // Se o número parecer local (10 ou 11 dígitos), adiciona 55
    if (phone.length >= 10 && phone.length <= 11) {
      phone = `55${phone}`;
    }

    return type === 'web'
      ? `https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`
      : `https://wa.me/${phone}?text=${encoded}`;
  };

  // ---------------------------
  // Quando o template muda, atualiza mensagem se ela não foi editada manualmente
  // ---------------------------
  useEffect(() => {
    if (!userEdited) {
      setCustomMessage(getProcessedMessage(selectedTemplate));
    }
  }, [selectedTemplate]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b bg-[#25D366]/10">
          <div className="flex items-center gap-2 text-[#075E54]">
            <MessageCircle size={24} />
            <h2 className="font-bold text-lg">Enviar WhatsApp</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">

          {/* CLIENT INFO */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <span className="text-xs text-gray-500 font-semibold uppercase">Destinatário</span>
            <div className="font-medium text-gray-900 flex items-center gap-2 mt-1">
              {client.name}
              <span className="text-gray-500 font-normal bg-white px-2 py-0.5 rounded border border-gray-200 text-sm">
                {client.phone || 'Sem número'}
              </span>
            </div>
          </div>

          {/* TEMPLATE SELECT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modelo de Mensagem
            </label>
            <select 
              value={selectedTemplate}
              onChange={(e) => {
                setSelectedTemplate(e.target.value);
                setUserEdited(false); // Sempre que trocar template, a edição manual reseta
              }}
              className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366]"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* MESSAGE AREA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
              Mensagem Final
              <span className="text-xs text-indigo-600 font-normal flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full">
                <Edit size={10}/> Pode editar abaixo
              </span>
            </label>
            <textarea 
              value={customMessage}
              onChange={(e) => {
                setCustomMessage(e.target.value);
                setUserEdited(true); // Usuário fez edição manual
              }}
              rows={8}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] text-sm leading-relaxed"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-2">
            {!client.phone ? (
              <p className="text-sm text-red-500 text-center font-medium bg-red-50 p-2 rounded">
                Este cliente não possui telefone cadastrado.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => window.open(generateLink('web'), '_blank')}
                  className="py-3 px-4 bg-white border border-[#25D366] text-[#075E54] hover:bg-[#25D366]/10 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Monitor size={18} /> WhatsApp Web
                </button>
                <button 
                  onClick={() => window.open(generateLink('app'), '_blank')}
                  className="py-3 px-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-green-200"
                >
                  <Smartphone size={18} /> Abrir no App
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 text-center mt-3">
              "WhatsApp Web" para usar no PC. "Abrir no App" abre o aplicativo no celular.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
