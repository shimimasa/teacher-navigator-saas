import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add,
  Download,
  Visibility,
  MoreVert,
  Search,
  FilterList,
  Delete,
  Share,
  CalendarToday,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import ReportGenerator from '../../components/Analytics/ReportGenerator';
import ReportPreview from '../../components/Analytics/ReportPreview';
import analyticsService from '../../services/analytics';
import { Report, REPORT_TYPES } from '../../types/analytics';

const Reports: React.FC = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  
  // フィルター
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // ページネーション
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // ダイアログ
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchQuery, typeFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getReports();
      setReports(data);
      setError('');
    } catch (err) {
      setError('レポートの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];
    
    // 検索フィルター
    if (searchQuery) {
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // タイプフィルター
    if (typeFilter !== 'all') {
      filtered = filtered.filter(report => report.type === typeFilter);
    }
    
    setFilteredReports(filtered);
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, reportId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedReportId(reportId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReportId(null);
  };

  const handleDownload = async (reportId: string) => {
    try {
      const blob = await analyticsService.downloadReport(reportId);
      const report = reports.find(r => r.id === reportId);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report?.title || 'report'}.${report?.format || 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('レポートのダウンロードに失敗しました', err);
    }
  };

  const handlePreview = (report: Report) => {
    setSelectedReport(report);
    setPreviewOpen(true);
    handleMenuClose();
  };

  const handleDelete = async (reportId: string) => {
    if (window.confirm('このレポートを削除してもよろしいですか？')) {
      try {
        // 削除API呼び出し（実装が必要）
        console.log('Delete report:', reportId);
        loadReports();
      } catch (err) {
        console.error('レポートの削除に失敗しました', err);
      }
    }
    handleMenuClose();
  };

  const getReportTypeLabel = (type: string) => {
    const reportType = REPORT_TYPES.find(t => t.value === type);
    return reportType?.label || type;
  };

  const getReportTypeColor = (type: string): any => {
    switch (type) {
      case 'summary':
        return 'primary';
      case 'detailed':
        return 'secondary';
      case 'growth':
        return 'success';
      case 'usage':
        return 'info';
      default:
        return 'default';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return '📄';
      case 'excel':
        return '📊';
      case 'csv':
        return '📑';
      default:
        return '📄';
    }
  };

  if (loading && reports.length === 0) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              レポート管理
            </Typography>
            <Typography variant="body1" color="text.secondary">
              生成されたレポートの閲覧とダウンロード
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setGeneratorOpen(true)}
          >
            新規レポート生成
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* フィルターバー */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="レポートを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>レポートタイプ</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">すべて</MenuItem>
                {REPORT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* レポート一覧 */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>タイトル</TableCell>
                <TableCell>タイプ</TableCell>
                <TableCell>期間</TableCell>
                <TableCell>形式</TableCell>
                <TableCell>生成日</TableCell>
                <TableCell align="right">アクション</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      レポートがありません
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body1">
                            {report.title}
                          </Typography>
                          {report.description && (
                            <Typography variant="caption" color="text.secondary">
                              {report.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getReportTypeLabel(report.type)}
                          color={getReportTypeColor(report.type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2">
                            {format(new Date(report.timeRange.startDate), 'yyyy/MM/dd', { locale: ja })}
                            {' - '}
                            {format(new Date(report.timeRange.endDate), 'yyyy/MM/dd', { locale: ja })}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getFormatIcon(report.format)} {report.format.toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(report.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleDownload(report.id)}
                        >
                          <Download />
                        </IconButton>
                        <IconButton
                          onClick={() => handlePreview(report)}
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, report.id)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredReports.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="表示件数:"
          />
        </TableContainer>

        {/* コンテキストメニュー */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleDownload(selectedReportId!)}>
            <Download fontSize="small" sx={{ mr: 1 }} />
            ダウンロード
          </MenuItem>
          <MenuItem onClick={() => {
            const report = reports.find(r => r.id === selectedReportId);
            if (report) handlePreview(report);
          }}>
            <Visibility fontSize="small" sx={{ mr: 1 }} />
            プレビュー
          </MenuItem>
          <MenuItem>
            <Share fontSize="small" sx={{ mr: 1 }} />
            共有
          </MenuItem>
          <MenuItem
            onClick={() => handleDelete(selectedReportId!)}
            sx={{ color: 'error.main' }}
          >
            <Delete fontSize="small" sx={{ mr: 1 }} />
            削除
          </MenuItem>
        </Menu>

        {/* レポート生成ダイアログ */}
        <ReportGenerator
          open={generatorOpen}
          onClose={() => setGeneratorOpen(false)}
          onGenerate={(reportId) => {
            loadReports();
          }}
        />

        {/* レポートプレビューダイアログ */}
        <ReportPreview
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          report={selectedReport}
          data={selectedReport?.data}
        />
      </Box>
    </Container>
  );
};

export default Reports;