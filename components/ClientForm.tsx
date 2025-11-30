import React, { useState, useEffect, useRef } from 'react';
import { Client, ClientStatus } from '../types';
import { generateId } from '../utils/parser';
import { Save, X, Calendar, Clock } from 'lucide-react';

interface Props {
  initial?: Partial<Client> | null;
  onSave: (client: Client) => void;
  onCancel: () => void;
}

export const ClientForm: React.FC<Props> = ({ initial, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    status: ClientStatus.TODO,
    name: '',
    phone: '',
    address: '',
    vehicle: '',
    plate: '',
    trackerNumber: '',
    trackerModel: '',
    observations: '',
    scheduledDate: '',
    scheduledTime: '',
  });

  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initial) {
      setFormData({ ...formData, ...initial });
    }
  }, [initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client: Client = {
      id: initial?.id || generateId(),
      createdAt: initial?.createdAt || Date.now(),
      name: formData.name || 'Sem Nome',
      phone: formData.phone || '',
      address: formData.address || '',
      vehicle: formData.vehicle || '',
      plate: formData.plate || '',
      trackerNumber: formData.trackerNumber || '',
      trackerModel: formData.trackerModel || '',
      observations: formData.observations || '',
      scheduledDate: formData.scheduledDate || '',
      scheduledTime: formData.scheduledTime || '',
      status: formData.status || ClientStatus.TODO,
    };
    onSave(client);
  };

  const handleChange = (field: keyof Client, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const triggerPicker = (ref: React.RefObject<HTMLInputElement>) => {
    try {
      if (ref.current && 'showPicker' in ref.current) {
        (ref.current as any).showPicker();
      } else {
        ref.current?.focus();
      }
    } catch (e) {
      console.warn('Picker API not supported', e);
      ref.current?.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Info */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 border-b pb-1">Dados Pessoais</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input 
              required
              value={formData.name} 
              onChange={e => handleChange('name', e.target.value)}
              className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Telefone (WhatsApp)</label>
            <input 
              value={formData.phone} 
              onChange={e => handleChange('phone', e.target.value)}
              placeholder="Ex: 11999999999"
              className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Endereço</label>
            <textarea 
              value={formData.address} 
              onChange={e => handleChange('address', e.target.value)}
              rows={2}
              className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
            />
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 border-b pb-1">Dados do Veículo</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Placa</label>
              <input 
                value={formData.plate} 
                onChange={e => handleChange('plate', e.target.value.toUpperCase())}
                className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rastreador ID</label>
              <input 
                value={formData.trackerNumber} 
                onChange={e => handleChange('trackerNumber', e.target.value)}
                className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
              />
            </div>
          </div>
          
           {/* New Field: Tracker Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Modelo Rastreador</label>
            <input 
              value={formData.trackerModel} 
              onChange={e => handleChange('trackerModel', e.target.value)}
              className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
              placeholder="Ex: TK303, Coban, Suntech..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Veículo (Modelo/Cor)</label>
            <input 
              value={formData.vehicle} 
              onChange={e => handleChange('vehicle', e.target.value)}
              className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
            />
          </div>
        </div>

        {/* Status & Schedule */}
        <div className="md:col-span-2 space-y-4 mt-2">
          <h4 className="font-semibold text-gray-700 border-b pb-1">Agendamento e Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select 
                value={formData.status} 
                onChange={e => handleChange('status', e.target.value as ClientStatus)}
                className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
              >
                {Object.values(ClientStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            {/* Date Field - Interactive Icon */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Data Agendada</label>
              <div className="mt-1 relative group">
                <input 
                  ref={dateInputRef}
                  type="date"
                  value={formData.scheduledDate} 
                  onChange={e => handleChange('scheduledDate', e.target.value)}
                  onClick={() => triggerPicker(dateInputRef)}
                  className="w-full p-2 pr-10 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                />
                <button 
                  type="button"
                  onClick={() => triggerPicker(dateInputRef)}
                  className="absolute right-0 top-0 bottom-0 px-3 text-gray-500 group-hover:text-indigo-600 transition flex items-center justify-center outline-none focus:text-indigo-600"
                  tabIndex={-1}
                >
                  <Calendar size={18} />
                </button>
              </div>
            </div>

            {/* Time Field - Interactive Icon */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Hora</label>
              <div className="mt-1 relative group">
                <input 
                  ref={timeInputRef}
                  type="time"
                  value={formData.scheduledTime} 
                  onChange={e => handleChange('scheduledTime', e.target.value)}
                  onClick={() => triggerPicker(timeInputRef)}
                  className="w-full p-2 pr-10 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                />
                <button 
                  type="button"
                  onClick={() => triggerPicker(timeInputRef)}
                  className="absolute right-0 top-0 bottom-0 px-3 text-gray-500 group-hover:text-indigo-600 transition flex items-center justify-center outline-none focus:text-indigo-600"
                  tabIndex={-1}
                >
                  <Clock size={18} />
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea 
              value={formData.observations} 
              onChange={e => handleChange('observations', e.target.value)}
              rows={2}
              className="mt-1 w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 pt-4 border-t">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2 bg-white"
        >
          <X size={16} /> Cancelar
        </button>
        <button 
          type="submit" 
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
        >
          <Save size={16} /> Salvar Cliente
        </button>
      </div>
    </form>
  );
};
