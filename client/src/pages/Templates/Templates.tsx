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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tabs,
  Tab,
  Fab,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  ViewModule,
  ViewList,
  TrendingUp,
  History,
  Public,
  Lock,
  Person,
} from '@mui/icons-material';
import TemplateCard from '../../components/Template/TemplateCard';
import templateService from '../../services/template';
import { useAuth } from '../../contexts/AuthContext';
import {
  Template,
  TemplateFilter,
  PaginatedTemplates,
  TEMPLATE_TYPES,
  TEMPLATE_SUBJECTS,
  TEMPLATE_GRADE_LEVELS,
  POPULAR_TAGS,
} from '../../types/template';

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // 状態管理
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState<TemplateFilter>({
    search: '',
    type: [],
    subject: [],
    gradeLevel: [],
    tags: [],
  });
  const [likedTemplates, setLikedTemplates] = useState<Set<string>>(new Set());

  const itemsPerPage = viewMode === 'grid' ? 9 : 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // URLパラメータから初期値を設定
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const styleId = params.get('styleId');
    const diagnosisId = params.get('diagnosisId');

    if (styleId) {
      setFilters(prev => ({ ...prev, teachingStyleId: styleId }));
    }
  }, [location.search]);

  // タブに応じたフィルター設定
  useEffect(() => {
    const baseFilters = { ...filters };
    
    switch (tabValue) {
      case 0: // すべて
        delete baseFilters.isPublic;
        delete baseFilters.userId;
        break;
      case 1: // 公開テンプレート
        baseFilters.isPublic = true;
        baseFilters.isTemplate = true;
        delete baseFilters.userId;
        break;
      case 2: // マイテンプレート
        if (user) {
          baseFilters.userId = user.id;
        }
        delete baseFilters.isPublic;
        break;
    }
    
    setFilters(baseFilters);
    setPage(1);
  }, [tabValue, user]);

  // テンプレート一覧の読み込み
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data: PaginatedTemplates = await templateService.getTemplates(
        page,
        itemsPerPage,
        filters
      );
      setTemplates(data.templates);
      setTotalCount(data.total);
      setError('');
    } catch (err) {
      setError('テンプレートの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // フィルター変更時の処理
  useEffect(() => {
    loadTemplates();
  }, [page, filters]);

  // いいね処理
  const handleLike = async (templateId: string) => {
    try {
      if (likedTemplates.has(templateId)) {
        await templateService.unlikeTemplate(templateId);
        setLikedTemplates(prev => {
          const newSet = new Set(prev);
          newSet.delete(templateId);
          return newSet;
        });
      } else {
        await templateService.likeTemplate(templateId);
        setLikedTemplates(prev => new Set(prev).add(templateId));
      }
      // テンプレートのいいね数を更新
      loadTemplates();
    } catch (err) {
      console.error('いいねの処理に失敗しました', err);
    }
  };

  // テンプレート操作
  const handleEdit = (id: string) => {
    navigate(`/templates/edit/${id}`);
  };

  const handleCopy = async (id: string) => {
    try {
      const newTemplate = await templateService.copyTemplate(id);
      navigate(`/templates/edit/${newTemplate.id}`);
    } catch (err) {
      console.error('テンプレートのコピーに失敗しました', err);
    }
  };

  const handleShare = (id: string) => {
    navigate(`/templates/${id}/share`);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('このテンプレートを削除してもよろしいですか？')) {
      try {
        await templateService.deleteTemplate(id);
        loadTemplates();
      } catch (err) {
        console.error('テンプレートの削除に失敗しました', err);
      }
    }
  };

  // フィルター変更ハンドラー
  const handleFilterChange = (filterType: keyof TemplateFilter, value: any) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setPage(1);
  };

  // タグトグル
  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    handleFilterChange('tags', newTags);
  };

  if (loading && templates.length === 0) {
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
            テンプレート
          </Typography>
          <Typography variant="body1" color="text.secondary">
            授業計画、ワークシート、評価基準のテンプレートを活用して、効率的な授業準備を
          </Typography>
        </Box>

        {/* クイックアクション */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/templates/new')}
          >
            新規作成
          </Button>
          <Button
            variant="outlined"
            startIcon={<TrendingUp />}
            onClick={() => navigate('/templates/popular')}
          >
            人気のテンプレート
          </Button>
          <Button
            variant="outlined"
            startIcon={<History />}
            onClick={() => navigate('/templates/recent')}
          >
            最近使用した
          </Button>
        </Box>

        {/* タブ */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, value) => setTabValue(value)}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="すべて" />
            <Tab label="公開テンプレート" icon={<Public />} iconPosition="start" />
            <Tab label="マイテンプレート" icon={<Person />} iconPosition="start" />
          </Tabs>
        </Paper>

        {/* フィルターセクション */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            {/* 検索バー */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="テンプレートを検索..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* タイプフィルター */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>タイプ</InputLabel>
                <Select
                  multiple
                  value={filters.type || []}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip key={value} label={TEMPLATE_TYPES[value as keyof typeof TEMPLATE_TYPES].label} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {Object.entries(TEMPLATE_TYPES).map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                      {value.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* 教科フィルター */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>教科</InputLabel>
                <Select
                  multiple
                  value={filters.subject || []}
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const subject = TEMPLATE_SUBJECTS.find(s => s.value === value);
                        return <Chip key={value} label={subject?.label || value} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {TEMPLATE_SUBJECTS.map((subject) => (
                    <MenuItem key={subject.value} value={subject.value}>
                      {subject.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* 学年フィルター */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>学年</InputLabel>
                <Select
                  multiple
                  value={filters.gradeLevel || []}
                  onChange={(e) => handleFilterChange('gradeLevel', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const grade = TEMPLATE_GRADE_LEVELS.find(g => g.value === value);
                        return <Chip key={value} label={grade?.label || value} size="small" />;
                      })}
                    </Box>
                  )}
                >
                  {TEMPLATE_GRADE_LEVELS.map((grade) => (
                    <MenuItem key={grade.value} value={grade.value}>
                      {grade.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* 表示モード */}
            <Grid item xs={12} sm={6} md={2}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, value) => value && setViewMode(value)}
                size="small"
                fullWidth
              >
                <ToggleButton value="grid">
                  <ViewModule />
                </ToggleButton>
                <ToggleButton value="list">
                  <ViewList />
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>

          {/* 人気のタグ */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              人気のタグ:
            </Typography>
            {POPULAR_TAGS.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                onClick={() => handleTagToggle(tag)}
                color={filters.tags?.includes(tag) ? 'primary' : 'default'}
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
          </Box>
        </Paper>

        {/* エラー表示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* テンプレート一覧 */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : templates.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              テンプレートが見つかりません
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {tabValue === 2 
                ? 'まだテンプレートを作成していません' 
                : 'フィルターを調整してもう一度お試しください'}
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => navigate('/templates/new')}
            >
              テンプレートを作成
            </Button>
          </Paper>
        ) : (
          <>
            <Grid container spacing={2}>
              {templates.map((template) => (
                <Grid
                  item
                  xs={12}
                  sm={viewMode === 'grid' ? 6 : 12}
                  md={viewMode === 'grid' ? 4 : 12}
                  key={template.id}
                >
                  <TemplateCard
                    template={template}
                    onEdit={handleEdit}
                    onCopy={handleCopy}
                    onShare={handleShare}
                    onDelete={handleDelete}
                    onLike={handleLike}
                    isLiked={likedTemplates.has(template.id)}
                    isOwner={user?.id === template.userId}
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
                />
              </Box>
            )}
          </>
        )}

        {/* FAB */}
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={() => navigate('/templates/new')}
        >
          <Add />
        </Fab>
      </Box>
    </Container>
  );
};

export default Templates;