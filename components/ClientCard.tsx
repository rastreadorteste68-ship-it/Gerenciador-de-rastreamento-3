import React from 'react';
import { Client, ClientStatus } from '../types';
import { formatPhone, formatPlate } from '../utils/parser';
import { MapPin, Calendar, Clock, Car, MoreVertical, Phone, Trash2, Edit, CheckCircle } from 'lucide-react';

interface Props {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onWhats: (client: Client) => void;
  onToggleStatus: (id: string) => void;
}

export const ClientCard: React.FC<Props> = ({ client, onEdit, onDelete, onWhats, onToggleStatus }) => {
  const statusColors = {
    [ClientStatus.TODO]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [ClientStatus.SCHEDULED]: 'bg-blue-100 text-blue-800 border-blue-200',
    [ClientStatus.DONE]: 'bg-green-100 text-green-800 border-green-200 line-through opacity-75',
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition hover:shadow-md relative group ${client.status === ClientStatus.DONE ? 'bg-gray-50' : ''}`}>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className={`font-bold text-gray-900 ${client.status === ClientStatus.DONE ? 'line-through text-gray-500' : ''}`}>
            {client.name}
          </h3>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${statusColors[client.status]}`}>
            {client.status}
          </span>
        </div>
        <div className="flex gap-1">
           <button onClick={() => onEdit(client)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition" title="Editar">
            <Edit size={16} />
          </button>
           <button onClick={() => onWhats(client)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition" title="WhatsApp">
            <Phone size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2 text-sm text-gray-600">
        
        {/* Vehicle */}
        {(client.vehicle || client.plate) && (
          <div className="flex items-center gap-2">
            <Car size={14} className="text-gray-400" />
            <span className="font-medium text-gray-800">
              {client.vehicle} {client.plate && <span className="bg-gray-100 text-gray-600 px-1 rounded border border-gray-200 text-xs ml-1 font-mono">{formatPlate(client.plate)}</span>}
            </span>
          </div>
        )}

        {/* Schedule */}
        {(client.scheduledDate || client.scheduledTime) && (
          <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 p-1.5 rounded">
            <Calendar size={14} />
            <span>
              {client.scheduledDate ? new Date(client.scheduledDate).toLocaleDateString('pt-BR') : 'Data indef.'} 
              {client.scheduledTime && <span className="ml-1 text-xs opacity-75">às {client.scheduledTime}</span>}
            </span>
          </div>
        )}

        {/* Address */}
        {client.address && (
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
            <span className="line-clamp-2 leading-tight">{client.address}</span>
          </div>
        )}

        {/* Phone */}
        {client.phone && (
          <div className="text-xs text-gray-400 pl-6">
            {formatPhone(client.phone)}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
         <button 
          onClick={() => onToggleStatus(client.id)}
          className={`text-xs font-medium flex items-center gap-1 transition ${client.status === ClientStatus.DONE ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`}
        >
          {client.status === ClientStatus.DONE ? (
             <>Desmarcar Concluído</>
          ) : (
             <><CheckCircle size={14} /> Marcar Concluído</>
          )}
        </button>

        <button 
          onClick={() => { if(window.confirm('Excluir cliente?')) onDelete(client.id) }} 
          className="text-gray-400 hover:text-red-500 transition p-1"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};