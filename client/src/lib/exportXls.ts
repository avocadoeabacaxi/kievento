import * as XLSX from 'xlsx';

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExportOptions {
  filename: string;
  sheetName?: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  title?: string;
  subtitle?: string;
}

/**
 * Exporta dados para arquivo XLS com formatação profissional
 */
export function exportToXls(options: ExportOptions): void {
  const { filename, sheetName = 'Dados', columns, data, title, subtitle } = options;

  // Criar workbook
  const wb = XLSX.utils.book_new();

  // Preparar dados para a planilha
  const wsData: any[][] = [];
  let startRow = 0;

  // Adicionar título se fornecido
  if (title) {
    wsData.push([title]);
    startRow++;
  }

  // Adicionar subtítulo se fornecido
  if (subtitle) {
    wsData.push([subtitle]);
    startRow++;
  }

  // Adicionar linha em branco após título/subtítulo
  if (title || subtitle) {
    wsData.push([]);
    startRow++;
  }

  // Adicionar cabeçalhos
  const headers = columns.map(col => col.header);
  wsData.push(headers);

  // Adicionar dados
  data.forEach(row => {
    const rowData = columns.map(col => {
      const value = row[col.key];
      
      // Formatar datas
      if (value instanceof Date) {
        return value.toLocaleString('pt-BR');
      }
      
      // Formatar timestamps
      if (col.key.toLowerCase().includes('at') && typeof value === 'number') {
        return new Date(value).toLocaleString('pt-BR');
      }
      
      // Formatar valores nulos/undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      return value;
    });
    wsData.push(rowData);
  });

  // Criar worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Configurar larguras das colunas
  const colWidths: XLSX.ColInfo[] = columns.map((col) => {
    // Calcular largura baseada no conteúdo
    let maxWidth = col.header.length;
    
    data.forEach(row => {
      const value = row[col.key];
      const strValue = value ? String(value) : '';
      if (strValue.length > maxWidth) {
        maxWidth = strValue.length;
      }
    });

    // Usar largura definida ou calculada (mínimo 10, máximo 50)
    const width = col.width || Math.min(Math.max(maxWidth + 2, 10), 50);
    
    return { wch: width };
  });

  ws['!cols'] = colWidths;

  // Mesclar células do título se existir
  if (title) {
    ws['!merges'] = ws['!merges'] || [];
    ws['!merges'].push({
      s: { r: 0, c: 0 },
      e: { r: 0, c: columns.length - 1 }
    });
  }

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Gerar arquivo e fazer download
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Extrai todos os campos únicos do formData de todos os participantes
 * Ignora campos que terminam com _condicional (são campos auxiliares)
 */
function extractFormDataFields(data: any[]): string[] {
  const fieldsSet = new Set<string>();
  
  data.forEach(item => {
    if (item.formData) {
      try {
        const formData = typeof item.formData === 'string' ? JSON.parse(item.formData) : item.formData;
        Object.keys(formData).forEach(key => {
          // Ignorar campos auxiliares (_condicional) e campos já cobertos (Nome Completo, E-mail, Telefone)
          if (!key.endsWith('_condicional')) {
            fieldsSet.add(key);
          }
        });
      } catch (e) {
        // Ignorar formData inválido
      }
    }
  });
  
  return Array.from(fieldsSet);
}

/**
 * Extrai valor de um campo do formData
 */
function getFormDataValue(item: any, fieldName: string): string {
  if (!item.formData) return '';
  try {
    const formData = typeof item.formData === 'string' ? JSON.parse(item.formData) : item.formData;
    return formData[fieldName] || '';
  } catch (e) {
    return '';
  }
}

/**
 * Exporta histórico de check-ins para XLS
 */
export function exportCheckInHistory(
  data: any[],
  eventTitle: string
): void {
  exportToXls({
    filename: `historico-checkins-${eventTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
    sheetName: 'Check-ins',
    title: `Histórico de Check-ins - ${eventTitle}`,
    subtitle: `Exportado em ${new Date().toLocaleString('pt-BR')} | Total: ${data.length} check-ins`,
    columns: [
      { header: 'Nome', key: 'name', width: 30 },
      { header: 'E-mail', key: 'email', width: 35 },
      { header: 'Telefone', key: 'phone', width: 18 },
      { header: 'Data/Hora Check-in', key: 'checkedInAt', width: 22 },
      { header: 'Operador', key: 'operatorName', width: 25 }
    ],
    data: data.map(item => ({
      name: item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      checkedInAt: item.checkedInAt ? new Date(item.checkedInAt).toLocaleString('pt-BR') : '',
      operatorName: item.operatorName || 'Sistema'
    }))
  });
}

/**
 * Exporta lista de participantes para XLS com TODOS os dados do cadastro
 * Inclui campos fixos + todos os campos dinâmicos do formData
 */
export function exportParticipants(
  data: any[],
  eventTitle: string,
  status: 'approved' | 'pending' | 'all'
): void {
  const statusLabel = status === 'approved' ? 'Aprovados' : status === 'pending' ? 'Pendentes' : 'Todos';
  
  // Extrair todos os campos únicos do formData de todos os participantes
  const formDataFields = extractFormDataFields(data);
  
  // Campos fixos que já existem como colunas separadas
  const fixedFieldNames = ['Nome Completo', 'E-mail', 'Telefone', 'nome completo', 'e-mail', 'telefone', 'email', 'nome', 'phone', 'name'];
  
  // Filtrar campos do formData que não são duplicatas dos campos fixos
  const extraFields = formDataFields.filter(field => {
    const lower = field.toLowerCase();
    return !fixedFieldNames.some(f => f.toLowerCase() === lower);
  });
  
  // Montar colunas: fixas + dinâmicas do formData
  const columns: ExportColumn[] = [
    { header: 'Nome', key: 'name', width: 35 },
    { header: 'E-mail', key: 'email', width: 35 },
    { header: 'Telefone', key: 'phone', width: 20 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Check-in', key: 'checkedIn', width: 12 },
    { header: 'Data Inscrição', key: 'createdAt', width: 22 },
  ];
  
  // Adicionar colunas dinâmicas do formData
  extraFields.forEach(field => {
    columns.push({
      header: field,
      key: `formData_${field}`,
      width: Math.min(Math.max(field.length + 5, 15), 40)
    });
  });
  
  // Montar dados com todos os campos
  const exportData = data.map(item => {
    const row: Record<string, any> = {
      name: item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      status: item.status === 'approved' ? 'Aprovado' : item.status === 'pending' ? 'Pendente' : item.status === 'rejected' ? 'Rejeitado' : item.status,
      checkedIn: item.checkedIn ? 'Sim' : 'Não',
      createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : ''
    };
    
    // Adicionar todos os campos do formData
    extraFields.forEach(field => {
      row[`formData_${field}`] = getFormDataValue(item, field);
    });
    
    return row;
  });
  
  exportToXls({
    filename: `participantes-${statusLabel.toLowerCase()}-${eventTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
    sheetName: 'Participantes',
    title: `Lista de Participantes ${statusLabel} - ${eventTitle}`,
    subtitle: `Exportado em ${new Date().toLocaleString('pt-BR')} | Total: ${data.length} participantes`,
    columns,
    data: exportData
  });
}
