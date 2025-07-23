import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Close,
  Download,
  Print,
  Share,
} from '@mui/icons-material';
import { Report, AnalyticsSummary } from '../../types/analytics';
import StatCard from './StatCard';
import ChartCard from './ChartCard';

interface ReportPreviewProps {
  open: boolean;
  onClose: () => void;
  report: Report | null;
  data?: {
    summary?: AnalyticsSummary;
    charts?: any[];
    tables?: any[];
  };
}

const ReportPreview: React.FC<ReportPreviewProps> = ({
  open,
  onClose,
  report,
  data,
}) => {
  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    // 実際のダウンロード処理
    console.log('Download report:', report.id);
  };

  const handleShare = () => {
    // 共有処理
    console.log('Share report:', report.id);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
    >
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <Close />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            レポートプレビュー
          </Typography>
          <Button color="inherit" startIcon={<Share />} onClick={handleShare}>
            共有
          </Button>
          <Button color="inherit" startIcon={<Print />} onClick={handlePrint}>
            印刷
          </Button>
          <Button color="inherit" startIcon={<Download />} onClick={handleDownload}>
            ダウンロード
          </Button>
        </Toolbar>
      </AppBar>

      <DialogContent>
        <Box
          sx={{
            maxWidth: 1200,
            mx: 'auto',
            p: 3,
            '@media print': {
              p: 2,
            },
          }}
        >
          {/* レポートヘッダー */}
          <Paper elevation={0} sx={{ p: 4, mb: 3, textAlign: 'center' }}>
            <Typography variant="h3" gutterBottom>
              {report.title}
            </Typography>
            {report.description && (
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {report.description}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              期間: {formatDate(report.timeRange.startDate)} 〜 {formatDate(report.timeRange.endDate)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              生成日: {formatDate(report.createdAt)}
            </Typography>
          </Paper>

          <Divider sx={{ mb: 4 }} />

          {/* エグゼクティブサマリー */}
          {data?.summary && (
            <>
              <Typography variant="h4" gutterBottom>
                エグゼクティブサマリー
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="総ユーザー数"
                    value={data.summary.totalUsers}
                    unit="人"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="アクティブユーザー"
                    value={data.summary.activeUsers}
                    unit="人"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="診断完了数"
                    value={data.summary.completedDiagnoses}
                    unit="件"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <StatCard
                    title="テンプレート数"
                    value={data.summary.totalTemplates}
                    unit="個"
                  />
                </Grid>
              </Grid>
            </>
          )}

          {/* 詳細分析 */}
          <Typography variant="h4" gutterBottom>
            詳細分析
          </Typography>

          {/* グラフセクション */}
          {data?.charts && data.charts.length > 0 && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {data.charts.map((chart, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <ChartCard
                    title={chart.title}
                    subtitle={chart.subtitle}
                    type={chart.type}
                    data={chart.data}
                    height={300}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          {/* テーブルセクション */}
          {data?.tables && data.tables.length > 0 && (
            <>
              <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                詳細データ
              </Typography>
              {data.tables.map((table, index) => (
                <Box key={index} sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {table.title}
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {table.headers.map((header: string, idx: number) => (
                            <TableCell key={idx}>{header}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {table.rows.map((row: any[], rowIdx: number) => (
                          <TableRow key={rowIdx}>
                            {row.map((cell, cellIdx) => (
                              <TableCell key={cellIdx}>{cell}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))}
            </>
          )}

          {/* 推奨事項 */}
          <Paper sx={{ p: 3, mt: 4, bgcolor: 'primary.light' }}>
            <Typography variant="h5" gutterBottom>
              推奨事項
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                アクティブユーザー率を向上させるため、定期的なリマインダーメールの送信を検討してください
              </Typography>
              <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                人気の授業スタイルを基に、新しいテンプレートの作成を促進しましょう
              </Typography>
              <Typography component="li" variant="body1">
                診断完了率が高い時間帯に合わせて、サポート体制を強化することをお勧めします
              </Typography>
            </Box>
          </Paper>

          {/* フッター */}
          <Box sx={{ mt: 6, pt: 3, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              このレポートは教員ナビゲーターシステムによって自動生成されました
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ReportPreview;