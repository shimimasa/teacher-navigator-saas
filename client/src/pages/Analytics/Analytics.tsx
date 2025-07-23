import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  People,
  Assignment,
  School,
  Description,
  TrendingUp,
  Download,
  Assessment,
} from '@mui/icons-material';
import { startOfMonth, endOfMonth } from 'date-fns';
import StatCard from '../../components/Analytics/StatCard';
import ChartCard from '../../components/Analytics/ChartCard';
import DateRangePicker from '../../components/Analytics/DateRangePicker';
import ReportGenerator from '../../components/Analytics/ReportGenerator';
import analyticsService from '../../services/analytics';
import { useAuth } from '../../contexts/AuthContext';
import {
  AnalyticsSummary,
  AnalyticsTimeRange,
  AnalyticsFilter,
  ChartData,
  CHART_COLORS,
} from '../../types/analytics';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    period: 'month',
  });
  const [filter, setFilter] = useState<AnalyticsFilter>({
    timeRange,
    userType: 'all',
  });
  const [reportGeneratorOpen, setReportGeneratorOpen] = useState(false);
  
  // データ状態
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [userActivityData, setUserActivityData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [diagnosisData, setDiagnosisData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [styleUsageData, setStyleUsageData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [templateData, setTemplateData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    setFilter(prev => ({ ...prev, timeRange }));
  }, [timeRange]);

  useEffect(() => {
    loadAnalyticsData();
  }, [filter]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // サマリー情報取得
      const summaryData = await analyticsService.getAnalyticsSummary(filter);
      setSummary(summaryData);
      
      // ユーザーアクティビティ
      const userActivity = await analyticsService.getUserActivity(filter);
      setUserActivityData({
        labels: userActivity.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [
          {
            label: 'アクティブユーザー',
            data: userActivity.map(d => d.activeUsers),
            borderColor: CHART_COLORS.primary,
            backgroundColor: CHART_COLORS.background,
            tension: 0.4,
          },
          {
            label: '新規ユーザー',
            data: userActivity.map(d => d.newUsers),
            borderColor: CHART_COLORS.secondary,
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            tension: 0.4,
          },
        ],
      });
      
      // 診断統計
      const diagnosisStats = await analyticsService.getDiagnosisStatistics(filter);
      setDiagnosisData({
        labels: diagnosisStats.personalityTypeDistribution.map(d => d.type),
        datasets: [{
          label: 'パーソナリティタイプ分布',
          data: diagnosisStats.personalityTypeDistribution.map(d => d.count),
          backgroundColor: [
            CHART_COLORS.primary,
            CHART_COLORS.secondary,
            CHART_COLORS.tertiary,
            CHART_COLORS.quaternary,
            CHART_COLORS.quinary,
            CHART_COLORS.senary,
          ],
        }],
      });
      
      // 授業スタイル使用状況
      const styleUsage = await analyticsService.getTeachingStyleUsage(filter);
      setStyleUsageData({
        labels: styleUsage.slice(0, 10).map(s => s.styleName),
        datasets: [{
          label: '使用回数',
          data: styleUsage.slice(0, 10).map(s => s.usageCount),
          backgroundColor: CHART_COLORS.primary,
        }],
      });
      
      // テンプレート統計
      const templateStats = await analyticsService.getTemplateStatistics(filter);
      setTemplateData({
        labels: templateStats.templatesByType.map(t => t.type),
        datasets: [{
          label: 'テンプレート数',
          data: templateStats.templatesByType.map(t => t.count),
          backgroundColor: [
            CHART_COLORS.primary,
            CHART_COLORS.secondary,
            CHART_COLORS.tertiary,
          ],
        }],
      });
      
      setError('');
    } catch (err) {
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    setReportGeneratorOpen(true);
  };

  if (loading && !summary) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* ヘッダー */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            分析ダッシュボード
          </Typography>
          <Typography variant="body1" color="text.secondary">
            教員ナビゲーターの利用状況と効果を分析します
          </Typography>
        </Box>

        {/* フィルターバー */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <DateRangePicker
              value={timeRange}
              onChange={setTimeRange}
            />
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>ユーザータイプ</InputLabel>
              <Select
                value={filter.userType || 'all'}
                onChange={(e) => setFilter({ ...filter, userType: e.target.value as any })}
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value="active">アクティブ</MenuItem>
                <MenuItem value="new">新規</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ flexGrow: 1 }} />
            
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleGenerateReport}
            >
              レポート生成
            </Button>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* タブ */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, value) => setTabValue(value)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="概要" icon={<Assessment />} iconPosition="start" />
            <Tab label="ユーザー" icon={<People />} iconPosition="start" />
            <Tab label="診断" icon={<Assignment />} iconPosition="start" />
            <Tab label="授業スタイル" icon={<School />} iconPosition="start" />
            <Tab label="テンプレート" icon={<Description />} iconPosition="start" />
          </Tabs>
        </Paper>

        {/* 概要タブ */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* 統計カード */}
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="総ユーザー数"
                value={summary?.totalUsers || 0}
                unit="人"
                change={12.5}
                icon={<People />}
                color="primary"
                tooltip="登録済みの全ユーザー数"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="アクティブユーザー"
                value={summary?.activeUsers || 0}
                unit="人"
                change={8.3}
                icon={<TrendingUp />}
                color="success"
                tooltip="過去30日間にログインしたユーザー"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="診断完了数"
                value={summary?.completedDiagnoses || 0}
                unit="件"
                change={15.2}
                icon={<Assignment />}
                color="secondary"
                tooltip="完了した診断の総数"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="テンプレート数"
                value={summary?.totalTemplates || 0}
                unit="個"
                change={20.1}
                icon={<Description />}
                color="warning"
                tooltip="作成されたテンプレートの総数"
              />
            </Grid>

            {/* グラフ */}
            <Grid item xs={12} md={8}>
              <ChartCard
                title="ユーザーアクティビティ"
                subtitle="日別のアクティブユーザー数と新規ユーザー数"
                type="line"
                data={userActivityData}
                loading={loading}
                height={350}
                onRefresh={loadAnalyticsData}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <ChartCard
                title="パーソナリティタイプ分布"
                subtitle="診断結果の分布"
                type="doughnut"
                data={diagnosisData}
                loading={loading}
                height={350}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="平均効果性"
                value={summary?.averageEffectiveness || 0}
                format="percentage"
                change={5.2}
                icon={<TrendingUp />}
                color="info"
                tooltip="授業スタイルの平均効果性評価"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="平均満足度"
                value={summary?.averageSatisfaction || 0}
                format="percentage"
                change={3.8}
                icon={<TrendingUp />}
                color="success"
                tooltip="システム全体の平均満足度"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="公開テンプレート"
                value={summary?.publicTemplates || 0}
                unit="個"
                icon={<Description />}
                color="primary"
                tooltip="共有されている公開テンプレート数"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="診断完了率"
                value={
                  summary?.totalDiagnoses
                    ? (summary.completedDiagnoses / summary.totalDiagnoses * 100)
                    : 0
                }
                format="percentage"
                icon={<Assignment />}
                color="secondary"
                tooltip="開始された診断のうち完了した割合"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* ユーザータブ */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ChartCard
                title="ユーザー増加推移"
                subtitle="期間中のユーザー数の変化"
                type="line"
                data={userActivityData}
                loading={loading}
                height={400}
                onRefresh={loadAnalyticsData}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* 診断タブ */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ChartCard
                title="パーソナリティタイプ分布"
                type="pie"
                data={diagnosisData}
                loading={loading}
                height={400}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  診断統計
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    診断完了率
                  </Typography>
                  <Typography variant="h4" gutterBottom>
                    {summary?.totalDiagnoses
                      ? `${(summary.completedDiagnoses / summary.totalDiagnoses * 100).toFixed(1)}%`
                      : '0%'}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* 授業スタイルタブ */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ChartCard
                title="人気の授業スタイル TOP10"
                subtitle="使用回数の多い授業スタイル"
                type="bar"
                data={styleUsageData}
                loading={loading}
                height={400}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* テンプレートタブ */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ChartCard
                title="テンプレートタイプ別分布"
                type="doughnut"
                data={templateData}
                loading={loading}
                height={350}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  テンプレート利用状況
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        総テンプレート数
                      </Typography>
                      <Typography variant="h5">
                        {summary?.totalTemplates || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        公開テンプレート
                      </Typography>
                      <Typography variant="h5">
                        {summary?.publicTemplates || 0}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* レポート生成ダイアログ */}
        <ReportGenerator
          open={reportGeneratorOpen}
          onClose={() => setReportGeneratorOpen(false)}
          onGenerate={(reportId) => {
            // レポート生成後の処理
            console.log('Report generated:', reportId);
          }}
        />
      </Box>
    </Container>
  );
};

export default Analytics;