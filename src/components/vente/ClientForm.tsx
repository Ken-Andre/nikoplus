import { useState } from 'react';
import { User, Phone, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface ClientFormProps {
  clientName: string;
  clientPhone: string;
  onClientNameChange: (name: string) => void;
  onClientPhoneChange: (phone: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ClientForm({
  clientName,
  clientPhone,
  onClientNameChange,
  onClientPhoneChange,
  onNext,
  onBack,
}: ClientFormProps) {
  const [includeClient, setIncludeClient] = useState(false);

  const handleSkip = () => {
    onClientNameChange('');
    onClientPhoneChange('');
    onNext();
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations Client
          </CardTitle>
          <CardDescription>
            Ces informations sont optionnelles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="include-client" className="text-base font-medium">
              Enregistrer les infos client ?
            </Label>
            <Switch
              id="include-client"
              checked={includeClient}
              onCheckedChange={setIncludeClient}
            />
          </div>

          {includeClient && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="client-name">Nom du client</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="client-name"
                    placeholder="Ex: Jean Dupont"
                    value={clientName}
                    onChange={(e) => onClientNameChange(e.target.value)}
                    className="pl-10"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-phone">Téléphone (optionnel)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="client-phone"
                    placeholder="Ex: +237 6XX XXX XXX"
                    value={clientPhone}
                    onChange={(e) => onClientPhoneChange(e.target.value)}
                    className="pl-10"
                    maxLength={20}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        
        {includeClient ? (
          <Button
            onClick={onNext}
            className="flex-1 bg-primary"
            disabled={!clientName.trim()}
          >
            Continuer
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSkip}
            className="flex-1 bg-primary"
          >
            Passer cette étape
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
