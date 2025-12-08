import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from 'nanoid';
import { sendEmail, getApprovalEmailTemplate, getRejectionEmailTemplate, getConfirmationEmailTemplate } from './emailService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ENV } from './_core/env';
import { storagePut } from "./storage";
import * as db from "./db";
import { generateUniqueSlug } from "./slugUtils";

// Middleware para verificar se o usuário é admin
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  events: router({
    // Criar evento
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        eventDate: z.string(),
        registrationDeadline: z.string().optional(),
        address: z.string().optional(),
        registrationType: z.enum(['open', 'approval']),
        category: z.string().optional(),
        city: z.string().optional(),
        visibility: z.enum(["public", "private"]).optional(),
        status: z.enum(["draft", "published"]).optional(),
        bannerBase64: z.string().optional(),
        cardImageBase64: z.string().optional(),
        faq: z.string().optional(), // JSON string
        formFields: z.array(z.object({
          label: z.string(),
          fieldType: z.enum(['text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'cpf', 'cnpj', 'cep']),
          options: z.string().optional(),
          required: z.boolean(),
          order: z.number(),
        })).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let bannerUrl: string | undefined;
        let bannerKey: string | undefined;

        // Upload do banner se fornecido
        if (input.bannerBase64) {
          const base64Data = input.bannerBase64.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const key = `events/${ctx.user.id}/${nanoid()}.jpg`;
          const result = await storagePut(key, buffer, 'image/jpeg');
          bannerUrl = result.url;
          bannerKey = key;
        }

        let cardImageUrl: string | undefined;
        let cardImageKey: string | undefined;

        // Upload da imagem do card se fornecida
        if (input.cardImageBase64) {
          const base64Data = input.cardImageBase64.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const key = `events/${ctx.user.id}/${nanoid()}-card.jpg`;
          const result = await storagePut(key, buffer, 'image/jpeg');
          cardImageUrl = result.url;
          cardImageKey = key;
        }

        // Gerar slug único a partir do título
        const slug = await generateUniqueSlug(input.title);

        const eventId = await db.createEvent({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          eventDate: new Date(input.eventDate),
          registrationDeadline: input.registrationDeadline ? new Date(input.registrationDeadline) : undefined,
          address: input.address,
          bannerUrl,
          bannerKey,
          cardImageUrl,
          cardImageKey,
          registrationType: input.registrationType,
          category: input.category,
          city: input.city,
          visibility: input.visibility,
          status: input.status || 'draft',
          slug,
          faq: input.faq,
        });

        // Criar campos do formulário
        if (input.formFields && input.formFields.length > 0) {
          for (const field of input.formFields) {
            await db.createFormField({
              eventId: Number(eventId),
              label: field.label,
              fieldType: field.fieldType,
              options: field.options,
              required: field.required ? 1 : 0,
              order: field.order,
            });
          }
        }

        return { eventId };
      }),

    // Listar eventos do usuário
    myEvents: protectedProcedure.query(async ({ ctx }) => {
      const events = await db.getEventsByUserId(ctx.user.id);
      const eventsWithStats = await Promise.all(
        events.map(async (event) => {
          const stats = await db.getEventStats(event.id);
          return { ...event, stats };
        })
      );
      return eventsWithStats;
    }),

    // Listar todos os eventos (admin)
    allEvents: adminProcedure.query(async () => {
      const events = await db.getAllEvents();
      const eventsWithStats = await Promise.all(
        events.map(async (event) => {
          const stats = await db.getEventStats(event.id);
          return { ...event, stats };
        })
      );
      return eventsWithStats;
    }),

    // Obter detalhes do evento (público)
    getById: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }
        const formFields = await db.getFormFieldsByEventId(input.eventId);
        return { ...event, formFields };
      }),

    // Obter detalhes do evento por slug (público)
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const event = await db.getEventBySlug(input.slug);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }
        const formFields = await db.getFormFieldsByEventId(event.id);
        return { ...event, formFields };
      }),

    // Atualizar evento
    update: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        eventDate: z.string().optional(),
        registrationDeadline: z.string().optional(),
        address: z.string().optional(),
        registrationType: z.enum(['open', 'approval']).optional(),
        status: z.enum(['draft', 'published']).optional(),
        bannerBase64: z.string().optional(),
        cardImageBase64: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }
        if (event.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        const updateData: any = {};
        if (input.title) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.eventDate) updateData.eventDate = new Date(input.eventDate);
        if (input.registrationDeadline !== undefined) {
          updateData.registrationDeadline = input.registrationDeadline ? new Date(input.registrationDeadline) : null;
        }
        if (input.address !== undefined) updateData.address = input.address;
        if (input.registrationType) updateData.registrationType = input.registrationType;
        if (input.status) updateData.status = input.status;

        if (input.bannerBase64) {
          const base64Data = input.bannerBase64.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const key = `events/${ctx.user.id}/${nanoid()}.jpg`;
          const result = await storagePut(key, buffer, 'image/jpeg');
          updateData.bannerUrl = result.url;
          updateData.bannerKey = key;
        }

        await db.updateEvent(input.eventId, updateData);
        return { success: true };
      }),

    // Deletar evento
    delete: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }
        if (event.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        await db.deleteEvent(input.eventId);
        return { success: true };
      }),

    // Obter estatísticas do evento
     getStats: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEventStats(input.eventId);
      }),

    deleteEvent: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se o evento pertence ao usuário
        const event = await db.getEventById(input.eventId);
        if (!event || (event.userId !== ctx.user.id && ctx.user.role !== 'admin')) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Você não tem permissão para excluir este evento' });
        }

        await db.deleteEvent(input.eventId);
        return { success: true };
      }),
  }),

  registrations: router({
    // Criar inscrição (público)
    create: publicProcedure
      .input(z.object({
        eventId: z.number(),
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        formData: z.string(), // JSON stringified
        ticketTypeId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }

        const qrCode = nanoid(16);
        const status = event.registrationType === 'open' ? 'approved' : 'pending';

        const registrationId = await db.createRegistration({
          eventId: input.eventId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          formData: input.formData,
          ticketTypeId: input.ticketTypeId,
          status,
          qrCode,
        });

        // Incrementar contador de vendas do lote
        if (input.ticketTypeId && status === 'approved') {
          await db.incrementTicketTypeSold(input.ticketTypeId);
        }

        // Enviar e-mail de confirmação para eventos abertos
        if (status === 'approved') {
          const baseUrl = ENV.isProduction ? `https://${ENV.appId}.manus.space` : 'http://localhost:3000';
          const ticketUrl = `${baseUrl}/ticket/${qrCode}`;
          const eventDate = format(new Date(event.eventDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
          const [address] = event.address?.split('|') || [];

          await sendEmail({
            to: input.email,
            subject: `✅ Inscrição confirmada - ${event.title}`,
            html: getConfirmationEmailTemplate({
              participantName: input.name,
              eventTitle: event.title,
              eventDate,
              eventAddress: address,
              ticketUrl,
            }),
          });
        }

        return { registrationId, qrCode, status };
      }),

    // Listar inscrições de um evento
    listByEvent: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ ctx, input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }
        if (event.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        return db.getRegistrationsByEventId(input.eventId);
      }),

    // Listar todas as inscrições (admin)
    allRegistrations: adminProcedure.query(async () => {
      return db.getAllRegistrations();
    }),

    // Aprovar/rejeitar inscrição
    updateStatus: protectedProcedure
      .input(z.object({
        registrationId: z.number(),
        status: z.enum(['approved', 'rejected']),
      }))
      .mutation(async ({ ctx, input }) => {
        const registration = await db.getRegistrationById(input.registrationId);
        if (!registration) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Registration not found' });
        }

        const event = await db.getEventById(registration.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }

        if (event.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        await db.updateRegistration(input.registrationId, { status: input.status });

        // Enviar e-mail de notificação
        const baseUrl = ENV.isProduction ? `https://${ENV.appId}.manus.space` : 'http://localhost:3000';
        const ticketUrl = `${baseUrl}/ticket/${registration.qrCode}`;
        const eventDate = format(new Date(event.eventDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
        const [address] = event.address?.split('|') || [];

        if (input.status === 'approved') {
          await sendEmail({
            to: registration.email,
            subject: `🎉 Inscrição aprovada - ${event.title}`,
            html: getApprovalEmailTemplate({
              participantName: registration.name,
              eventTitle: event.title,
              eventDate,
              eventAddress: address,
              ticketUrl,
            }),
          });
        } else if (input.status === 'rejected') {
          await sendEmail({
            to: registration.email,
            subject: `Atualização sobre sua inscrição - ${event.title}`,
            html: getRejectionEmailTemplate({
              participantName: registration.name,
              eventTitle: event.title,
            }),
          });
        }

        return { success: true };
      }),

    // Buscar inscrição por nome
    searchByName: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        searchTerm: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }
        if (event.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        return db.searchRegistrationsByName(input.eventId, input.searchTerm);
      }),

    // Validar entrada por QR Code
    checkInByQrCode: protectedProcedure
      .input(z.object({ qrCode: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const registration = await db.getRegistrationByQrCode(input.qrCode);
        if (!registration) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Registration not found' });
        }

        const event = await db.getEventById(registration.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }

        if (event.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        if (registration.status !== 'approved') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Registration not approved' });
        }

        if (registration.checkedIn) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already checked in' });
        }

        await db.checkInRegistration(registration.id, ctx.user.id);
        return { success: true, registration };
      }),

    // Check-in manual por ID
    checkInById: protectedProcedure
      .input(z.object({ registrationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const registration = await db.getRegistrationById(input.registrationId);
        if (!registration) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Registration not found' });
        }

        const event = await db.getEventById(registration.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }

        if (event.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        if (registration.status !== 'approved') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Registration not approved' });
        }

        if (registration.checkedIn) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already checked in' });
        }

        await db.checkInRegistration(registration.id, ctx.user.id);
        const updatedRegistration = await db.getRegistrationById(registration.id);
        return { success: true, registration: updatedRegistration };
      }),

    // Listar inscrições do usuário logado
    myRegistrations: protectedProcedure.query(async ({ ctx }) => {
      const registrations = await db.getRegistrationsByUserId(ctx.user.id);
      
      // Buscar informações dos eventos
      const registrationsWithEvents = await Promise.all(
        registrations.map(async (reg: any) => {
          const event = await db.getEventById(reg.eventId);
          return { ...reg, event };
        })
      );
      
      // Separar eventos ativos (futuros) e passados
      const now = new Date();
      const active = registrationsWithEvents.filter((r: any) => r.event && new Date(r.event.eventDate) >= now);
      const past = registrationsWithEvents.filter((r: any) => r.event && new Date(r.event.eventDate) < now);
      
      return { active, past };
    }),

    // Obter detalhes da inscrição por QR Code (público para visualizar convite)
    getByQrCode: publicProcedure
      .input(z.object({ qrCode: z.string() }))
      .query(async ({ input }) => {
        const registration = await db.getRegistrationByQrCode(input.qrCode);
        if (!registration) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Registration not found' });
        }

        const event = await db.getEventById(registration.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }

        return { registration, event };
      }),

    // Cadastrar participante manualmente (organizador)
    createManual: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        formData: z.string(), // JSON stringified
        ticketTypeId: z.number().optional(),
        status: z.enum(['approved', 'pending']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }

        if (event.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        const qrCode = nanoid(16);
        const status = input.status || 'approved';

        const registrationId = await db.createRegistration({
          eventId: input.eventId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          formData: input.formData,
          ticketTypeId: input.ticketTypeId,
          status,
          qrCode,
        });

        // Incrementar contador de vendas do lote
        if (input.ticketTypeId && status === 'approved') {
          await db.incrementTicketTypeSold(input.ticketTypeId);
        }

        // Enviar e-mail de confirmação se aprovado
        if (status === 'approved') {
          const baseUrl = ENV.isProduction ? `https://${ENV.appId}.manus.space` : 'http://localhost:3000';
          const ticketUrl = `${baseUrl}/ticket/${qrCode}`;
          const eventDate = format(new Date(event.eventDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
          const [address] = event.address?.split('|') || [];

          await sendEmail({
            to: input.email,
            subject: `✅ Inscrição confirmada - ${event.title}`,
            html: getConfirmationEmailTemplate({
              participantName: input.name,
              eventTitle: event.title,
              eventDate,
              eventAddress: address,
              ticketUrl,
            }),
          });
        }

        return { registrationId, qrCode, status };
      }),

    // Exportar participantes para CSV
    exportToCsv: protectedProcedure
      .input(z.object({ 
        eventId: z.number(),
        status: z.enum(['all', 'approved', 'pending', 'rejected']).optional(),
      }))
      .query(async ({ ctx, input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }

        if (event.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        let registrations = await db.getRegistrationsByEventId(input.eventId);
        
        // Filtrar por status se especificado
        if (input.status && input.status !== 'all') {
          registrations = registrations.filter((r: any) => r.status === input.status);
        }

        // Gerar CSV
        const headers = ['Nome', 'Email', 'Telefone', 'Tipo de Ingresso', 'Status', 'Check-in', 'Data de Inscrição'];
        const rows = await Promise.all(registrations.map(async (r: any) => {
          const formData = r.formData ? JSON.parse(r.formData) : {};
          const extraFields = Object.entries(formData).map(([key, value]) => `${key}: ${value}`).join(' | ');
          
          // Buscar tipo de ingresso se houver
          let ticketTypeName = '';
          if (r.ticketTypeId) {
            const ticketType = await db.getTicketTypeById(r.ticketTypeId);
            ticketTypeName = ticketType?.name || '';
          }
          
          return [
            r.name,
            r.email,
            r.phone || '',
            ticketTypeName,
            r.status === 'approved' ? 'Aprovado' : r.status === 'pending' ? 'Pendente' : 'Rejeitado',
            r.checkedIn ? 'Sim' : 'Não',
            new Date(r.createdAt).toLocaleString('pt-BR'),
            extraFields,
          ];
        }));

        const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
        return { csv, filename: `participantes-${event.title.replace(/\s+/g, '-')}-${Date.now()}.csv` };
      }),
  }),

  // Perfil de usuário
  profile: router({
    // Obter perfil do usuário
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserById(ctx.user.id);
    }),

    // Atualizar perfil
    update: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        userType: z.enum(['individual', 'company']).optional(),
        cpf: z.string().optional(),
        birthDate: z.string().optional(),
        cnpj: z.string().optional(),
        companyName: z.string().optional(),
        tradeName: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        profilePhotoBase64: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let profilePhoto: string | undefined;
        let profilePhotoKey: string | undefined;

        // Upload da foto de perfil se fornecida
        if (input.profilePhotoBase64) {
          const base64Data = input.profilePhotoBase64.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const key = `profiles/${ctx.user.id}/${nanoid()}.jpg`;
          const result = await storagePut(key, buffer, 'image/jpeg');
          profilePhoto = result.url;
          profilePhotoKey = key;
        }

        const updateData: any = { ...input };
        delete updateData.profilePhotoBase64;
        
        if (profilePhoto) {
          updateData.profilePhoto = profilePhoto;
          updateData.profilePhotoKey = profilePhotoKey;
        }

        if (input.birthDate) {
          updateData.birthDate = new Date(input.birthDate);
        }

        return await db.updateUserProfile(ctx.user.id, updateData);
      }),
  }),

  // Configurações do site
  siteSettings: router({
    // Obter configuração por chave
    get: publicProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        return await db.getSiteSetting(input.key);
      }),

    // Obter todas as configurações
    getAll: publicProcedure.query(async () => {
      return await db.getAllSiteSettings();
    }),

    // Atualizar configuração (apenas admin)
    update: adminProcedure
      .input(z.object({
        key: z.string(),
        value: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateSiteSetting(input.key, input.value);
      }),

    // Atualizar múltiplas configurações (apenas admin)
    updateMultiple: adminProcedure
      .input(z.array(z.object({
        key: z.string(),
        value: z.string(),
      })))
      .mutation(async ({ input }) => {
        for (const setting of input) {
          await db.updateSiteSetting(setting.key, setting.value);
        }
        return { success: true };
      }),
  }),

  // Tipos de Ingressos/Lotes
  ticketTypes: router({
    // Criar tipo de ingresso
    create: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        price: z.string().optional(),
        quantity: z.number().optional(),
        validFrom: z.string().optional(),
        validUntil: z.string().optional(),
        color: z.string().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verificar se o usuário é dono do evento
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }
        if (event.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        const ticketTypeId = await db.createTicketType({
          eventId: input.eventId,
          name: input.name,
          description: input.description,
          price: input.price,
          quantity: input.quantity,
          quantitySold: 0,
          validFrom: input.validFrom ? new Date(input.validFrom) : undefined,
          validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
          color: input.color || '#ef4444',
          order: input.order || 0,
          isActive: 1,
        });

        return { ticketTypeId };
      }),

    // Listar tipos de ingresso de um evento
    listByEvent: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTicketTypesByEventId(input.eventId);
      }),

    // Obter lote ativo no momento (considerando datas e quantidades)
    getActive: publicProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getActiveTicketType(input.eventId);
      }),

    // Obter tipo de ingresso por ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTicketTypeById(input.id);
      }),

    // Atualizar tipo de ingresso
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.string().optional(),
        quantity: z.number().optional(),
        validFrom: z.string().optional(),
        validUntil: z.string().optional(),
        color: z.string().optional(),
        order: z.number().optional(),
        isActive: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ticketType = await db.getTicketTypeById(input.id);
        if (!ticketType) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket type not found' });
        }

        const event = await db.getEventById(ticketType.eventId);
        if (!event || (event.userId !== ctx.user.id && ctx.user.role !== 'admin')) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.price !== undefined) updateData.price = input.price;
        if (input.quantity !== undefined) updateData.quantity = input.quantity;
        if (input.validFrom !== undefined) updateData.validFrom = input.validFrom ? new Date(input.validFrom) : null;
        if (input.validUntil !== undefined) updateData.validUntil = input.validUntil ? new Date(input.validUntil) : null;
        if (input.color) updateData.color = input.color;
        if (input.order !== undefined) updateData.order = input.order;
        if (input.isActive !== undefined) updateData.isActive = input.isActive;

        await db.updateTicketType(input.id, updateData);
        return { success: true };
      }),

    // Deletar tipo de ingresso
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const ticketType = await db.getTicketTypeById(input.id);
        if (!ticketType) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket type not found' });
        }

        const event = await db.getEventById(ticketType.eventId);
        if (!event || (event.userId !== ctx.user.id && ctx.user.role !== 'admin')) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        await db.deleteTicketType(input.id);
        return { success: true };
      }),
  }),

  // Eventos públicos
  public: router({
    // Listar eventos públicos
    listEvents: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        city: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getPublicEvents(input);
      }),

    // Obter cidades disponíveis
    getCities: publicProcedure.query(async () => {
      return await db.getAllCities();
    }),

    // Obter categorias disponíveis
    getCategories: publicProcedure.query(async () => {
      return await db.getAllCategories();
    }),
  }),
});

export type AppRouter = typeof appRouter;
