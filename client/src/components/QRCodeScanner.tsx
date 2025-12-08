import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, CameraOff, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QRCodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

export default function QRCodeScanner({ onScan, onError }: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [error, setError] = useState<string>("");
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    // Inicializar leitor de QR Code
    readerRef.current = new BrowserMultiFormatReader();

    // Listar dispositivos de vídeo disponíveis
    navigator.mediaDevices
      .enumerateDevices()
      .then((deviceList) => {
        const videoDevices = deviceList.filter((device) => device.kind === "videoinput");
        setDevices(videoDevices);
        
        // Selecionar câmera traseira por padrão em dispositivos móveis
        const backCamera = videoDevices.find(
          (device) => device.label.toLowerCase().includes("back") || device.label.toLowerCase().includes("traseira")
        );
        if (backCamera) {
          setSelectedDevice(backCamera.deviceId);
        } else if (videoDevices.length > 0) {
          setSelectedDevice(videoDevices[0].deviceId);
        }
      })
      .catch((err) => {
        console.error("Error enumerating devices:", err);
        setError("Não foi possível acessar as câmeras do dispositivo");
        onError?.("Não foi possível acessar as câmeras do dispositivo");
      });

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!readerRef.current || !videoRef.current) return;

    try {
      setError("");
      setIsScanning(true);

      const deviceId = selectedDevice || undefined;

      await readerRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const text = result.getText();
            console.log("QR Code detected:", text);
            onScan(text);
            // Continuar escaneando após detectar um código
          }
          if (error && !(error instanceof NotFoundException)) {
            console.error("Scan error:", error);
          }
        }
      );
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      setIsScanning(false);
      const errorMessage = err.name === "NotAllowedError" 
        ? "Permissão de câmera negada. Por favor, permita o acesso à câmera."
        : "Erro ao iniciar o scanner. Verifique se a câmera está disponível.";
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const stopScanning = () => {
    // Parar todas as tracks de vídeo
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
    if (isScanning) {
      stopScanning();
      setTimeout(() => {
        setSelectedDevice(deviceId);
        startScanning();
      }, 100);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Seletor de câmera */}
        {devices.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecionar Câmera</label>
            <Select value={selectedDevice} onValueChange={handleDeviceChange}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma câmera" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Câmera ${devices.indexOf(device) + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Vídeo da câmera */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          {!isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center text-white">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Scanner pausado</p>
              </div>
            </div>
          )}
          {isScanning && (
            <div className="absolute inset-0 border-4 border-green-500 animate-pulse pointer-events-none" />
          )}
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Controles */}
        <div className="flex gap-2">
          {!isScanning ? (
            <Button onClick={startScanning} className="flex-1 h-12 sm:h-10" size="lg">
              <Camera className="h-4 w-4 mr-2" />
              Iniciar Scanner
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="destructive" className="flex-1 h-12 sm:h-10" size="lg">
              <CameraOff className="h-4 w-4 mr-2" />
              Parar Scanner
            </Button>
          )}
          {isScanning && (
            <Button onClick={() => { stopScanning(); setTimeout(startScanning, 100); }} variant="outline" size="lg" className="h-12 sm:h-10">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Instruções */}
        <div className="text-xs sm:text-sm text-muted-foreground text-center space-y-1">
          <p>📱 Aponte a câmera para o QR Code do ingresso</p>
          <p>✨ A validação será feita automaticamente</p>
        </div>
      </CardContent>
    </Card>
  );
}
