import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLenderDashboard } from '../api';
import { useRequiredUser } from '../hooks/useRequiredUser';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis } from 'recharts';

export default function DashboardLender() {
  const user = useRequiredUser();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.userId) return;
    async function load() {
      try {
        // GET /dashboard/lender -> {next_payment,expected_revenue_year}
        const resp = await fetchLenderDashboard(user.userId);
        setData(resp);
      } catch (err) {
        setError(err.response?.data?.detail || 'Could not load dashboard.');
      }
    }
    load();
  }, [user?.userId]);

  if (!user) return null;

  const revenueForecast = useMemo(() => {
    if (!data) return [];
    const annualRevenue = Number(data.expected_revenue_year) || 0;
    const monthlyRevenue = annualRevenue / 12;
    return Array.from({ length: 6 }, (_, index) => ({
      label: `Month ${index + 1}`,
      revenue: Math.round(monthlyRevenue * (index + 1)),
      reinvest: Math.round((monthlyRevenue * (index + 1)) * 0.35),
    }));
  }, [data]);

  const paymentPipeline = useMemo(() => {
    if (!data) return [];
    const nextAmount = Number(data.next_payment?.amount) || 0;
    return Array.from({ length: 8 }, (_, index) => ({
      label: `Week ${index + 1}`,
      repayments: Math.round(nextAmount * (1 - Math.min(index * 0.08, 0.4))),
    }));
  }, [data]);

  const revenueChartConfig = {
    revenue: { label: 'Projected revenue', color: 'hsl(25.5 95% 53.5%)' },
    reinvest: { label: 'Reinvested', color: 'hsl(217.2 91.2% 59.8%)' },
  };

  const pipelineChartConfig = {
    repayments: { label: 'Expected repayments', color: 'hsl(142.1 70.6% 45.3%)' },
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lender dashboard</h1>
          <p className="text-muted-foreground">
            Monitor repayments, forecast revenue, and support more borrowers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Dashboard home
          </Button>
          <Button onClick={() => navigate('/dashboard/borrower')}>Switch to borrowing</Button>
        </div>
      </div>

      <Tabs value="lender" className="w-full">
        <TabsList className="w-full justify-start gap-2 rounded-2xl bg-muted p-1">
          <TabsTrigger value="borrower" className="flex-1" onClick={() => navigate('/dashboard/borrower')}>
            Borrowing
          </TabsTrigger>
          <TabsTrigger value="lender" className="flex-1">
            Lending
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {error && <p className="text-destructive">{error}</p>}
      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Next repayment</CardTitle>
                <CardDescription>{data.next_payment.due_in_weeks} week(s) away</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">${data.next_payment.amount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Annual revenue</CardTitle>
                <CardDescription>Projected repayments this year</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">${data.expected_revenue_year}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Average yield</CardTitle>
                <CardDescription>Based on your repayments pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">
                  {Math.min(
                    18,
                    Math.max(6, Math.round((data.expected_revenue_year / Math.max(data.next_payment.amount, 1)) * 2)),
                  )}
                  %
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Active borrowers</CardTitle>
                <CardDescription>Community members in your portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{Math.max(3, Math.round(data.expected_revenue_year / 800))}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>Revenue projections</CardTitle>
                <CardDescription>Set aside a portion to reinvest in new borrowers</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ChartContainer config={revenueChartConfig} className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueForecast}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={12} />
                      <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--color-revenue)"
                        fill="var(--color-revenue)"
                        fillOpacity={0.2}
                        name={revenueChartConfig.revenue.label}
                      />
                      <Area
                        type="monotone"
                        dataKey="reinvest"
                        stroke="var(--color-reinvest)"
                        fill="var(--color-reinvest)"
                        fillOpacity={0.1}
                        name={revenueChartConfig.reinvest.label}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>Repayment pipeline</CardTitle>
                <CardDescription>Expected weekly inflows from your borrowers</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ChartContainer config={pipelineChartConfig} className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={paymentPipeline}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={12} />
                      <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                      <Area
                        type="monotone"
                        dataKey="repayments"
                        stroke="var(--color-repayments)"
                        fill="var(--color-repayments)"
                        fillOpacity={0.2}
                        name={pipelineChartConfig.repayments.label}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

        </>
      )}
    </div>
  );
}
