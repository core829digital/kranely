import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';

const REGIME_FISCALE_CONFIG = {
  forfettario: { label: 'Regime Forfettario', iva: 0, note: 'Non soggetto IVA (L. 190/2014)' },
  ordinario_individuale: { label: 'Ordinario Ditta Individuale', iva: 22, note: 'IVA ordinaria 22%' },
  srls: { label: 'S.r.l.s.', iva: 22, note: 'IVA ordinaria 22% - Società semplificata' },
  srl: { label: 'S.r.l.', iva: 22, note: 'IVA ordinaria 22%' },
  altro: { label: 'Altro', iva: 22, note: 'Consulta il tuo commercialista' }
};

export default function FinancialReport({ user }) {
  const [periodo, setPeriodo] = React.useState('mensile');
  const [regimeFiscale, setRegimeFiscale] = React.useState(user.regime_fiscale || 'ordinario_individuale');

  const { data: fatture = [] } = useQuery({
    queryKey: ['fatture-report', user.email],
    queryFn: () => base44.entities.Fatturato.filter({ company_email: user.email }, '-data_emissione'),
    enabled: !!user
  });

  const generateReport = () => {
    const now = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const fattureMonth = fatture.filter(f => 
        f.data_emissione?.startsWith(monthKey)
      );

      const fatturato_lordo = fattureMonth.reduce((sum, f) => sum + (f.importo || 0), 0);
      const config = REGIME_FISCALE_CONFIG[regimeFiscale];
      const iva_dovuta = fatturato_lordo * (config.iva / 100);
      const fatturato_netto = fatturato_lordo - iva_dovuta;

      months.push({
        periodo: date.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }),
        fatturato_lordo,
        fatturato_netto,
        iva_dovuta,
        pagato: fattureMonth.filter(f => f.status === 'pagato').reduce((sum, f) => sum + f.importo, 0),
        in_corso: fattureMonth.filter(f => f.status === 'in_corso').reduce((sum, f) => sum + f.importo, 0)
      });
    }

    return months;
  };

  const reportData = generateReport();
  const totals = reportData.reduce((acc, curr) => ({
    fatturato_lordo: acc.fatturato_lordo + curr.fatturato_lordo,
    fatturato_netto: acc.fatturato_netto + curr.fatturato_netto,
    iva_dovuta: acc.iva_dovuta + curr.iva_dovuta,
    pagato: acc.pagato + curr.pagato,
    in_corso: acc.in_corso + curr.in_corso
  }), { fatturato_lordo: 0, fatturato_netto: 0, iva_dovuta: 0, pagato: 0, in_corso: 0 });

  const exportPDF = async () => {
    // Genera report PDF via backend
    alert('Esportazione PDF in sviluppo');
  };

  const exportCSV = () => {
    const csv = [
      ['Periodo', 'Fatturato Lordo', 'IVA', 'Fatturato Netto', 'Pagato', 'In Corso'],
      ...reportData.map(r => [
        r.periodo,
        r.fatturato_lordo.toFixed(2),
        r.iva_dovuta.toFixed(2),
        r.fatturato_netto.toFixed(2),
        r.pagato.toFixed(2),
        r.in_corso.toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-finanziario-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-medium text-[#f8f9fa]">Report Finanziario</h2>
          <p className="text-[#adb5bd] text-sm">Ultimi 6 mesi</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Select value={regimeFiscale} onValueChange={setRegimeFiscale}>
            <SelectTrigger className="w-full sm:w-48 bg-[#343a40]/50 border-[#f8f9fa]/20 text-[#f8f9fa]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REGIME_FISCALE_CONFIG).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportCSV} variant="outline" className="border-[#f8f9fa]/20">
            <Download size={16} className="mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <Card className="bg-gradient-to-br from-[#FFC703]/20 to-[#FFC703]/20 border-[#FFC703]/20">
          <CardContent className="p-3 sm:p-4">
            <div className="text-xs text-[#FFC703] mb-1">F. Lordo</div>
            <div className="text-base sm:text-xl lg:text-2xl font-light text-[#f8f9fa]">€{(totals.fatturato_lordo/1000).toFixed(1)}k</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-600/20 to-red-700/20 border-red-500/30">
          <CardContent className="p-4">
            <div className="text-xs text-red-300 mb-1">IVA Dovuta ({REGIME_FISCALE_CONFIG[regimeFiscale].iva}%)</div>
            <div className="text-2xl font-light text-[#f8f9fa]">€{totals.iva_dovuta.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-700/20 border-green-500/30">
          <CardContent className="p-4">
            <div className="text-xs text-green-300 mb-1">Fatturato Netto</div>
            <div className="text-2xl font-light text-[#f8f9fa]">€{totals.fatturato_netto.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600/20 to-orange-700/20 border-orange-500/30">
          <CardContent className="p-4">
            <div className="text-xs text-orange-300 mb-1">In Attesa</div>
            <div className="text-2xl font-light text-[#f8f9fa]">€{totals.in_corso.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="bg-[#FFC703]/10 border-[#FFC703]/20">
        <CardContent className="p-4">
          <p className="text-sm text-[#FFC703]">
            <strong>Regime Fiscale:</strong> {REGIME_FISCALE_CONFIG[regimeFiscale].note}
          </p>
          <p className="text-xs text-[#FFC703]/70 mt-1">
            I dati sono indicativi. Consulta sempre un commercialista per calcoli precisi.
          </p>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-[#343a40]/30 border-[#f8f9fa]/20">
          <CardHeader>
            <CardTitle className="text-[#f8f9fa]">Trend Fatturato</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#495057" />
                <XAxis dataKey="periodo" stroke="#adb5bd" />
                <YAxis stroke="#adb5bd" />
                <Tooltip contentStyle={{ backgroundColor: '#343a40', border: '1px solid #6c757d' }} />
                <Legend />
                <Line type="monotone" dataKey="fatturato_lordo" stroke="#3b82f6" name="Lordo" />
                <Line type="monotone" dataKey="fatturato_netto" stroke="#10b981" name="Netto" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#343a40]/30 border-[#f8f9fa]/20">
          <CardHeader>
            <CardTitle className="text-[#f8f9fa]">Pagamenti</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#495057" />
                <XAxis dataKey="periodo" stroke="#adb5bd" />
                <YAxis stroke="#adb5bd" />
                <Tooltip contentStyle={{ backgroundColor: '#343a40', border: '1px solid #6c757d' }} />
                <Legend />
                <Bar dataKey="pagato" fill="#10b981" name="Pagato" />
                <Bar dataKey="in_corso" fill="#f59e0b" name="In Attesa" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
