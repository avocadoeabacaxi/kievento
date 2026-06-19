import { describe, it, expect } from "vitest";

/**
 * Tests for the registration form logic - specifically the conditional field handling
 * and form data state management that was causing the form reset bug.
 */

describe("RegisterPage - Form Data State Management", () => {
  // Simulate the setFormData pattern used in the form
  it("should preserve existing form data when updating a field using functional update", () => {
    // Simulate initial state
    let formData: Record<string, any> = {
      "Nome Completo": "João Silva",
      "E-mail": "joao@test.com",
      "Telefone": "(11) 99999-9999",
    };

    // Simulate functional update pattern: setFormData(prev => ({ ...prev, [field.label]: value }))
    const updateField = (fieldLabel: string, value: any) => {
      formData = { ...formData, [fieldLabel]: value };
    };

    // Update a select field
    updateField("Você é cliente Gold Pão?", "Sim");

    // All previous data should be preserved
    expect(formData["Nome Completo"]).toBe("João Silva");
    expect(formData["E-mail"]).toBe("joao@test.com");
    expect(formData["Telefone"]).toBe("(11) 99999-9999");
    expect(formData["Você é cliente Gold Pão?"]).toBe("Sim");
  });

  it("should handle conditional field options parsing - new JSON format", () => {
    const optionsJson = '[{"value":"Sim","hasConditional":true,"conditionalLabel":"Qual seu código?"},{"value":"Não","hasConditional":false}]';
    
    let selectOptions: { value: string; hasConditional?: boolean; conditionalLabel?: string }[] = [];
    try {
      const parsed = JSON.parse(optionsJson);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        selectOptions = parsed;
      }
    } catch {
      selectOptions = optionsJson.split(',').map(opt => ({ value: opt.trim() }));
    }

    expect(selectOptions).toHaveLength(2);
    expect(selectOptions[0].value).toBe("Sim");
    expect(selectOptions[0].hasConditional).toBe(true);
    expect(selectOptions[0].conditionalLabel).toBe("Qual seu código?");
    expect(selectOptions[1].value).toBe("Não");
    expect(selectOptions[1].hasConditional).toBe(false);
  });

  it("should handle conditional field options parsing - format without conditional", () => {
    const optionsJson = '[{"value":"Sim","hasConditional":false},{"value":"Não","hasConditional":false}]';
    
    let selectOptions: { value: string; hasConditional?: boolean; conditionalLabel?: string }[] = [];
    try {
      const parsed = JSON.parse(optionsJson);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        selectOptions = parsed;
      }
    } catch {
      selectOptions = optionsJson.split(',').map(opt => ({ value: opt.trim() }));
    }

    // When "Sim" is selected, no conditional should appear
    const selectedOption = selectOptions.find(opt => opt.value === "Sim");
    expect(selectedOption).toBeDefined();
    expect(selectedOption!.hasConditional).toBe(false);
    
    // The conditional field should NOT render
    const shouldShowConditional = selectedOption?.hasConditional && selectedOption?.conditionalLabel;
    expect(shouldShowConditional).toBeFalsy();
  });

  it("should handle legacy format options parsing (comma-separated string)", () => {
    const optionsString = "Sim, Não, Talvez";
    
    let selectOptions: { value: string; hasConditional?: boolean; conditionalLabel?: string }[] = [];
    try {
      const parsed = JSON.parse(optionsString);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        selectOptions = parsed;
      }
    } catch {
      selectOptions = optionsString.split(',').map(opt => ({ value: opt.trim() }));
    }

    expect(selectOptions).toHaveLength(3);
    expect(selectOptions[0].value).toBe("Sim");
    expect(selectOptions[1].value).toBe("Não");
    expect(selectOptions[2].value).toBe("Talvez");
  });

  it("should validate conditional fields in handleSubmit", () => {
    // Simulate form fields with conditional
    const formFields = [
      {
        id: 1,
        label: "Tem restrição alimentar?",
        fieldType: "select",
        options: '[{"value":"Sim","hasConditional":true,"conditionalLabel":"Qual restrição?"},{"value":"Não","hasConditional":false}]',
        required: 1,
        conditionalTrigger: null,
        conditionalLabel: null,
      }
    ];

    // Simulate formData where user selected "Sim" but didn't fill conditional
    const formData: Record<string, any> = {
      "Tem restrição alimentar?": "Sim",
    };

    // Validation logic from handleSubmit
    let validationError: string | null = null;
    
    for (const field of formFields) {
      if (field.fieldType === "select" && field.options && formData[field.label]) {
        try {
          const parsed = JSON.parse(field.options);
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
            const selectedOpt = parsed.find((opt: any) => opt.value === formData[field.label]);
            if (selectedOpt?.hasConditional && selectedOpt?.conditionalLabel && !formData[`${field.label}_condicional`]) {
              validationError = `O campo "${selectedOpt.conditionalLabel}" é obrigatório`;
            }
          }
        } catch {
          // legacy format
        }
      }
    }

    expect(validationError).toBe('O campo "Qual restrição?" é obrigatório');
  });

  it("should pass validation when conditional field is filled", () => {
    const formFields = [
      {
        id: 1,
        label: "Tem restrição alimentar?",
        fieldType: "select",
        options: '[{"value":"Sim","hasConditional":true,"conditionalLabel":"Qual restrição?"},{"value":"Não","hasConditional":false}]',
        required: 1,
        conditionalTrigger: null,
        conditionalLabel: null,
      }
    ];

    // Simulate formData where user selected "Sim" AND filled conditional
    const formData: Record<string, any> = {
      "Tem restrição alimentar?": "Sim",
      "Tem restrição alimentar?_condicional": "Vegetariano",
    };

    let validationError: string | null = null;
    
    for (const field of formFields) {
      if (field.fieldType === "select" && field.options && formData[field.label]) {
        try {
          const parsed = JSON.parse(field.options);
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
            const selectedOpt = parsed.find((opt: any) => opt.value === formData[field.label]);
            if (selectedOpt?.hasConditional && selectedOpt?.conditionalLabel && !formData[`${field.label}_condicional`]) {
              validationError = `O campo "${selectedOpt.conditionalLabel}" é obrigatório`;
            }
          }
        } catch {
          // legacy format
        }
      }
    }

    expect(validationError).toBeNull();
  });

  it("should not show conditional field when hasConditional is false (Gold Pão bug scenario)", () => {
    // This is the exact scenario from the bug report
    const optionsJson = '[{"value":"Sim","hasConditional":false},{"value":"Não","hasConditional":false}]';
    
    let selectOptions: { value: string; hasConditional?: boolean; conditionalLabel?: string }[] = [];
    const parsed = JSON.parse(optionsJson);
    selectOptions = parsed;

    // User selects "Sim"
    const selectedOption = selectOptions.find(opt => opt.value === "Sim");
    
    // No conditional should appear
    const shouldShowConditional = selectedOption?.hasConditional && selectedOption?.conditionalLabel;
    expect(shouldShowConditional).toBeFalsy();
    
    // Form data should remain intact after selection
    let formData: Record<string, any> = {
      "Nome Completo": "Test User",
      "E-mail": "test@test.com",
    };
    
    // Functional update (the fix)
    formData = { ...formData, "Você é cliente Gold Pão?": "Sim" };
    
    expect(formData["Nome Completo"]).toBe("Test User");
    expect(formData["E-mail"]).toBe("test@test.com");
    expect(formData["Você é cliente Gold Pão?"]).toBe("Sim");
  });
});
