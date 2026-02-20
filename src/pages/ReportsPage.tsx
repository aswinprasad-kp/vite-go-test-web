import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, Col, Row, Spin, Statistic, Typography } from 'antd';
import { useReportsSummary } from '../hooks/useReports';

const { Title } = Typography;

const STATUS_COLORS: Record<string, string> = {
  draft: '#94a3b8',
  pending: '#3b82f6',
  approved: '#22c55e',
  rejected: '#ef4444',
  disbursed: '#10b981',
};

const CATEGORY_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#64748b'];

const DONUT_ACTIVE_OFFSET = 8;

export default function ReportsPage() {
  const { summary, isLoading, error } = useReportsSummary();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[240px]">
        <Spin size="large" tip="Loading SpendLens..." />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
        Failed to load SpendLens. You may not have permission to view reports.
      </div>
    );
  }

  const statusData = Object.entries(summary.statusCounts).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count,
    fill: STATUS_COLORS[name] ?? '#94a3b8',
  }));

  const totalClaimsForCategory = Object.values(summary.categoryCounts).reduce((a, b) => a + b, 0);
  const categoryData = Object.entries(summary.categoryCounts).map(([name, count], i) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: count,
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    percentage: totalClaimsForCategory > 0 ? (count / totalClaimsForCategory) * 100 : 0,
  }));

  const totalSpendData = summary.totalAmount >= 0 ? [{ name: 'Total Spend', value: 1, fill: '#3b82f6' }] : [];

  return (
    <div className="w-full">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <Title level={4} className="!mb-1">
          SpendLens
        </Title>
        <p className="text-sm text-slate-500">
          Summary of expense claims (based on your access: own claims or for-review list).
        </p>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total claims" value={summary.totalClaims} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={18}>
          <Card title="Total Spend (donut)">
            {totalSpendData.length === 0 ? (
              <p className="text-slate-500 py-8 text-center">No spend data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={totalSpendData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={96}
                    paddingAngle={0}
                    activeShape={(props: unknown) => {
                      const p = props as { outerRadius?: number; [k: string]: unknown };
                      return <Sector {...p} outerRadius={(p.outerRadius ?? 96) + DONUT_ACTIVE_OFFSET} />;
                    }}
                  >
                    <Cell fill="#3b82f6" />
                  </Pie>
                  <Tooltip
                    content={({ payload }) =>
                      payload?.[0] ? (
                        <div className="rounded bg-white px-3 py-2 shadow border border-slate-200 text-sm min-w-[180px]">
                          <div className="font-medium">Total Spend</div>
                          <div className="text-slate-600">${summary.totalAmount.toFixed(2)}</div>
                          <div className="mt-2 pt-2 border-t border-slate-100 font-medium text-green-700">
                            Amount reimbursed till now
                          </div>
                          <div className="text-slate-600">${(summary.totalReimbursedAmount ?? 0).toFixed(2)}</div>
                        </div>
                      ) : null
                    }
                  />
                  <text x="50%" y="40%" textAnchor="middle" dominantBaseline="middle" className="text-lg font-semibold fill-slate-700">
                    ${summary.totalAmount.toFixed(2)}
                  </text>
                  <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="text-xs fill-slate-500">
                    Total Spend
                  </text>
                  <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="text-xs font-medium fill-green-700">
                    Reimbursed: ${(summary.totalReimbursedAmount ?? 0).toFixed(2)}
                  </text>
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Claims by status" className="h-full">
            {statusData.length === 0 ? (
              <p className="text-slate-500 py-8 text-center">No claims data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={statusData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Claims by category">
            {categoryData.length === 0 ? (
              <p className="text-slate-500 py-8 text-center">No claims data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={1}
                    activeShape={(props: unknown) => {
                      const p = props as { outerRadius?: number; [k: string]: unknown };
                      return <Sector {...p} outerRadius={(p.outerRadius ?? 90) + DONUT_ACTIVE_OFFSET} />;
                    }}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0] || !payload[0].payload) return null;
                      const p = payload[0].payload as { name: string; value: number; percentage?: number };
                      const pct = p.percentage != null ? p.percentage.toFixed(1) : (totalClaimsForCategory ? ((p.value / totalClaimsForCategory) * 100).toFixed(1) : '0');
                      return (
                        <div className="rounded bg-white px-3 py-2 shadow border border-slate-200 text-sm">
                          <div className="font-medium">{p.name}</div>
                          <div>
                            {p.value} claim{p.value !== 1 ? 's' : ''} <span className="text-slate-500">({pct}% of 360° / {pct}% of total)</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
