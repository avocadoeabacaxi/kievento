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
        address: z.string().optional(),
        registrationType: z.enum(['open', 'approval']),
        category: z.string().optional(),
        city: z.string().optional(),
        visibility: z.enum(["public", "private"]).optional(),
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

        const eventId = await db.createEvent({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          eventDate: new Date(input.eventDate),
          address: input.address,
          bannerUrl,
          bannerKey,
          cardImageUrl,
          cardImageKey,
          registrationType: input.registrationType,
          category: input.category,
          city: input.city,
          visibility: input.visibility,
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

    // Atualizar evento
    update: protectedProcedure
      .input(z.object({
        eventId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        eventDate: z.string().optional(),
        address: z.string().optional(),
        registrationType: z.enum(['open', 'approval']).optional(),
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
        if (input.address !== undefined) updateData.address = input.address;
        if (input.registrationType) updateData.registrationType = input.registrationType;

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
          status,
          qrCode,
        });

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
        return { success: true };
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
