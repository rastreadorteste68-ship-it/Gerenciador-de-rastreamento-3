
import React, { useState, useEffect, useRef } from 'react';
import { parseClientText } from '../utils/parser';
import { Client, ClientStatus } from '../types';
import { X, ArrowRight, Clipboard, FileText, Upload, Loader2 } from 'lucide-react';

// Declare external libraries loaded via CDN
declare const pdfjsLib: any;
declare const mammoth: any;
declare const XLSX: any;

interface Props {
  onClose: () => void;
  onSave: (client: Partial<Client>) => void;
}

export const SmartPasteModal: React.FC<Props> = ({ onClose, onSave }) => {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<Partial<Client>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (text) {
      setPreview(parseClientText(text || ''));
    } else {
      setPreview({});
    }
  }, [text]);

  const handleSave = () => {
    onSave(preview);
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setText('Processando arquivo...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const type = file.name.split('.').pop()?.toLowerCase();
      let extractedText = '';

      if (type === 'pdf') {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          extractedText += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
      } else if (type === 'docx') {
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        extractedText = result.value || '';
      } else if (type === 'xlsx' || type === 'xls') {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // 1. Try Specific Column Mapping Strategy (Based on user provided layout)
        // A:Marca, B:Modelo, C:Tipo, D:Placa
        // N:Nome, O:CPF, Q:Whats, R:Celular
        // S:Endereço, T:Bairro, U:Cidade, V:Estado, W:CEP
        // Y:Instalador, AB:ID Rastreador, AD:Modelo Rastreador
        const jsonA = XLSX.utils.sheet_to_json(sheet, { header: "A", defval: "" });
        let mappedText = '';
        
        for (const r of jsonA as any[]) {
             // Heuristic: Check if row has valid data in key columns (N=Name) and DOES NOT look like a header
             const valN = r['N'] ? String(r['N']).trim() : '';
             
             // Ignore header row or empty rows
             if (!valN || valN.length < 3 || valN.toLowerCase().includes('cliente') || valN.toLowerCase().includes('nome')) continue;

             // Construct Block
             const marca = r['A'] || '';
             const modelo = r['B'] || '';
             const tipo = r['C'] || '';
             const placa = r['D'] || '';
             
             const nome = r['N'] || '';
             const cpf = r['O'] || '';
             
             const whats = r['Q'] || '';
             const cel = r['R'] || '';
             const phone = whats || cel;
             
             const end = r['S'] || '';
             const bairro = r['T'] || '';
             const cidade = r['U'] || '';
             const estado = r['V'] || '';
             const cep = r['W'] || '';
             
             const instalador = r['Y'] || '';
             const trackerId = r['AB'] || '';
             const trackerModel = r['AD'] || '';
             
             mappedText += `Nome: ${nome}\n`;
             if(cpf) mappedText += `CPF: ${cpf}\n`;
             if(phone) mappedText += `Telefone: ${phone}\n`;
             
             // Combine Brand + Model + Type for Vehicle field
             const fullVehicle = [marca, modelo, tipo].filter(Boolean).join(' ');
             if(fullVehicle) mappedText += `Veículo: ${fullVehicle}\n`;
             
             if(placa) mappedText += `Placa: ${placa}\n`;
             
             // Combine Address components
             let fullAddr = end;
             if(bairro) fullAddr += `, ${bairro}`;
             if(cidade) fullAddr += `, ${cidade}`;
             if(estado) fullAddr += ` - ${estado}`;
             if(cep) fullAddr += ` (${cep})`;
             if(fullAddr) mappedText += `Endereço: ${fullAddr}\n`;
             
             if(trackerId) mappedText += `Rastreador ID: ${trackerId}\n`;
             if(trackerModel) mappedText += `Modelo Rastreador: ${trackerModel}\n`;
             if(instalador) mappedText += `Obs: Instalador ${instalador}\n`;
             
             mappedText += '-------------------\n';
        }

        if (mappedText.length > 10) {
            extractedText = mappedText;
        } else {
             // Fallback to standard CSV if columns don't match
             extractedText = XLSX.utils.sheet_to_csv(sheet) || '';
        }
      } else if (type === 'txt') {
        extractedText = await file.text();
      } else {
        alert('Formato de arquivo não suportado. Tente PDF, Word (.docx) ou Excel.');
        setIsProcessing(false);
        setText('');
        return;
      }

      setText(extractedText);
    } catch (error) {
      console.error(error);
      alert('Erro ao ler o arquivo. Verifique se ele não está corrompido.');
      setText('');
    } finally {
      setIsProcessing(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Clipboard className="text-indigo-600" size={20} />
            <h2 className="font-bold text-lg text-gray-800">Adicionar via Texto Inteligente</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full text-gray-500 transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 grid md:grid-cols-2 gap-6">
          {/* Input Area */}
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
               <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText size={16} className="text-gray-500"/>
                Texto ou Arquivo:
              </label>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 transition flex items-center gap-1 font-medium border border-indigo-200"
              >
                <Upload size={12} /> Importar PDF/Word/Excel
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept=".pdf,.docx,.xlsx,.xls,.txt"
              />
            </div>

            <div className="relative flex-1">
              <textarea
                className={`absolute inset-0 w-full h-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-mono text-sm shadow-inner transition-opacity ${isProcessing ? 'opacity-50' : 'opacity-100'}`}
                placeholder={`Cole o texto aqui (WhatsApp, E-mail ou copiado de Word/Excel/PDF)...\n\nOu clique em "Importar" para carregar arquivos:\n- PDF\n- Word (.docx)\n- Excel (.xlsx)`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isProcessing}
              />
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/80 p-3 rounded-full shadow-lg flex items-center gap-2 text-indigo-600 font-semibold">
                    <Loader2 className="animate-spin" /> Lendo arquivo...
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              O sistema extrai dados de: WhatsApp, E-mails, PDFs, Planilhas e Documentos Word.
            </p>
          </div>

          {/* Preview Area */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-full flex flex-col">
            <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Pré-visualização dos Dados</h3>
            
            <div className="space-y-3 flex-1 overflow-y-auto">
              {Object.entries({
                'Nome': preview.name,
                'Telefone': preview.phone,
                'CPF': preview.cpf,
                'Veículo': preview.vehicle,
                'Placa': preview.plate,
                'Rastreador ID': preview.trackerNumber,
                'Modelo Rastreador': preview.trackerModel, // NEW FIELD ADDED
                'Endereço': preview.address
              }).map(([label, value]) => (
                <div key={label} className="flex flex-col border-b border-gray-100 pb-2 last:border-0">
                  <span className="text-xs text-gray-500 font-medium">{label}</span>
                  <span className={`text-sm font-medium ${value ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                    {value || 'Não identificado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={!preview.name && !preview.plate && !preview.phone}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
          >
            Confirmar Importação <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
