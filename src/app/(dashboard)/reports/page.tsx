"use client";

import { useDashboardData } from "@/hooks/use-candidates";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, BarChart3, Loader2 } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/charts";

export default function ReportsPage() {
  const { chartData, isLoading } = useDashboardData();

  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClassificationCSV = () => {
    if (!chartData.length) return;
    const headers = ["Timestamp", "Classification"];
    const rows = chartData.map(c => {
      const dateStr = new Date(c.processed_timestamp).toISOString().replace('T', ' ').substring(0, 19);
      // Wrapping in ="..." forces Excel to treat it as pure text, preventing the ######## error
      return [`="${dateStr}"`, c.classification];
    });
    downloadCSV("classification_trends.csv", headers, rows);
  };

  const handleDcmCSV = () => {
    if (!chartData.length) return;
    const dcmCounts: Record<string, number> = {};
    chartData.forEach(c => {
      const dcm = c.dcm_type || "Unknown";
      dcmCounts[dcm] = (dcmCounts[dcm] || 0) + 1;
    });
    
    const headers = ["DCM Type", "Total Candidates"];
    const rows = Object.entries(dcmCounts);
    downloadCSV("dcm_performance.csv", headers, rows);
  };

  const handlePlatformCSV = () => {
    if (!chartData.length) return;
    const platformCounts: Record<string, number> = {};
    chartData.forEach(c => {
      const platform = c.platform_name || "Unknown";
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });
    
    const headers = ["Platform", "Total Candidates"];
    const rows = Object.entries(platformCounts);
    downloadCSV("platform_analytics.csv", headers, rows);
  };

  // PDF print handled by global CSS print classes

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in duration-500 print:bg-white print:text-black">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2 print:hidden">
            Generate and download comprehensive recruitment performance reports.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 print:hidden">
        <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2 text-primary">
              <TrendingUp className="h-5 w-5" />
              <CardTitle className="text-lg">Classification Trends</CardTitle>
            </div>
            <CardDescription>Monthly overview of AI FIT vs UNFIT rates</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full gap-2" onClick={handleClassificationCSV}>
              <FileText className="h-4 w-4" /> Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2 text-primary">
              <BarChart3 className="h-5 w-5" />
              <CardTitle className="text-lg">DCM Performance</CardTitle>
            </div>
            <CardDescription>Processing speeds and volume per DCM</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full gap-2" onClick={handleDcmCSV}>
              <FileText className="h-4 w-4" /> Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2 text-primary">
              <FileText className="h-5 w-5" />
              <CardTitle className="text-lg">Platform Analytics</CardTitle>
            </div>
            <CardDescription>Candidate source performance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full gap-2" onClick={handlePlatformCSV}>
              <FileText className="h-4 w-4" /> Download CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold font-heading mb-4">Live Analytics</h2>
        <div className="print:block">
          <DashboardCharts data={chartData} />
        </div>
      </div>
    </div>
  );
}
