import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Grid,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  School,
  Assignment,
  EmojiEvents,
  Timeline,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { GrowthMetrics } from '../../types/analytics';
import { CHART_COLORS } from '../../types/analytics';

interface PersonalGrowthChartProps {
  userName: string;
  metrics: GrowthMetrics[];
  summary: {
    totalDiagnoses: number;
    totalTemplates: number;
    averageEffectiveness: number;
    improvementRate: number;
    achievements: string[];
  };
  loading?: boolean;
}

const PersonalGrowthChart: React.FC<PersonalGrowthChartProps> = ({
  userName,
  metrics,
  summary,
  loading = false,
}) => {
  const theme = useTheme();

  const chartData = {
    labels: metrics.map(m => m.period),
    datasets: [
      {
        label: '効果性',
        data: metrics.map(m => m.effectiveness),
        borderColor: CHART_COLORS.primary,
        backgroundColor: CHART_COLORS.background,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: '満足度',
        data: metrics.map(m => m.satisfaction),
        borderColor: CHART_COLORS.secondary,
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: '成長率',
        data: metrics.map(m => m.growth),
        borderColor: CHART_COLORS.tertiary,
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        borderDash: [5, 5],
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label === '成長率') {
              return `${label}: ${value.toFixed(1)}%`;
            }
            return `${label}: ${value.toFixed(1)}`;
          },
        },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '効果性・満足度',
        },
        min: 0,
        max: 5,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: '成長率 (%)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const getImprovementColor = (rate: number) => {
    if (rate >= 20) return 'success';
    if (rate >= 10) return 'primary';
    if (rate >= 0) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            読み込み中...
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
            {userName.charAt(0)}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">
              {userName}の成長レポート
            </Typography>
            <Typography variant="body2" color="text.secondary">
              個人の成長と改善の推移
            </Typography>
          </Box>
          <Timeline color="primary" fontSize="large" />
        </Box>

        {/* サマリー統計 */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Assignment color="primary" />
              <Typography variant="h5">{summary.totalDiagnoses}</Typography>
              <Typography variant="caption" color="text.secondary">
                診断実施
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <School color="secondary" />
              <Typography variant="h5">{summary.totalTemplates}</Typography>
              <Typography variant="caption" color="text.secondary">
                テンプレート作成
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <TrendingUp color="success" />
              <Typography variant="h5">
                {summary.averageEffectiveness.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                平均効果性
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                <Chip
                  label={`${summary.improvementRate.toFixed(1)}%`}
                  color={getImprovementColor(summary.improvementRate)}
                  size="small"
                />
              </Box>
              <Typography variant="caption" color="text.secondary" display="block">
                改善率
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* 成長グラフ */}
        <Box sx={{ height: 300, mb: 3 }}>
          <Line data={chartData} options={chartOptions} />
        </Box>

        {/* 達成項目 */}
        {summary.achievements.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmojiEvents color="warning" />
              達成項目
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {summary.achievements.map((achievement, index) => (
                <Chip
                  key={index}
                  label={achievement}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* 改善指標 */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            改善の推移
          </Typography>
          {metrics.slice(-3).map((metric, index) => (
            <Box key={index} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">{metric.period}</Typography>
                <Typography variant="body2" color="text.secondary">
                  成長率: {metric.growth.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(metric.growth * 5, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    bgcolor: metric.growth >= 10 
                      ? 'success.main' 
                      : metric.growth >= 0 
                      ? 'warning.main' 
                      : 'error.main',
                  },
                }}
              />
            </Box>
          ))}
        </Box>

        {/* アドバイス */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
          <Typography variant="body2" color="primary.dark">
            💡 {summary.improvementRate >= 10 
              ? '素晴らしい成長を続けています！この調子で新しい授業スタイルにも挑戦してみましょう。'
              : '着実に改善が見られます。より多くのテンプレートを活用して、授業の幅を広げていきましょう。'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PersonalGrowthChart;