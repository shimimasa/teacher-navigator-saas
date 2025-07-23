import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Edit,
  Share,
  Download,
  Print,
  MoreVert,
  ContentCopy,
  Delete,
  Favorite,
  FavoriteBorder,
  School,
  AccessTime,
  Grade,
  Person,
  ArrowBack,
  Public,
  Lock,
} from '@mui/icons-material';
import TemplatePreview from '../../components/Template/TemplatePreview';
import ShareDialog from '../../components/Template/ShareDialog';
import templateService from '../../services/template';
import { useAuth } from '../../contexts/AuthContext';
import {
  Template,
  TEMPLATE_TYPES,
  TEMPLATE_SUBJECTS,
  TEMPLATE_GRADE_LEVELS,
} from '../../types/template';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

const TemplateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<Template | null>(null);
  const [relatedTemplates, setRelatedTemplates] = useState<Template[]>([]);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (id) {
      loadTemplate();
    }
  }, [id]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const data = await templateService.getTemplateById(id!);
      setTemplate(data);
      
      // 関連テンプレートを読み込む
      if (data.teachingStyleId) {
        const related = await templateService.getTemplates(1, 4, {
          teachingStyleId: data.teachingStyleId,
        });
        setRelatedTemplates(
          related.templates.filter(t => t.id !== id).slice(0, 3)
        );
      }
      
      setError('');
    } catch (err) {
      setError('テンプレートの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    navigate(`/templates/edit/${id}`);
  };

  const handleCopy = async () => {
    try {
      const newTemplate = await templateService.copyTemplate(id!);
      navigate(`/templates/edit/${newTemplate.id}`);
    } catch (err) {
      console.error('テンプレートのコピーに失敗しました', err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('このテンプレートを削除してもよろしいですか？')) {
      try {
        await templateService.deleteTemplate(id!);
        navigate('/templates');
      } catch (err) {
        console.error('テンプレートの削除に失敗しました', err);
      }
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await templateService.generatePDF(id!);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template?.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('PDF生成に失敗しました', err);
    }
  };

  const handleLike = async () => {
    try {
      if (isLiked) {
        await templateService.unlikeTemplate(id!);
        setIsLiked(false);
        if (template) {
          setTemplate({ ...template, likes: (template.likes || 1) - 1 });
        }
      } else {
        await templateService.likeTemplate(id!);
        setIsLiked(true);
        if (template) {
          setTemplate({ ...template, likes: (template.likes || 0) + 1 });
        }
      }
    } catch (err) {
      console.error('いいねの処理に失敗しました', err);
    }
  };

  const handleRatingSubmit = async () => {
    try {
      await templateService.rateTemplate(id!, userRating);
      setRatingDialogOpen(false);
      loadTemplate(); // 評価を再読み込み
    } catch (err) {
      console.error('評価の送信に失敗しました', err);
    }
  };

  const isOwner = user?.id === template?.userId;
  const typeInfo = template ? TEMPLATE_TYPES[template.type] : null;
  const subjectInfo = template ? TEMPLATE_SUBJECTS.find(s => s.value === template.subject) : null;
  const gradeLevelInfo = template ? TEMPLATE_GRADE_LEVELS.find(g => g.value === template.gradeLevel) : null;

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !template) {
    return (
      <Container>
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'テンプレートが見つかりません'}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/templates')}>
            テンプレート一覧へ戻る
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* パンくずリスト */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            ホーム
          </Link>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/templates');
            }}
          >
            テンプレート
          </Link>
          <Typography color="text.primary">{template.title}</Typography>
        </Breadcrumbs>

        <Grid container spacing={3}>
          {/* 左側：詳細情報 */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              {/* タイトルと基本情報 */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Chip
                    label={typeInfo?.label}
                    sx={{
                      backgroundColor: typeInfo?.color,
                      color: 'white',
                    }}
                  />
                  {template.isPublic ? (
                    <Public fontSize="small" color="action" />
                  ) : (
                    <Lock fontSize="small" color="action" />
                  )}
                </Box>
                
                <Typography variant="h5" gutterBottom>
                  {template.title}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>

                {/* 作成者情報 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    <Person fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="body2">
                      {template.userName || '匿名'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(template.updatedAt), {
                        addSuffix: true,
                        locale: ja,
                      })}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* メタ情報 */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <School fontSize="small" />
                  <Typography variant="body2">
                    教科: {subjectInfo?.label || template.subject}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Grade fontSize="small" />
                  <Typography variant="body2">
                    学年: {gradeLevelInfo?.label || template.gradeLevel}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTime fontSize="small" />
                  <Typography variant="body2">
                    授業時間: {template.duration}分
                  </Typography>
                </Box>
              </Box>

              {/* 統計情報 */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">{template.likes || 0}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      いいね
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">{template.downloads || 0}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      ダウンロード
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">
                      {template.rating ? template.rating.toFixed(1) : '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      評価
                    </Typography>
                  </Box>
                </Box>
                
                {template.rating && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Rating value={template.rating} readOnly precision={0.5} />
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({template.ratingCount || 0}件)
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* アクションボタン */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={handleDownloadPDF}
                  fullWidth
                >
                  PDFダウンロード
                </Button>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={isLiked ? <Favorite /> : <FavoriteBorder />}
                    onClick={handleLike}
                    fullWidth
                  >
                    いいね
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setRatingDialogOpen(true)}
                    fullWidth
                  >
                    評価
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {isOwner && (
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={handleEdit}
                      fullWidth
                    >
                      編集
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    startIcon={<ContentCopy />}
                    onClick={handleCopy}
                    fullWidth
                  >
                    コピー
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Share />}
                    onClick={() => setShareDialogOpen(true)}
                    fullWidth
                  >
                    共有
                  </Button>
                </Box>
                
                {isOwner && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={handleDelete}
                    fullWidth
                  >
                    削除
                  </Button>
                )}
              </Box>

              {/* タグ */}
              {template.tags.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    タグ
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {template.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>

            {/* 関連テンプレート */}
            {relatedTemplates.length > 0 && (
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  関連テンプレート
                </Typography>
                {relatedTemplates.map((related) => (
                  <Card
                    key={related.id}
                    sx={{
                      mb: 2,
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 2 },
                    }}
                    onClick={() => navigate(`/templates/${related.id}`)}
                  >
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        {related.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {related.description}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Paper>
            )}
          </Grid>

          {/* 右側：プレビュー */}
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ height: '100%', overflow: 'hidden' }}>
              <TemplatePreview
                template={template}
                showActions={false}
              />
            </Paper>
          </Grid>
        </Grid>

        {/* 共有ダイアログ */}
        <ShareDialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          templateId={template.id}
          templateTitle={template.title}
          currentSharedUsers={template.sharedWith}
          isPublic={template.isPublic}
        />

        {/* 評価ダイアログ */}
        <Dialog
          open={ratingDialogOpen}
          onClose={() => setRatingDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>テンプレートを評価</DialogTitle>
          <DialogContent>
            <Box sx={{ py: 2 }}>
              <Typography component="legend" gutterBottom>
                このテンプレートの評価
              </Typography>
              <Rating
                value={userRating}
                onChange={(_, value) => setUserRating(value || 0)}
                size="large"
              />
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="コメント（任意）"
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                sx={{ mt: 3 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRatingDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleRatingSubmit}
              variant="contained"
              disabled={userRating === 0}
            >
              評価を送信
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default TemplateDetail;