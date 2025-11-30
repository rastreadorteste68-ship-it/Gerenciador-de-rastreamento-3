
export enum ClientStatus {
  TODO = 'Fazer',
  SCHEDULED = 'Agendado',
  DONE = 'Retirado',
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  vehicle: string;
  plate: string;
  trackerNumber: string;
  trackerModel?: string; // New field
  observations: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  status: ClientStatus;
  createdAt: number;
  cpf?: string; 
}

export interface Template {
  id: string;
  name: string;
  content: string;
}

export const INITIAL_TEMPLATES: Template[] = [
  {
    id: 't1',
    name: 'Agendamento',
    content: 'Olá {name}, confirmamos o agendamento da instalação do rastreador no veículo {vehicle} ({plate}) para o dia {date} às {time}. Endereço: {address}.',
  },
  {
    id: 't2',
    name: 'Cobrança',
    content: 'Olá {name}, gostaríamos de lembrar sobre a mensalidade do rastreador do veículo {vehicle} referente a este mês. Segue o PIX para pagamento.',
  },
  {
    id: 't3',
    name: 'Manutenção',
    content: 'Olá {name}, precisamos agendar uma breve manutenção no rastreador do veículo {plate} para garantir o funcionamento correto. Qual sua disponibilidade?',
  },
  {
    id: 't4',
    name: 'Boas-vindas',
    content: 'Olá {name}, seja bem-vindo(a)! O rastreador do veículo {vehicle} já está ativo. Baixe nosso aplicativo para monitorar em tempo real.',
  },
  {
    id: 't5',
    name: 'Instalação Concluída',
    content: 'Olá {name}, a instalação no veículo {vehicle} foi finalizada com sucesso! Segue seu login e senha de acesso.',
  },
  {
    id: 't6',
    name: 'Sem Sinal (Alerta)',
    content: 'Olá {name}, notamos que seu veículo {vehicle} parou de reportar sinal recentemente. Poderia verificar se a bateria do veículo foi desconectada?',
  }
];
