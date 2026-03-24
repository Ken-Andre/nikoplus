import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Building2, Package, ShoppingCart, Bell, History, Save, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
interface AppSettings {
  company: {
    name: string;
    logo: string | null;
    currency: string;
  };
  stock: {
    default_alert_threshold: number;
    low_stock_color: string;
    ok_stock_color: string;
  };
  sales: {
    vat_rate: number;
    payment_methods: string[];
  };
  notifications: {
    email_alerts: boolean;
    sound_enabled: boolean;
  };
}
interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  table_name: string;
  created_at: string;
}
export default function ParametresSysteme() {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchSettings();
    fetchAuditLogs();
  }, [user, navigate]);
  const fetchSettings = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('app_settings').select('key, value');
      if (error) throw error;
      const settingsMap: Record<string, any> = {};
      data?.forEach(item => {
        settingsMap[item.key] = item.value;
      });
      setSettings({
        company: settingsMap.company || {
          name: 'NICKOPLUS PRO',
          logo: null,
          currency: 'XAF'
        },
        stock: settingsMap.stock || {
          default_alert_threshold: 5,
          low_stock_color: '#EF4444',
          ok_stock_color: '#22C55E'
        },
        sales: settingsMap.sales || {
          vat_rate: 0,
          payment_methods: ['cash', 'mobile_money', 'card', 'transfer']
        },
        notifications: settingsMap.notifications || {
          email_alerts: false,
          sound_enabled: true
        }
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setIsLoading(false);
    }
  };
  const fetchAuditLogs = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('audit_logs').select('*').order('created_at', {
        ascending: false
      }).limit(50);
      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };
  const saveSettings = async (key: string, value: any) => {
    setIsSaving(true);
    try {
      const {
        error
      } = await supabase.from('app_settings').update({
        value
      }).eq('key', key);
      if (error) throw error;

      // Log the action via SECURITY DEFINER function
      await supabase.rpc('insert_audit_log', {
        _user_id: user?.id,
        _user_email: user?.email || '',
        _action: 'UPDATE_SETTINGS',
        _table_name: 'app_settings',
        _new_values: { key, value }
      });
      toast.success('Paramètres enregistrés');
      fetchAuditLogs();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };
  const updateCompanySetting = (field: keyof AppSettings['company'], value: string) => {
    if (!settings) return;
    const newCompany = {
      ...settings.company,
      [field]: value
    };
    setSettings({
      ...settings,
      company: newCompany
    });
  };
  const updateStockSetting = (field: keyof AppSettings['stock'], value: number | string) => {
    if (!settings) return;
    const newStock = {
      ...settings.stock,
      [field]: value
    };
    setSettings({
      ...settings,
      stock: newStock
    });
  };
  const updateSalesSetting = (field: keyof AppSettings['sales'], value: number | string[]) => {
    if (!settings) return;
    const newSales = {
      ...settings.sales,
      [field]: value
    };
    setSettings({
      ...settings,
      sales: newSales
    });
  };
  const updateNotificationSetting = (field: keyof AppSettings['notifications'], value: boolean) => {
    if (!settings) return;
    const newNotifications = {
      ...settings.notifications,
      [field]: value
    };
    setSettings({
      ...settings,
      notifications: newNotifications
    });
  };
  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      UPDATE_SETTINGS: 'Modification des paramètres',
      CREATE_USER: 'Création d\'utilisateur',
      DELETE_USER: 'Suppression d\'utilisateur',
      UPDATE_USER: 'Modification d\'utilisateur',
      CREATE_BOUTIQUE: 'Création de boutique',
      DELETE_BOUTIQUE: 'Suppression de boutique'
    };
    return labels[action] || action;
  };
  if (isLoading) {
    return <AppLayout title="Paramètres Système">
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>)}
        </div>
      </AppLayout>;
  }
  return <AppLayout title="Paramètres Système">
      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Entreprise</span>
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Stock</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Ventes</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Historique</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations de l'entreprise
              </CardTitle>
              <CardDescription>
                Configurez les informations générales de votre entreprise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom de l'entreprise</Label>
                  <Input id="companyName" value={settings?.company.name || ''} onChange={e => updateCompanySetting('name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Input id="currency" value={settings?.company.currency || 'XAF'} onChange={e => updateCompanySetting('currency', e.target.value)} />
                </div>
              </div>
              <Button onClick={() => saveSettings('company', settings?.company)} disabled={isSaving}>
                {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Enregistrer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Settings */}
        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Paramètres de stock
              </CardTitle>
              <CardDescription>
                Configurez les seuils d'alerte et les couleurs d'affichage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="alertThreshold">Seuil d'alerte par défaut</Label>
                  <Input id="alertThreshold" type="number" min="1" value={settings?.stock.default_alert_threshold || 5} onChange={e => updateStockSetting('default_alert_threshold', parseInt(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStockColor">Couleur stock bas</Label>
                  <div className="flex gap-2">
                    <Input id="lowStockColor" type="color" value={settings?.stock.low_stock_color || '#EF4444'} onChange={e => updateStockSetting('low_stock_color', e.target.value)} className="h-10 w-16 p-1" />
                    <Input value={settings?.stock.low_stock_color || '#EF4444'} onChange={e => updateStockSetting('low_stock_color', e.target.value)} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="okStockColor">Couleur stock OK</Label>
                  <div className="flex gap-2">
                    <Input id="okStockColor" type="color" value={settings?.stock.ok_stock_color || '#22C55E'} onChange={e => updateStockSetting('ok_stock_color', e.target.value)} className="h-10 w-16 p-1" />
                    <Input value={settings?.stock.ok_stock_color || '#22C55E'} onChange={e => updateStockSetting('ok_stock_color', e.target.value)} className="flex-1" />
                  </div>
                </div>
              </div>
              <Button onClick={() => saveSettings('stock', settings?.stock)} disabled={isSaving}>
                {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Enregistrer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Settings */}
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Paramètres de vente
              </CardTitle>
              <CardDescription>
                Configurez la TVA et les méthodes de paiement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vatRate">Taux de TVA (%)</Label>
                <Input id="vatRate" type="number" min="0" max="100" step="0.1" value={settings?.sales.vat_rate || 0} onChange={e => updateSalesSetting('vat_rate', parseFloat(e.target.value))} className="w-32" />
                <p className="text-xs text-muted-foreground">
                  0 = pas de TVA appliquée
                </p>
              </div>

              <div className="space-y-3">
                <Label>Méthodes de paiement actives</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[{
                  id: 'cash',
                  label: 'Espèces',
                  icon: '💵'
                }, {
                  id: 'mobile_money',
                  label: 'Mobile Money',
                  icon: '📱'
                }, {
                  id: 'card',
                  label: 'Carte bancaire',
                  icon: '💳'
                }, {
                  id: 'transfer',
                  label: 'Virement',
                  icon: '🏦'
                }].map(method => <div key={method.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <span>{method.icon}</span>
                        <span>{method.label}</span>
                      </div>
                      <Switch checked={settings?.sales.payment_methods.includes(method.id)} onCheckedChange={checked => {
                    const methods = settings?.sales.payment_methods || [];
                    if (checked) {
                      updateSalesSetting('payment_methods', [...methods, method.id]);
                    } else {
                      updateSalesSetting('payment_methods', methods.filter(m => m !== method.id));
                    }
                  }} />
                    </div>)}
                </div>
              </div>

              <Button onClick={() => saveSettings('sales', settings?.sales)} disabled={isSaving}>
                {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Enregistrer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Paramètres de notifications
              </CardTitle>
              <CardDescription>
                Configurez les alertes et notifications système
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Alertes par mail</p>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des notifications par email pour les alertes critiques
                    </p>
                  </div>
                  <Switch checked={settings?.notifications.email_alerts} onCheckedChange={checked => updateNotificationSetting('email_alerts', checked)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Sons de notification</p>
                    <p className="text-sm text-muted-foreground">
                      Jouer un son lors des confirmations de vente
                    </p>
                  </div>
                  <Switch checked={settings?.notifications.sound_enabled} onCheckedChange={checked => updateNotificationSetting('sound_enabled', checked)} />
                </div>
              </div>

              <Button onClick={() => saveSettings('notifications', settings?.notifications)} disabled={isSaving}>
                {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Enregistrer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Journal d'activité
              </CardTitle>
              <CardDescription>
                Historique des actions administratives récentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? <p className="text-center text-muted-foreground py-8">
                  Aucune activité enregistrée
                </p> : <div className="space-y-3">
                  {auditLogs.map(log => <div key={log.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <History className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{getActionLabel(log.action)}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.user_email} • {log.table_name && `Table: ${log.table_name}`}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', {
                    locale: fr
                  })}
                      </span>
                    </div>)}
                </div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>;
}