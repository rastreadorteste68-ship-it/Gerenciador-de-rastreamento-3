
import { Client, ClientStatus } from '../types';

export const generateId = () => Math.random().toString(36).substring(2, 9);

// CPF validator
const isValidCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf[10])) return false;

  return true;
};

// DDD brasileiros (telefones válidos no Brasil)
const validDDDs = new Set([
  '11','12','13','14','15','16','17','18','19',
  '21','22','24','27','28',
  '31','32','33','34','35','37','38',
  '41','42','43','44','45','46',
  '47','48','49',
  '51','53','54','55',
  '61','62','63','64','65','66','67',
  '68','69',
  '71','73','74','75','77','79',
  '81','82','83','84','85','86','87','88','89',
  '91','92','93','94','95','96','97','98','99'
]);

// Check if number is a real phone
const isValidPhone = (num: string) => {
  num = num.replace(/\D/g, '');
  if (num.length !== 10 && num.length !== 11) return false;
  const ddd = num.substring(0, 2);
  
  if (!validDDDs.has(ddd)) return false;

  if (num.length === 11 && num[2] !== '9') return false; // celulares sempre começam com 9

  return true;
};

// Detect IMEI
const isIMEI = (num: string) => num.length === 15;

// Detect tracker (ID usualmente 6–12 digits)
const isTrackerID = (num: string) => num.length >= 6 && num.length <= 12;

export const parseClientText = (text: string): Partial<Client> => {
  if (!text) return {};
  
  const result: Partial<Client> = {
    status: ClientStatus.TODO,
    createdAt: Date.now(),
  };

  const cleanedText = text.replace(/\r/g, '');

  // 1. NUMBER EXTRACTION (CPF, Phone, IMEI, ID)
  // We extract all large numbers first to classify them accurately
  const allNumbers: string[] = [];
  const numRegex = /\d{6,15}/g;
  let match;
  while ((match = numRegex.exec(cleanedText)) !== null) {
    allNumbers.push(match[0]);
  }

  let cpf: string | undefined;
  let phone: string | undefined;
  let imei: string | undefined;
  let tracker: string | undefined;

  for (const num of allNumbers) {
    const digits = num.replace(/\D/g, '');

    if (isValidCPF(digits)) {
      cpf = digits;
      continue;
    }
    if (isValidPhone(digits) && !phone) {
      phone = digits;
      continue;
    }
    if (isIMEI(digits) && !imei) {
      imei = digits;
      continue;
    }
    if (isTrackerID(digits) && !tracker) {
      tracker = digits;
      continue;
    }
  }

  if (cpf) result.cpf = cpf;
  if (phone) result.phone = phone;
  if (imei) result.trackerNumber = imei;
  if (tracker && !imei) result.trackerNumber = tracker;

  // 2. TEXT FIELDS EXTRACTION
  
  // Split text into non-empty lines for easier parsing of "Label \n Value" structures
  const lines = cleanedText.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);

  // List of keywords to identify field boundaries
  const allKeywords = [
    'Nome', 'Cliente', 'Responsável',
    'Endereço', 'End', 'Local', 'Logradouro', 'Rua', 'Av', 'Avenida',
    'Telefone', 'Celular', 'Whatsapp', 'Tel', 'Fone',
    'Veículo', 'Carro', 'Moto', 'Modelo', 'Marca', 'Cor',
    'Placa', 'Chassi',
    'Rastreador', 'ID', 'IMEI', 'Serial', 'Equipamento', 'Modelo Rastreador', 'Modelo Equipamento',
    'CPF', 'CNPJ', 'RG', 'Status', 'Data', 'Obs',
    'Nº', 'Número', 'Bairro', 'Cidade', 'Estado', 'UF', 'Complemento'
  ];
  
  // Helper to extract value based on labels
  // Supports:
  // 1. "Label: Value" (same line)
  // 2. "Label \n Value" (next line)
  const getValue = (labels: string[]): string | undefined => {
    // Create regex to match start of line with label
    // e.g. ^(Nome|Cliente)
    const labelRegex = new RegExp(`^(?:${labels.join('|')})`, 'i');
    const keywordCheckRegex = new RegExp(`^(?:${allKeywords.join('|')})`, 'i');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (labelRegex.test(line)) {
        // Found a line starting with one of the labels
        // Try to get value from SAME line
        let content = line.replace(labelRegex, '').trim();
        // Remove separators at start (: - . , ;)
        content = content.replace(/^[:\-\.,;]+/, '').trim();
        // Remove trailing comma
        content = content.replace(/,$/, '').trim();

        if (content.length > 0) {
            return content;
        }

        // If line is empty (just label), check NEXT line
        if (i + 1 < lines.length) {
            let nextLine = lines[i+1];
            // Safety: Ensure next line isn't another keyword
            if (!keywordCheckRegex.test(nextLine)) {
               return nextLine.replace(/,$/, '').trim();
            }
        }
      }
    }
    return undefined;
  };

  // --- NAME ---
  result.name = getValue(['Nome', 'Cliente', 'Responsável']);
  
  // Fallback Name: If not found by label, scan first few lines
  if (!result.name) {
    for (const l of lines) {
      // Heuristics to skip non-name lines
      if (l.match(/\d{5,}/)) continue; // skip lines with long numbers
      if (l.length > 50) continue;
      if (l.toLowerCase().includes('cpf')) continue;
      if (l.toLowerCase().includes('telefone')) continue;
      if (l.toLowerCase().includes('endereço')) continue;
      if (l.includes(':')) continue;
      
      // If line is mostly text, assume it's the name (common in CSV first columns)
      result.name = l.replace(/,$/, '');
      break;
    }
  }

  // --- PLATE ---
  const plateMatch = cleanedText.match(/\b([A-Z]{3}-?[0-9][A-Z0-9][0-9]{2})\b/i);
  if (plateMatch) result.plate = plateMatch[1].toUpperCase().replace('-', '');

  // --- VEHICLE & COLOR ---
  const v = getValue(['Veículo', 'Carro', 'Moto', 'Modelo', 'Marca']);
  const c = getValue(['Cor']);
  
  if (v) {
    result.vehicle = v + (c ? ` - ${c}` : '');
  } else if (c) {
    result.vehicle = c; // If only color is found, put it in vehicle field
  }

  // --- ADDRESS ---
  const addr = getValue(['Endereço', 'End', 'Local', 'Logradouro', 'Rua', 'Av', 'Avenida']);
  const num = getValue(['Nº', 'Número']);
  const district = getValue(['Bairro']);
  const city = getValue(['Cidade']);
  const comp = getValue(['Complemento']);
  
  const addrParts = [];
  if (addr) addrParts.push(addr);
  if (num) addrParts.push(`Nº ${num}`);
  if (comp) addrParts.push(comp);
  if (district) addrParts.push(district);
  if (city) addrParts.push(city);
  
  if (addrParts.length > 0) {
    result.address = addrParts.join(', ');
  } else {
    // Implicit address fallback (comma separated usually)
    const streetMatch = cleanedText.match(/(?:Rua|Av\.|Avenida|Alameda|Travessa|Rodovia|Estrada)[\s\w]+,[^,\n]+/i);
    if (streetMatch) result.address = streetMatch[0].trim();
  }

  // --- TRACKER MODEL ---
  const trackerModel = getValue(['Modelo Rastreador', 'Modelo Equipamento']);
  if (trackerModel) result.trackerModel = trackerModel;

  return result;
};

export const formatPhone = (phone: string) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

export const formatPlate = (plate: string) => {
  if (!plate) return '';
  const p = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (p.length === 7) {
    return `${p.slice(0, 3)}-${p.slice(3)}`;
  }
  return plate;
};
