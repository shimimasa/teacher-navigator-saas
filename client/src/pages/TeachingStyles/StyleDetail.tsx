import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  IconButton,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  School,
  CheckCircle,
  Warning,
  Timer,
  Groups,
  Computer,
  Assessment,
  Lightbulb,
  Book,
  Description,
  CompareArrows,
  ArrowBack,
  BookmarkBorder,
  Share,
} from '@mui/icons-material';
import StyleFeedback from '../../components/TeachingStyle/StyleFeedback';
import teachingStyleService from '../../services/teachingStyle';
import { useAuth } from '../../contexts/AuthContext';
import {
  TeachingStyle,
  TEACHING_STYLE_CATEGORIES,
  SUBJECT_OPTIONS,
  GRADE_LEVEL_OPTIONS,
} from '../../types/teachingStyle';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`style-tabpanel-${index}`}
      aria-labelledby={`style-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const StyleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [style, setStyle] = useState<TeachingStyle | null>(null);
  const [relatedStyles, setRelatedStyles] = useState<TeachingStyle[]>([]);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadStyleDetail();
    }
  }, [id]);

  const loadStyleDetail = async () => {
    try {
      setLoading(true);
      const data = await teachingStyleService.getTeachingStyleById(id!);
      setStyle(data);
      
      // 関連スタイルの読み込み（パーソナリティタイプベース）
      if (data.personalityTypes.length > 0) {
        const related = await teachingStyleService.getStylesByPersonalityType(
          data.personalityTypes[0]
        );
        setRelatedStyles(related.filter(s => s.id !== id).slice(0, 3));
      }
      
      setError('');
    } catch (err) {
      setError('スタイル情報の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (
    effectiveness: number,
    satisfaction: number,
    comment: string
  ) => {
    await teachingStyleService.submitFeedback(id!, effectiveness, satisfaction, comment);
    // フィードバックリストを再読み込み
    loadStyleDetail();
  };

  const handleCreateTemplate = () => {
    navigate(`/templates/new?styleId=${id}`);
  };

  const handleCompare = () => {
    navigate(`/styles/compare?ids=${id}`);
  };

  const categoryInfo = style ? TEACHING_STYLE_CATEGORIES[style.category] : null;

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !style) {
    return (
      <Container>
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'スタイルが見つかりません'}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/styles')}>
            スタイル一覧へ戻る
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
              navigate('/styles');
            }}
          >
            授業スタイル
          </Link>
          <Typography color="text.primary">{style.displayName}</Typography>
        </Breadcrumbs>

        {/* ヘッダー */}
        <Paper elevation={2} sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <School fontSize="large" color="primary" />
                <Typography variant="h4" component="h1">
                  {style.displayName}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  icon={<School />}
                  label={categoryInfo?.label}
                  sx={{
                    backgroundColor: categoryInfo?.color,
                    color: 'white',
                    '& .MuiChip-icon': {
                      color: 'white',
                    },
                  }}
                />
                {style.technologyUse === 'extensive' && (
                  <Chip
                    icon={<Computer />}
                    label="ICT活用"
                    color="secondary"
                  />
                )}
              </Box>
              
              <Typography variant="body1" color="text.secondary">
                {style.description}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton>
                <BookmarkBorder />
              </IconButton>
              <IconButton>
                <Share />
              </IconButton>
            </Box>
          </Box>

          {/* アクションボタン */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Description />}
              onClick={handleCreateTemplate}
            >
              テンプレート作成
            </Button>
            <Button
              variant="outlined"
              startIcon={<CompareArrows />}
              onClick={handleCompare}
            >
              他のスタイルと比較
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/styles')}
            >
              一覧へ戻る
            </Button>
          </Box>
        </Paper>

        {/* タブ */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, value) => setTabValue(value)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="概要" />
            <Tab label="実践方法" />
            <Tab label="評価・フィードバック" />
            <Tab label="関連資料" />
          </Tabs>
        </Paper>

        {/* タブコンテンツ */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* 特徴 */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  特徴
                </Typography>
                <List>
                  {style.characteristics.map((char, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircle color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={char} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* 強みと課題 */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  強みと課題
                </Typography>
                
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  強み
                </Typography>
                <List dense>
                  {style.strengths.map((strength, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Lightbulb color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={strength} />
                    </ListItem>
                  ))}
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" color="error" gutterBottom>
                  課題
                </Typography>
                <List dense>
                  {style.challenges.map((challenge, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Warning color="error" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={challenge} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* 時間配分 */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <Timer sx={{ mr: 1, verticalAlign: 'middle' }} />
                  時間配分の目安
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {Object.entries(style.timeManagement).map(([key, value]) => (
                    <Box key={key} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">
                          {key === 'planning' && '計画・準備'}
                          {key === 'instruction' && '説明・講義'}
                          {key === 'activities' && '活動・実践'}
                          {key === 'assessment' && '評価・振り返り'}
                        </Typography>
                        <Typography variant="body2" color="primary">
                          {value}%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: '100%',
                          height: 8,
                          bgcolor: 'grey.200',
                          borderRadius: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            width: `${value}%`,
                            height: '100%',
                            bgcolor: 'primary.main',
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>

            {/* 生徒の参加形態 */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <Groups sx={{ mr: 1, verticalAlign: 'middle' }} />
                  生徒の参加形態
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {Object.entries(style.studentEngagement).map(([key, value]) => (
                    <Box key={key} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">
                          {key === 'activeParticipation' && '積極的参加'}
                          {key === 'groupWork' && 'グループワーク'}
                          {key === 'individualWork' && '個人作業'}
                          {key === 'discussion' && 'ディスカッション'}
                        </Typography>
                        <Typography variant="body2" color="secondary">
                          {value}%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: '100%',
                          height: 8,
                          bgcolor: 'grey.200',
                          borderRadius: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            width: `${value}%`,
                            height: '100%',
                            bgcolor: 'secondary.main',
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>

            {/* 適用可能な教科・学年 */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  適用範囲
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      対象教科
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {style.subjects.map((subject) => {
                        const subjectInfo = SUBJECT_OPTIONS.find(s => s.value === subject);
                        return (
                          <Chip
                            key={subject}
                            icon={<Book />}
                            label={subjectInfo?.label || subject}
                            variant="outlined"
                          />
                        );
                      })}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      対象学年
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {style.gradeLevel.map((grade) => {
                        const gradeInfo = GRADE_LEVEL_OPTIONS.find(g => g.value === grade);
                        return (
                          <Chip
                            key={grade}
                            label={gradeInfo?.label || grade}
                            variant="outlined"
                            color="primary"
                          />
                        );
                      })}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {/* 指導方法 */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  指導方法
                </Typography>
                <List>
                  {style.teachingMethods.map((method, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <School color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={method} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* 評価方法 */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                  評価方法
                </Typography>
                <List>
                  {style.assessmentMethods.map((method, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={method} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* 教室環境 */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  教室環境の設定
                </Typography>
                <Typography variant="body1">
                  {style.classroomSetup}
                </Typography>
              </Paper>
            </Grid>

            {/* 実践例 */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  実践例
                </Typography>
                <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      例1: 中学校数学での活用
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      二次関数の単元で、グループごとに実世界の問題を設定し、
                      関数を使って解決策を提案する活動を実施。
                      各グループが発表し、相互評価を行うことで理解を深める。
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      例2: 小学校国語での活用
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      物語文の読解で、登場人物の心情を理解するために
                      ロールプレイを実施。グループで場面を演じることで、
                      文章の深い理解につなげる。
                    </Typography>
                  </CardContent>
                </Card>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <StyleFeedback
            styleId={id!}
            feedbacks={feedbacks}
            onSubmit={handleFeedbackSubmit}
            canSubmit={!!user}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              関連資料
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              このスタイルに関連する参考資料や研究論文
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <Description color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="アクティブラーニングの実践ガイド"
                  secondary="文部科学省（2020年）"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Description color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="協働学習の効果に関する研究"
                  secondary="教育心理学研究 第68巻（2020年）"
                />
              </ListItem>
            </List>
          </Paper>
        </TabPanel>

        {/* 関連スタイル */}
        {relatedStyles.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              関連する授業スタイル
            </Typography>
            <Grid container spacing={2}>
              {relatedStyles.map((relatedStyle) => (
                <Grid item xs={12} md={4} key={relatedStyle.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 3,
                      },
                    }}
                    onClick={() => navigate(`/styles/${relatedStyle.id}`)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {relatedStyle.displayName}
                      </Typography>
                      <Chip
                        label={TEACHING_STYLE_CATEGORIES[relatedStyle.category].label}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {relatedStyle.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default StyleDetail;