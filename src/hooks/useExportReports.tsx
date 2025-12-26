import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ExportData {
  stats: {
    dailySalesCount: number;
    dailySalesAmount: number;
    monthlySalesCount: number;
    monthlySalesAmount: number;
    outOfStockCount: number;
    lowStockCount: number;
    unresolvedAlertsCount: number;
    avgTicket: number;
    weeklyGrowth: number;
    totalProducts: number;
    activeProducts: number;
  } | null;
  salesEvolution: Array<{
    date: string;
    fullDate: string;
    amount: number;
    count: number;
  }>;
  categoryStats: Array<{
    name: string;
    revenue: number;
    count: number;
  }>;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  paymentDistribution: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  hourlyDistribution: Array<{
    hour: string;
    count: number;
    amount: number;
  }>;
}

export function useExportReports() {
  // Fonction de formatage personnalisée pour les montants (évite les espaces insécables qui posent problème avec jsPDF)
  const formatAmount = (value: number): string => {
    return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const exportToExcel = useCallback((data: ExportData, boutiqueName?: string) => {
    const workbook = XLSX.utils.book_new();
    const today = format(new Date(), 'dd-MM-yyyy', { locale: fr });

    // Sheet 1: Résumé des KPIs
    const summaryData = [
      ['Rapport des ventes - ' + (boutiqueName || 'Boutique')],
      ['Date du rapport: ' + format(new Date(), 'dd MMMM yyyy HH:mm', { locale: fr })],
      [],
      ['INDICATEURS CLÉS'],
      ['Ventes du jour', data.stats?.dailySalesCount || 0],
      ['Montant du jour (XAF)', data.stats?.dailySalesAmount || 0],
      ['Ventes du mois', data.stats?.monthlySalesCount || 0],
      ['Montant du mois (XAF)', data.stats?.monthlySalesAmount || 0],
      ['Panier moyen (XAF)', data.stats?.avgTicket?.toFixed(0) || 0],
      ['Croissance hebdo (%)', data.stats?.weeklyGrowth?.toFixed(1) || 0],
      [],
      ['ÉTAT DES STOCKS'],
      ['Ruptures de stock', data.stats?.outOfStockCount || 0],
      ['Produits en alerte', data.stats?.lowStockCount || 0],
      ['Alertes non résolues', data.stats?.unresolvedAlertsCount || 0],
      ['Produits actifs', data.stats?.activeProducts || 0],
      ['Total produits', data.stats?.totalProducts || 0],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');

    // Sheet 2: Évolution des ventes
    const evolutionHeaders = ['Date', 'Montant (XAF)', 'Nombre de ventes'];
    const evolutionData = data.salesEvolution.map(item => [
      item.fullDate,
      item.amount,
      item.count
    ]);
    const evolutionSheet = XLSX.utils.aoa_to_sheet([evolutionHeaders, ...evolutionData]);
    XLSX.utils.book_append_sheet(workbook, evolutionSheet, 'Évolution ventes');

    // Sheet 3: Ventes par catégorie
    const categoryHeaders = ['Catégorie', 'Chiffre d\'affaires (XAF)', 'Articles vendus'];
    const categoryData = data.categoryStats.map(item => [
      item.name,
      item.revenue,
      item.count
    ]);
    const categorySheet = XLSX.utils.aoa_to_sheet([categoryHeaders, ...categoryData]);
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Par catégorie');

    // Sheet 4: Top produits
    const topProductsHeaders = ['Produit', 'Quantité vendue', 'Chiffre d\'affaires (XAF)'];
    const topProductsData = data.topProducts.map(item => [
      item.name,
      item.quantity,
      item.revenue
    ]);
    const topProductsSheet = XLSX.utils.aoa_to_sheet([topProductsHeaders, ...topProductsData]);
    XLSX.utils.book_append_sheet(workbook, topProductsSheet, 'Top produits');

    // Sheet 5: Répartition paiements
    const paymentHeaders = ['Mode de paiement', 'Nombre de transactions', 'Montant (XAF)'];
    const paymentData = data.paymentDistribution.map(item => [
      item.method,
      item.count,
      item.amount
    ]);
    const paymentSheet = XLSX.utils.aoa_to_sheet([paymentHeaders, ...paymentData]);
    XLSX.utils.book_append_sheet(workbook, paymentSheet, 'Paiements');

    // Sheet 6: Distribution horaire
    const hourlyHeaders = ['Heure', 'Nombre de ventes', 'Montant (XAF)'];
    const hourlyData = data.hourlyDistribution.map(item => [
      item.hour,
      item.count,
      item.amount
    ]);
    const hourlySheet = XLSX.utils.aoa_to_sheet([hourlyHeaders, ...hourlyData]);
    XLSX.utils.book_append_sheet(workbook, hourlySheet, 'Par heure');

    XLSX.writeFile(workbook, `rapport-ventes-${today}.xlsx`);
  }, []);

  const exportToPDF = useCallback((data: ExportData, boutiqueName?: string) => {
    const doc = new jsPDF();
    const today = format(new Date(), 'dd MMMM yyyy HH:mm', { locale: fr });
    let yPos = 20;

    // En-tête
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Rapport des Ventes', 105, yPos, { align: 'center' });
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(boutiqueName || 'Boutique', 105, yPos, { align: 'center' });
    yPos += 6;
    doc.text(`Généré le ${today}`, 105, yPos, { align: 'center' });
    yPos += 15;

    // Section KPIs
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Indicateurs Clés', 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Ventes du jour', `${data.stats?.dailySalesCount || 0} (${formatAmount(data.stats?.dailySalesAmount || 0)} XAF)`],
        ['Ventes du mois', `${data.stats?.monthlySalesCount || 0} (${formatAmount(data.stats?.monthlySalesAmount || 0)} XAF)`],
        ['Panier moyen', `${formatAmount(data.stats?.avgTicket || 0)} XAF`],
        ['Croissance hebdo', `${data.stats?.weeklyGrowth?.toFixed(1) || 0}%`],
        ['Ruptures de stock', `${data.stats?.outOfStockCount || 0}`],
        ['Produits en alerte', `${data.stats?.lowStockCount || 0}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Top 5 Produits
    doc.setFontSize(14);
    doc.text('Top 5 Produits du mois', 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Produit', 'Quantité', 'CA (XAF)']],
      body: data.topProducts.map(p => [
        p.name,
        p.quantity.toString(),
        formatAmount(p.revenue)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Ventes par catégorie
    if (data.categoryStats.length > 0) {
      doc.setFontSize(14);
      doc.text('Ventes par Catégorie', 14, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Catégorie', 'Articles', 'CA (XAF)']],
        body: data.categoryStats.map(c => [
          c.name,
          c.count.toString(),
          formatAmount(c.revenue)
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Modes de paiement
    if (data.paymentDistribution.length > 0) {
      // Ajouter nouvelle page si nécessaire
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text('Répartition des Paiements', 14, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Mode', 'Transactions', 'Montant (XAF)']],
        body: data.paymentDistribution.map(p => [
          p.method,
          p.count.toString(),
          formatAmount(p.amount)
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Évolution des ventes (nouvelle page)
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(14);
    doc.text('Évolution des Ventes (14 derniers jours)', 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Ventes', 'Montant (XAF)']],
      body: data.salesEvolution.map(s => [
        s.fullDate,
        s.count.toString(),
        formatAmount(s.amount)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14 },
    });

    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} / ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`rapport-ventes-${format(new Date(), 'dd-MM-yyyy', { locale: fr })}.pdf`);
  }, []);

  return { exportToExcel, exportToPDF };
}
