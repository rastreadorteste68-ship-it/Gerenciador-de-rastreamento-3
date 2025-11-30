import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from './services/storageService';
import { Client, ClientStatus, Template } from './types';
import { ClientCard } from './components/ClientCard';
import { ClientForm } from './components/ClientForm';
import { SmartPasteModal } from './components/SmartPasteModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { Plus, Search, Filter, Download, Zap, Users, CheckCircle, Calendar, Settings, X } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filter, setFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isSmartPasteOpen, setIsSmartPasteOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [whatsAppClient, setWhatsAppClient] = useState<Client | null>(null);

  // Initialize Data
  useEffect(() => {
    setClients(StorageService.getClients());
    setTemplates(StorageService.getTemplates());
  }, []);

  // Persistence Effect
  useEffect(() => {
    if (clients.length > 0) {
      StorageService.saveClients(clients);
    }
  }, [clients]);

  // Derived State (Stats)
  const stats = useMemo(() => {
    return {
      total: clients.length,
      todo: clients.filter(c => c.status === ClientStatus.TODO).length,
      scheduled: clients.filter(c => c.status === ClientStatus.SCHEDULED).length,
      done: clients.filter(c => c.status === ClientStatus.DONE).length,
    };
  }, [clients]);

  // Derived State (Filtered List)
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      // 1. Text Search
      const searchLower = searchQuery.toLowerCase();
      
      // Safe access using (val || '') to prevent "Cannot read properties of undefined (reading 'toLowerCase')"
      const nameMatch = (c.name || '').toLowerCase().includes(searchLower);
      const plateMatch = (c.plate || '').toLowerCase().includes(searchLower);
      const vehicleMatch = (c.vehicle || '').toLowerCase().includes(searchLower);
      
      const matchesSearch = nameMatch || plateMatch || vehicleMatch;
      
      if (!matchesSearch) return false;

      // 2. Status Filter
      if (filter === 'Todos') return true;
      return c.status === filter;
    }).sort((a, b) => {
      // Sort: ToDo first, then Scheduled, then Done
      const score = (status: ClientStatus) => {
        if (status === ClientStatus.TODO) return 3;
        if (status === ClientStatus.SCHEDULED) return 2;
        return 1;
      };
      return score(b.status) - score(a.status) || b.createdAt - a.createdAt;
    });
  }, [clients, filter, searchQuery]);

  // Actions
  const handleAddClient = (client: Client) => {
    if (editingClient && editingClient.id) {
      // Edit mode: Update existing client
      setClients(prev => prev.map(c => c.id === client.id ? client : c));
    } else {
      // Add mode: Insert new client
      setClients(prev => [client, ...prev]);
    }
    setIsFormOpen(false);
    setEditingClient(null);
  };

  const handleSmartPasteData = (data: Partial<Client>) => {
    // Instead of adding immediately, open the form with the parsed data
    // This allows the user to review/edit before saving
    setEditingClient(data);
    setIsSmartPasteOpen(false);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setClients(prev => {
        const newClients = prev.filter(c => c.id !== id);
        StorageService.saveClients(newClients); // Force save for delete empty state
        return newClients;
    });
  };

  const handleToggleStatus = (id: string) => {
    setClients(prev => prev.map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        status: c.status === ClientStatus.DONE ? ClientStatus.TODO : ClientStatus.DONE
      };
    }));
  };

  const handleExportCSV = () => {
    const header = ['ID', 'Nome', 'Telefone', 'Veículo', 'Placa', 'Rastreador', 'Status', 'Data Agendada', 'Endereço', 'Observações'];
    const rows = clients.map(c => [
      c.id, 
      c.name || '', 
      c.phone || '', 
      c.vehicle || '', 
      c.plate || '', 
      c.trackerNumber || '', 
      c.status, 
      `${c.scheduledDate || ''} ${c.scheduledTime || ''}`, 
      (c.address || '').replace(/,/g, ' '), 
      (c.observations || '').replace(/,/g, ' ')
    ]);
    
    const csvContent = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'clientes_rastreador.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans text-gray-800">
      
      {/* Sidebar / Topbar */}
      <aside className="bg-white border-b md:border-b-0 md:border-r border-gray-200 w-full md:w-64 flex-shrink-0 flex flex-col h-auto md:h-screen sticky top-0 z-20">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
            <Zap size={20} fill="currentColor" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">Rastreador<span className="text-indigo-600">Mgr</span></h1>
        </div>

        <div className="p-4 space-y-6 flex-1 overflow-y-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
             <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center text-blue-800 mb-1">
                  <span className="text-xs font-semibold uppercase">Total</span>
                  <Users size={14} />
                </div>
                <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
             </div>
             <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <div className="flex justify-between items-center text-green-800 mb-1">
                  <span className="text-xs font-semibold uppercase">Instalados</span>
                  <CheckCircle size={14} />
                </div>
                <div className="text-2xl font-bold text-green-900">{stats.done}</div>
             </div>
          </div>

          {/* Filters */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Filtros</h3>
            <div className="space-y-1">
              {['Todos', ClientStatus.TODO, ClientStatus.SCHEDULED, ClientStatus.DONE].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition flex justify-between items-center ${
                    filter === f 
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-100 border' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {f}
                  {f === ClientStatus.TODO && <span className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded-full">{stats.todo}</span>}
                  {f === ClientStatus.SCHEDULED && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full">{stats.scheduled}</span>}
                </button>
              ))}
            </div>
          </div>

           {/* Tools */}
           <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ferramentas</h3>
            <div className="space-y-2">
              <button 
                onClick={handleExportCSV} 
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition"
              >
                <Download size={16} /> Exportar CSV
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition opacity-50 cursor-not-allowed" title="Em breve">
                <Settings size={16} /> Configurações
              </button>
            </div>
           </div>
        </div>

        {/* Mobile FAB Placeholder (Used mainly for desktop layout consistency) */}
        <div className="hidden md:block p-4 border-t border-gray-100">
           <div className="text-xs text-gray-400 text-center">v1.0.0 &copy; 2024</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
           <div className="relative flex-1 max-w-lg">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
              type="text" 
              placeholder="Buscar por nome, placa ou veículo..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
             />
           </div>

           <div className="flex gap-2">
             <button 
              onClick={() => setIsSmartPasteOpen(true)}
              className="flex-1 md:flex-none px-4 py-2 bg-white border border-indigo-100 text-indigo-600 rounded-xl font-semibold shadow-sm hover:bg-indigo-50 transition flex items-center justify-center gap-2"
             >
               <Zap size={18} /> Importar Texto
             </button>
             <button 
              onClick={() => { setEditingClient(null); setIsFormOpen(true); }}
              className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition flex items-center justify-center gap-2"
             >
               <Plus size={18} /> Novo Cliente
             </button>
           </div>
        </div>

        {/* Filters Summary (Mobile only mainly) */}
        <div className="md:hidden flex overflow-x-auto gap-2 mb-4 pb-2">
            <span className="px-3 py-1 bg-white border rounded-full text-xs font-medium whitespace-nowrap">
              {filteredClients.length} resultados
            </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map(client => (
            <ClientCard 
              key={client.id} 
              client={client} 
              onEdit={(c) => { setEditingClient(c); setIsFormOpen(true); }}
              onDelete={handleDelete}
              onWhats={setWhatsAppClient}
              onToggleStatus={handleToggleStatus}
            />
          ))}
          
          {filteredClients.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
               <Filter size={48} className="mb-4 opacity-20" />
               <p className="text-lg font-medium">Nenhum cliente encontrado</p>
               <p className="text-sm">Tente ajustar seus filtros ou adicione um novo cliente.</p>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {isSmartPasteOpen && (
        <SmartPasteModal 
          onClose={() => setIsSmartPasteOpen(false)} 
          onSave={handleSmartPasteData} 
        />
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
             <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h2 className="font-bold text-lg text-gray-800">
                  {editingClient?.id ? 'Editar Cliente' : 'Novo Cliente'}
                </h2>
                <button onClick={() => setIsFormOpen(false)}><X size={20} className="text-gray-500" /></button>
             </div>
             <div className="p-6 overflow-y-auto">
                <ClientForm 
                  initial={editingClient} 
                  onSave={handleAddClient} 
                  onCancel={() => setIsFormOpen(false)} 
                />
             </div>
          </div>
        </div>
      )}

      {whatsAppClient && (
        <WhatsAppModal 
          client={whatsAppClient} 
          templates={templates} 
          onClose={() => setWhatsAppClient(null)} 
        />
      )}
    </div>
  );
};

export default App;