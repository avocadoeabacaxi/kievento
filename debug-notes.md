# Debug: Contador de Reenvios

## Problema
O contador de reenvios não está aparecendo no botão "Reenviar"

## Análise
1. O código em EventDetails.tsx está correto - usa `(reg as any).emailSentCount`
2. O schema em drizzle/schema.ts tem o campo `emailSentCount` definido
3. A query `getRegistrationsByEventId` retorna todos os campos da tabela

## Possível causa
O campo `emailSentCount` pode não estar sendo retornado corretamente pelo Drizzle porque:
- O schema pode não estar sincronizado com o banco
- O campo pode ter valor NULL ao invés de 0

## Solução
1. Verificar se os dados existem no banco
2. Garantir que o campo tem valor default 0
3. Atualizar registros existentes para ter emailSentCount = 0
