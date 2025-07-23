import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Pagination,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Badge,
  Drawer,
  useMediaQuery,
  useTheme,
  Fab,
} from '@mui/material';
import {
  ViewModule,
  ViewList,
  CompareArrows,
  FilterList,
  TrendingUp,
  History,
  Add,
} from '@mui/icons-material';
import StyleCard from '../../components/TeachingStyle/StyleCard';
import StyleFilters from '../../components/TeachingStyle/StyleFilters';
import teachingStyleService from '../../services/teachingStyle';
import {
  TeachingStyle,
  TeachingStyleFilter,
  PaginatedTeachingStyles,
} from '../../types/teachingStyle';

const TeachingStyles: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 状態管理
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [styles, setStyles] = useState<TeachingStyle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [filters, setFilters] = useState<TeachingStyleFilter>({});

  const itemsPerPage = viewMode === 'grid' ? 9 : 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // URLパラメータから初期フィルターを設定
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const personalityType = params.get('personalityType');
    const diagnosisId = params.get('diagnosisId');

    if (personalityType) {
      setFilters(prev => ({
        ...prev,
        personalityTypes: [personalityType],
      }));
    }

    // 診断IDがある場合は推奨スタイルを読み込む
    if (diagnosisId) {
      loadRecommendedStyles(diagnosisId);
    } else {
      loadStyles();
    }
  }, [location.search]);

  // スタイル一覧の読み込み
  const loadStyles = async () => {
    try {
      setLoading(true);
      const data: PaginatedTeachingStyles = await teachingStyleService.getTeachingStyles(
        page,
        itemsPerPage,
        filters
      );
      setStyles(data.styles);
      setTotalCount(data.total);
      setError('');
    } catch (err) {
      setError('授業スタイルの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 推奨スタイルの読み込み
  const loadRecommendedStyles = async (diagnosisId: string) => {
    try {
      setLoading(true);
      const data = await teachingStyleService.getRecommendedStyles(diagnosisId);
      setStyles(data);
      setTotalCount(data.length);
      setError('');
    } catch (err) {
      setError('推奨スタイルの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // フィルター変更時の処理
  useEffect(() => {
    setPage(1);
    loadStyles();
  }, [filters]);

  // ページ変更時の処理
  useEffect(() => {
    loadStyles();
  }, [page]);

  // 比較モードの切り替え
  const handleCompareModeToggle = () => {
    if (compareMode && selectedForCompare.length > 1) {
      // 比較画面へ遷移
      const ids = selectedForCompare.join(',');
      navigate(`/styles/compare?ids=${ids}`);
    } else {
      setCompareMode(!compareMode);
      setSelectedForCompare([]);
    }
  };

  // 比較対象の選択
  const handleCompareSelect = (styleId: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(styleId)) {
        return prev.filter(id => id !== styleId);
      } else if (prev.length < 3) {
        return [...prev, styleId];
      }
      return prev;
    });
  };

  // フィルターのクリア
  const handleClearFilters = () => {
    setFilters({});
  };

  // 新規スタイル作成
  const handleCreateStyle = () => {
    navigate('/styles/new');
  };

  if (loading && styles.length === 0) {
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
            授業スタイル
          </Typography>
          <Typography variant="body1" color="text.secondary">
            あなたに最適な授業スタイルを見つけて、効果的な指導を実現しましょう
          </Typography>
        </Box>

        {/* クイックアクション */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<TrendingUp />}
            onClick={() => navigate('/styles/popular')}
          >
            人気のスタイル
          </Button>
          <Button
            variant="outlined"
            startIcon={<History />}
            onClick={() => navigate('/styles/recent')}
          >
            最近使用したスタイル
          </Button>
        </Box>

        {/* ツールバー */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            {/* 左側：表示モード切り替え */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, value) => value && setViewMode(value)}
                size="small"
              >
                <ToggleButton value="grid">
                  <ViewModule />
                </ToggleButton>
                <ToggleButton value="list">
                  <ViewList />
                </ToggleButton>
              </ToggleButtonGroup>

              {!isMobile && (
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  フィルター
                </Button>
              )}
            </Box>

            {/* 右側：比較モード */}
            <Box>
              <Badge badgeContent={selectedForCompare.length} color="primary">
                <Button
                  variant={compareMode ? "contained" : "outlined"}
                  startIcon={<CompareArrows />}
                  onClick={handleCompareModeToggle}
                  disabled={compareMode && selectedForCompare.length < 2}
                >
                  {compareMode
                    ? selectedForCompare.length >= 2
                      ? '比較する'
                      : `比較 (${selectedForCompare.length}/3)`
                    : '比較モード'
                  }
                </Button>
              </Badge>
            </Box>
          </Box>
        </Paper>

        {/* エラー表示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* メインコンテンツ */}
        <Grid container spacing={3}>
          {/* フィルターサイドバー */}
          {showFilters && (
            <Grid item xs={12} md={3}>
              <StyleFilters
                filters={filters}
                onFilterChange={setFilters}
                onClearFilters={handleClearFilters}
              />
            </Grid>
          )}

          {/* スタイル一覧 */}
          <Grid item xs={12} md={showFilters ? 9 : 12}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : styles.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  該当するスタイルが見つかりません
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  フィルターを調整してもう一度お試しください
                </Typography>
                <Button variant="contained" onClick={handleClearFilters}>
                  フィルターをクリア
                </Button>
              </Paper>
            ) : (
              <>
                <Grid container spacing={2}>
                  {styles.map((style) => (
                    <Grid
                      item
                      xs={12}
                      sm={viewMode === 'grid' ? 6 : 12}
                      md={viewMode === 'grid' ? 4 : 12}
                      key={style.id}
                    >
                      <StyleCard
                        style={style}
                        onCompare={handleCompareSelect}
                        isCompareMode={compareMode}
                        isSelected={selectedForCompare.includes(style.id)}
                      />
                    </Grid>
                  ))}
                </Grid>

                {/* ページネーション */}
                {totalPages > 1 && (
                  <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(_, value) => setPage(value)}
                      color="primary"
                      size={isMobile ? 'small' : 'medium'}
                    />
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>

        {/* モバイル用フィルターボタン */}
        {isMobile && (
          <Fab
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
            }}
            onClick={() => setShowFilters(true)}
          >
            <FilterList />
          </Fab>
        )}

        {/* モバイル用フィルタードロワー */}
        <Drawer
          anchor="right"
          open={isMobile && showFilters}
          onClose={() => setShowFilters(false)}
        >
          <Box sx={{ width: 300, p: 2 }}>
            <StyleFilters
              filters={filters}
              onFilterChange={setFilters}
              onClearFilters={handleClearFilters}
            />
          </Box>
        </Drawer>
      </Box>
    </Container>
  );
};

export default TeachingStyles;