import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBorrowerDashboard } from '../api';
import { useRequiredUser } from '../hooks/useRequiredUser';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis } from 'recharts';

export default function DashboardBorrower() {
  const user = useRequiredUser();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.userId) return;
    async function load() {
      try {
        // GET /dashboard/borrower -> {next_payment,total_owed_year,savings_vs_bank_year}
        const resp = await fetchBorrowerDashboard(user.userId);
        setData(resp);
      } catch (err) {
        setError(err.response?.data?.detail || 'Could not load dashboard.');
      }
    }
    load();
  }, [user?.userId]);

  if (!user) return null;

  const paymentSchedule = useMemo(() => {
    if (!data) return [];
    const nextAmount = Number(data.next_payment?.amount) || 0;
    const totalOwed = Number(data.total_owed_year) || 0;
    let remainingBalance = totalOwed;
    return Array.from({ length: 8 }, (_, index) => {
      const installment = Math.max(nextAmount - index * Math.max(nextAmount * 0.12, 10), nextAmount * 0.4);
      remainingBalance = Math.max(remainingBalance - installment, 0);
      return {
        label: `Week ${index + 1}`,
        payment: Math.round(installment),
        balance: Math.round(remainingBalance),
      };
    });
  }, [data]);

  const savingsGrowth = useMemo(() => {
    if (!data) return [];
    const annualSavings = Number(data.savings_vs_bank_year) || 0;
    const monthlySavings = annualSavings / 12;
    return Array.from({ length: 6 }, (_, index) => ({
      label: `Month ${index + 1}`,
      savings: Math.round(monthlySavings * (index + 1)),
    }));
  }, [data]);

  const paymentChartConfig = {
    payment: { label: 'Projected payment', color: 'hsl(217.2 91.2% 59.8%)' },
    balance: { label: 'Remaining balance', color: 'hsl(142.1 70.6% 45.3%)' },
  };

  const savingsChartConfig = {
    savings: { label: 'Savings vs bank', color: 'hsl(25.5 95% 53.5%)' },
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Borrower dashboard</h1>
          <p className="text-muted-foreground">
            Track repayments, savings impact, and stay connected with lenders.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Dashboard home
          </Button>
          <Button onClick={() => navigate('/dashboard/lender')}>Switch to lending</Button>
        </div>
      </div>

      <Tabs value="borrower" className="w-full">
        <TabsList className="w-full justify-start gap-2 rounded-2xl bg-muted p-1">
          <TabsTrigger value="borrower" className="flex-1">
            Borrowing
          </TabsTrigger>
          <TabsTrigger value="lender" className="flex-1" onClick={() => navigate('/dashboard/lender')}>
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
                <CardTitle>Next payment</CardTitle>
                <CardDescription>{data.next_payment.due_in_weeks} week(s) away</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">${data.next_payment.amount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total owed</CardTitle>
                <CardDescription>Over the next 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">${data.total_owed_year}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Savings vs bank</CardTitle>
                <CardDescription>Estimated annual savings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">${data.savings_vs_bank_year}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Repayment progress</CardTitle>
                <CardDescription>First payment covers about</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">
                  {Math.min(
                    100,
                    Math.round((data.next_payment.amount / Math.max(data.total_owed_year, 1)) * 100),
                  )}
                  %
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>Payment outlook</CardTitle>
                <CardDescription>Projected weekly payments and remaining balance</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ChartContainer config={paymentChartConfig} className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={paymentSchedule}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={12} />
                      <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                      <Area
                        type="monotone"
                        dataKey="payment"
                        stroke="var(--color-payment)"
                        fill="var(--color-payment)"
                        fillOpacity={0.2}
                        name={paymentChartConfig.payment.label}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="var(--color-balance)"
                        fill="var(--color-balance)"
                        fillOpacity={0.1}
                        name={paymentChartConfig.balance.label}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>Savings growth</CardTitle>
                <CardDescription>Comparison against traditional banking fees</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ChartContainer config={savingsChartConfig} className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={savingsGrowth}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={12} />
                      <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                      <Area
                        type="monotone"
                        dataKey="savings"
                        stroke="var(--color-savings)"
                        fill="var(--color-savings)"
                        fillOpacity={0.2}
                        name={savingsChartConfig.savings.label}
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
