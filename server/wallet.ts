import { Router } from "express";
import { getRegistrationWithEventByQrCode } from "./db";
import QRCode from "qrcode";

const router = Router();

// Endpoint para gerar PKPass/Google Wallet Pass
router.get("/pass/:qrCode", async (req, res) => {
  try {
    const { qrCode } = req.params;
    
    const registration = await getRegistrationWithEventByQrCode(qrCode);
    
    if (!registration) {
      return res.status(404).json({ error: "Ingresso não encontrado" });
    }

    const { event } = registration;
    
    // Gerar QR Code como base64
    const qrCodeDataUrl = await QRCode.toDataURL(qrCode, {
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    // Por enquanto, retornar JSON com dados do pass
    // Em produção, você precisaria de certificados Apple e configuração completa do PKPass
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.kievento.ticket",
      serialNumber: qrCode,
      teamIdentifier: "KIEVENTO",
      organizationName: "KiEvento",
      description: `Ingresso - ${event.title}`,
      logoText: "KiEvento",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(0, 0, 0)",
      eventTicket: {
        primaryFields: [
          {
            key: "event",
            label: "EVENTO",
            value: event.title,
          },
        ],
        secondaryFields: [
          {
            key: "date",
            label: "DATA",
            value: new Date(event.eventDate).toLocaleDateString("pt-BR"),
          },
          {
            key: "time",
            label: "HORÁRIO",
            value: new Date(event.eventDate).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ],
        auxiliaryFields: [
          {
            key: "participant",
            label: "PARTICIPANTE",
            value: registration.name,
          },
        ],
        backFields: [
          {
            key: "location",
            label: "LOCAL",
            value: event.address || "A definir",
          },
          {
            key: "qrcode",
            label: "CÓDIGO",
            value: qrCode,
          },
        ],
      },
      barcode: {
        message: qrCode,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
      },
    };

    // Retornar JSON do pass (para desenvolvimento)
    // Em produção, gerar arquivo .pkpass real
    res.json({
      message: "Funcionalidade de carteira digital em desenvolvimento",
      passData,
      qrCodeImage: qrCodeDataUrl,
      instructions: {
        apple: "Para adicionar ao Apple Wallet, é necessário certificado Apple Developer",
        google: "Para adicionar ao Google Wallet, use a API Google Wallet",
      },
    });
    
  } catch (error) {
    console.error("Erro ao gerar pass:", error);
    res.status(500).json({ error: "Erro ao gerar pass para carteira digital" });
  }
});

export default router;
