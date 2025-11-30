import React, { useState } from 'react';
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
  
  const getProcessedMessage = (templateId: string) => {
    const tmpl = templates.find(t => t.id === templateId);
    if (!tmpl) return '';
    
    let msg = tmpl.content;
    msg = msg.replace(/{name}/g, client.name || 'Cliente');
    msg = msg.replace(/{plate}/g, client.plate || '---');
    msg = msg.replace(/{vehicle}/g, client.vehicle || 'seu veículo');
    msg = msg.replace(/{date}/g, client.scheduledDate ? new Date(client.scheduledDate).toLocaleDateString('pt-BR') : '---');
    msg = msg.replace(/{time}/g, client.scheduledTime || '---');
    msg = msg.replace(/{address}/g, client.address || 'nosso endereço');
    return msg;
  };

  const generateLink = (type: 'web' | 'app') => {
    const msg = customMessage || getProcessedMessage(selectedTemplate);
    const encoded = encodeURIComponent(msg);
    let phone = client.phone.replace(/\D/g, '');
    
    // Add Brazil country code (55) if it looks like a local number (10 or 11 digits)
    if (phone.length >= 10 && phone.length <= 11) {
      phone = `55${phone}`;
    }
    
    if (type === 'web') {
      return `https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`;
    }
    
    // Use api.whatsapp.com which is the most reliable standard for triggering the app
    // across different mobile devices/browsers.
    return `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`;
  };

  const handleSend = (type: 'web' | 'app') => {
    const url = generateLink(type);
    window.open(url, '_blank');
    onClose();
  };

  // Update custom message when template changes
  React.useEffect(() => {
    setCustomMessage(getProcessedMessage(selectedTemplate));
  }, [selectedTemplate]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
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
          {/* Header Info */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <span className="text-xs text-gray-500 font-semibold uppercase">Destinatário</span>
            <div className="font-medium text-gray-900 flex items-center gap-2 mt-1">
              {client.name} 
              <span className="text-gray-500 font-normal bg-white px-2 py-0.5 rounded border border-gray-200 text-sm">
                {client.phone || 'Sem número'}
              </span>
            </div>
          </div>

          {/* Template Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo de Mensagem</label>
            <select 
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] transition"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Message Area */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
              Mensagem Final
              <span className="text-xs text-indigo-600 font-normal flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full">
                <Edit size={10}/> Pode editar abaixo
              </span>
            </label>
            <textarea 
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={8}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] bg-white text-gray-900 text-sm leading-relaxed shadow-sm"
            />
          </div>

          {/* Actions */}
          <div className="pt-2">
            {!client.phone ? (
               <p className="text-sm text-red-500 text-center font-medium bg-red-50 p-2 rounded">
                 Este cliente não possui telefone cadastrado.
               </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleSend('web')}
                  className="py-3 px-4 bg-white border border-[#25D366] text-[#075E54] hover:bg-[#25D366]/10 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                >
                  <Monitor size={18} /> WhatsApp Web
                </button>
                <button 
                  onClick={() => handleSend('app')}
                  className="py-3 px-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-md shadow-green-200"
                >
                  <Smartphone size={18} /> Abrir no App
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 text-center mt-3">
              "WhatsApp Web" para computador. "Abrir no App" para celular ou aplicativo desktop instalado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};