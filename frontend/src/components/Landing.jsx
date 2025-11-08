import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const features = [
  {
    title: 'Community-backed capital',
    copy: 'Neighbors pool funds so borrowers skip predatory rates and keep savings local.',
  },
  {
    title: 'Transparent risk gauge',
    copy: 'Every request gets a score + advice before matching with lenders.',
  },
  {
    title: 'Shareable impact',
    copy: 'Opt in to the feed and show how fair lending cycles money through Princeton.',
  },
];

const stats = [
  { label: 'Community rates', value: '0%–5%' },
  { label: 'Scan to pre-check', value: 'Minutes' },
  { label: 'Data stays local', value: '100%' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:flex-row">
      <Card className="flex-1 bg-gradient-to-br from-white/90 via-card/90 to-amber-50/80 backdrop-blur">
        <CardHeader className="space-y-4">
          <Badge className="w-max" variant="outline">
            Hyper-local beta
          </Badge>
          <CardTitle className="text-4xl leading-tight">
            SumbiD / LendLocal
            <span className="block rounded-full bg-amber-200 px-3 py-1 text-2xl font-semibold text-foreground">
              Fair lending, neighbor to neighbor.
            </span>
          </CardTitle>
          <p className="text-lg text-muted-foreground">
            Borrow safely, lend with confidence, and keep wealth circulating inside the Princeton
            loop—no sharks, no surprise terms.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate('/scan-id')}>
              Get Started
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/feed')}>
              See community feed
            </Button>
          </div>
          <div className="grid gap-4 rounded-3xl border-2 border-dashed border-border bg-white/70 p-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 bg-card/90">
        <CardHeader>
          <CardTitle className="text-2xl">Why people sign up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {features.map((item) => (
            <div key={item.title} className="flex gap-4 rounded-2xl border-2 border-border bg-white/70 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border text-lg">
                ✳︎
              </div>
              <div>
                <p className="text-lg font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.copy}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
