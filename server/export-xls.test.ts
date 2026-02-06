import { describe, it, expect } from 'vitest';

// Testar a lógica de extração de campos do formData
describe('Export XLS - FormData Field Extraction', () => {
  
  function extractFormDataFields(data: any[]): string[] {
    const fieldsSet = new Set<string>();
    data.forEach(item => {
      if (item.formData) {
        try {
          const formData = typeof item.formData === 'string' ? JSON.parse(item.formData) : item.formData;
          Object.keys(formData).forEach(key => {
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

  function getFormDataValue(item: any, fieldName: string): string {
    if (!item.formData) return '';
    try {
      const formData = typeof item.formData === 'string' ? JSON.parse(item.formData) : item.formData;
      return formData[fieldName] || '';
    } catch (e) {
      return '';
    }
  }

  it('deve extrair todos os campos únicos do formData', () => {
    const data = [
      { formData: '{"Nome Completo":"João","CNPJ":"123","Empresa":"Teste"}' },
      { formData: '{"Nome Completo":"Maria","CNPJ":"456","Cargo":"Gerente"}' },
    ];
    const fields = extractFormDataFields(data);
    expect(fields).toContain('Nome Completo');
    expect(fields).toContain('CNPJ');
    expect(fields).toContain('Empresa');
    expect(fields).toContain('Cargo');
    expect(fields.length).toBe(4);
  });

  it('deve ignorar campos que terminam com _condicional', () => {
    const data = [
      { formData: '{"Pergunta":"Sim","Pergunta_condicional":"valor auxiliar"}' },
    ];
    const fields = extractFormDataFields(data);
    expect(fields).toContain('Pergunta');
    expect(fields).not.toContain('Pergunta_condicional');
    expect(fields.length).toBe(1);
  });

  it('deve lidar com formData nulo ou vazio', () => {
    const data = [
      { formData: null },
      { formData: '' },
      { formData: '{}' },
      { name: 'Sem formData' },
    ];
    const fields = extractFormDataFields(data);
    expect(fields.length).toBe(0);
  });

  it('deve extrair valor correto de um campo do formData', () => {
    const item = { formData: '{"CNPJ":"12.345.678/0001-90","Empresa":"Avocado"}' };
    expect(getFormDataValue(item, 'CNPJ')).toBe('12.345.678/0001-90');
    expect(getFormDataValue(item, 'Empresa')).toBe('Avocado');
    expect(getFormDataValue(item, 'Inexistente')).toBe('');
  });

  it('deve retornar string vazia para formData inválido', () => {
    const item = { formData: 'invalid json' };
    expect(getFormDataValue(item, 'campo')).toBe('');
  });

  it('deve lidar com dados reais do evento Conversa de Padaria', () => {
    const data = [
      { formData: '{"Nome Completo":"Isadora","E-mail":"test@test.com","Telefone":"(16) 3515-6400","CNPJ":"21.833.283/0001-22","Você é cliente Gold Pão?":"Sim","Você trabalha com panificação congelada?":"Sim","Você trabalha com panificação congelada?_condicional":"gold pães"}' },
      { formData: '{"Nome Completo":"Maria","E-mail":"maria@test.com","Telefone":"(16) 99178-9306","Você é cliente Gold Pão?":"Sim","Você trabalha com panificação congelada?":"Sim","Você trabalha com panificação congelada?_condicional":"Gold pao","CNPJ":"39.522.604/0001-33"}' },
    ];
    const fields = extractFormDataFields(data);
    
    // Deve ter os campos corretos
    expect(fields).toContain('Nome Completo');
    expect(fields).toContain('E-mail');
    expect(fields).toContain('Telefone');
    expect(fields).toContain('CNPJ');
    expect(fields).toContain('Você é cliente Gold Pão?');
    expect(fields).toContain('Você trabalha com panificação congelada?');
    
    // Não deve ter campos condicionais
    expect(fields).not.toContain('Você trabalha com panificação congelada?_condicional');
  });
});
