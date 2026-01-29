import { useState, useMemo, useEffect } from 'react';
import { Misconfiguration, FilterState, Resolver } from '../types';
import { MOCK_DATA } from '../utils/mockData';
import { calculateSLADeadline, isTicketOverdue } from '../utils/sla';
import { supabase } from '../lib/supabase';

export function useMisconfigurations() {
  const [data, setData] = useState<Misconfiguration[]>(MOCK_DATA);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    severity: [],
    provider: [],
    status: [],
    resolver: ''
  });
  const [resolvers, setResolvers] = useState<Resolver[]>([]);

  // Carregar resolvedores do Supabase na inicialização
  useEffect(() => {
    const loadResolvers = async () => {
      try {
        const { data: resolversData, error } = await supabase
          .from('Resolvedores')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.error('Erro ao carregar resolvedores do Supabase:', error);
          return;
        }

        if (resolversData) {
          const mappedResolvers: Resolver[] = resolversData.map((r: any) => ({
            name: r.name,
            email: r.email,
          }));
          setResolvers(mappedResolvers);
        }
      } catch (error) {
        console.error('Erro ao carregar resolvedores:', error);
      }
    };

    loadResolvers();
  }, []);

  // Validar resolvedores dos tickets - garantir que nenhum ticket tenha um resolvedor que não existe mais
  useEffect(() => {
    if (resolvers.length === 0) return; // Aguardar até que os resolvedores sejam carregados
    
    setData(prev => {
      let hasChanges = false;
      const updated = prev.map(ticket => {
        if (ticket.resolver) {
          // Verificar se o resolvedor ainda existe na lista de resolvedores
          const resolverExists = resolvers.some(r => r.email === ticket.resolver?.email);
          if (!resolverExists) {
            // Se o resolvedor não existe mais, remover do ticket
            hasChanges = true;
            return {
              ...ticket,
              resolver: null
            };
          }
        }
        return ticket;
      });
      // Só atualizar se houver mudanças para evitar renderizações desnecessárias
      return hasChanges ? updated : prev;
    });
  }, [resolvers]);

  // Verificar e atualizar tickets vencidos automaticamente (baseado em CVSS)
  useEffect(() => {
    const checkOverdueTickets = () => {
      const now = new Date();
      setData(prev => prev.map(ticket => {
        // Apenas atualizar tickets que não estão resolvidos e estão vencidos
        if (ticket.status !== 'Resolved' && isTicketOverdue(ticket.slaDeadline, now)) {
          return {
            ...ticket,
            status: 'Overdue' as const
          };
        }
        return ticket;
      }));
    };

    // Verificar imediatamente
    checkOverdueTickets();

    // Verificar a cada minuto para garantir que tickets sejam marcados como vencidos em tempo real
    const interval = setInterval(checkOverdueTickets, 60000); // 60 segundos

    return () => clearInterval(interval);
  }, []);

  // Função para recarregar resolvedores do Supabase
  const reloadResolvers = async () => {
    try {
      const { data: resolversData, error } = await supabase
        .from('Resolvedores')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Erro ao recarregar resolvedores do Supabase:', error);
        return;
      }

      if (resolversData) {
        const mappedResolvers: Resolver[] = resolversData.map((r: any) => ({
          name: r.name,
          email: r.email,
        }));
        setResolvers(mappedResolvers);
      }
    } catch (error) {
      console.error('Erro ao recarregar resolvedores:', error);
    }
  };
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = item.resource.toLowerCase().includes(searchLower) || item.description.toLowerCase().includes(searchLower) || item.crowdstrikeId.toLowerCase().includes(searchLower) || item.id.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      if (filters.severity.length > 0 && !filters.severity.includes(item.severity)) {
        return false;
      }
      if (filters.provider.length > 0 && !filters.provider.includes(item.provider)) {
        return false;
      }
      if (filters.status.length > 0 && !filters.status.includes(item.status)) {
        return false;
      }
      if (filters.resolver) {
        if (filters.resolver === 'Unassigned') {
          if (item.resolver !== null) return false;
        } else {
          if (!item.resolver?.name.toLowerCase().includes(filters.resolver.toLowerCase()) && !item.resolver?.email.toLowerCase().includes(filters.resolver.toLowerCase())) return false;
        }
      }
      return true;
    });
  }, [data, filters]);
  const assignResolver = (id: string, resolver: Resolver) => {
    setData(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          resolver,
          status: item.status === 'Open' ? 'In Progress' : item.status
        };
      }
      return item;
    }));
  };
  const updateTicket = (id: string, updates: Partial<Misconfiguration>) => {
    setData(prev => prev.map(item => item.id === id ? {
      ...item,
      ...updates
    } : item));
  };
  const createTicket = (ticket: Omit<Misconfiguration, 'id' | 'detectedAt' | 'crowdstrikeId' | 'slaDeadline'>) => {
    const detectedAt = new Date();
    const newTicket: Misconfiguration = {
      ...ticket,
      id: `MC-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      detectedAt,
      crowdstrikeId: `CS-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000)}`,
      // Calculate SLA deadline based on severity and CVSS standards
      slaDeadline: calculateSLADeadline(ticket.severity, detectedAt)
    };
    setData(prev => [newTicket, ...prev]);
  };
  const importTickets = (tickets: Misconfiguration[]) => {
    setData(prev => [...tickets, ...prev]);
  };
  const addResolver = async (resolver: Resolver) => {
    try {
      // Verificar se já existe um resolvedor com o mesmo email
      const existingResolver = resolvers.find(r => r.email.toLowerCase() === resolver.email.toLowerCase());
      if (existingResolver) {
        console.warn('Resolver com este email já existe:', resolver.email);
        return;
      }

      const { error } = await supabase
        .from('Resolvedores')
        .insert([{ name: resolver.name, email: resolver.email }]);

      if (error) {
        console.error('Erro ao adicionar resolvedor no Supabase:', error);
        return;
      }

      // Recarregar resolvedores do Supabase
      await reloadResolvers();
    } catch (error) {
      console.error('Erro ao adicionar resolvedor:', error);
    }
  };
  
  const removeResolver = async (email: string) => {
    try {
      const { error } = await supabase
        .from('Resolvedores')
        .delete()
        .eq('email', email);

      if (error) {
        console.error('Erro ao remover resolvedor do Supabase:', error);
        return;
      }

      // Recarregar resolvedores do Supabase
      await reloadResolvers();

      // Remove resolver from all tickets
      setData(prev => prev.map(item => item.resolver?.email === email ? {
        ...item,
        resolver: null
      } : item));
    } catch (error) {
      console.error('Erro ao remover resolvedor:', error);
    }
  };

  const removeAllResolvers = async () => {
    try {
      // Buscar todos os emails dos resolvedores
      const emails = resolvers.map(r => r.email);

      if (emails.length === 0) return;

      // Deletar todos os resolvedores
      const { error } = await supabase
        .from('Resolvedores')
        .delete()
        .in('email', emails);

      if (error) {
        console.error('Erro ao remover todos os resolvedores do Supabase:', error);
        return;
      }

      // Recarregar resolvedores do Supabase
      await reloadResolvers();

      // Remover todos os resolvedores de todos os tickets
      setData(prev => prev.map(item => ({
        ...item,
        resolver: null
      })));
    } catch (error) {
      console.error('Erro ao remover todos os resolvedores:', error);
    }
  };

  const updateResolver = async (oldEmail: string, updatedResolver: Resolver) => {
    try {
      // Verificar se o novo email já existe em outro resolvedor
      if (oldEmail !== updatedResolver.email) {
        const existingResolver = resolvers.find(r => r.email.toLowerCase() === updatedResolver.email.toLowerCase() && r.email !== oldEmail);
        if (existingResolver) {
          console.warn('Resolver com este email já existe:', updatedResolver.email);
          return;
        }
      }

      const { error } = await supabase
        .from('Resolvedores')
        .update({ name: updatedResolver.name, email: updatedResolver.email })
        .eq('email', oldEmail);

      if (error) {
        console.error('Erro ao atualizar resolvedor no Supabase:', error);
        return;
      }

      // Recarregar resolvedores do Supabase
      await reloadResolvers();

      // Atualizar resolver em todos os tickets que o usam
      setData(prev => prev.map(item => item.resolver?.email === oldEmail ? {
        ...item,
        resolver: updatedResolver
      } : item));
    } catch (error) {
      console.error('Erro ao atualizar resolvedor:', error);
    }
  };
  const deleteTicket = (id: string) => {
    setData(prev => prev.filter(item => item.id !== id));
  };

  const deleteAllTickets = () => {
    setData([]);
  };
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  const clearFilters = () => {
    setFilters({
      search: '',
      severity: [],
      provider: [],
      status: [],
      resolver: ''
    });
  };
  return {
    data: filteredData,
    allData: data,
    filters,
    resolvers,
    updateFilter,
    clearFilters,
    assignResolver,
    updateTicket,
    createTicket,
    importTickets,
    addResolver,
    removeResolver,
    removeAllResolvers,
    updateResolver,
    deleteTicket,
    deleteAllTickets
  };
}