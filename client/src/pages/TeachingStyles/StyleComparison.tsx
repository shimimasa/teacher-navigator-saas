import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Radar,
} from '@mui/material';
import {
  ArrowBack,
  Close,
  Add,
  CheckCircle,
  Cancel,
  School,
  Timer,
  Groups,
  Computer,
  Assessment,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Radar as RadarChart } from 'react-chartjs-2';
import teachingStyleService from '../../services/teachingStyle';
import {
  TeachingStyle,
  TEACHING_STYLE_CATEGORIES,
  TECHNOLOGY_USE_OPTIONS,
} from '../../types/teachingStyle';

// Chart.js の設定
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartTooltip,
  Legend
);

const StyleComparison: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [styles, setStyles] = useState<TeachingStyle[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ids = params.get('ids')?.split(',') || [];
    
    if (ids.length > 0) {
      loadStyles(ids);
    } else {
      setError('比較するスタイルが選択されていません');
      setLoading(false);
    }
  }, [location.search]);

  const loadStyles = async (ids: string[]) => {
    try {
      setLoading(true);
      const promises = ids.map(id => teachingStyleService.getTeachingStyleById(id));
      const data = await Promise.all(promises);
      setStyles(data);
      setError('');
    } catch (err) {
      setError('スタイル情報の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const removeStyle = (styleId: string) => {
    const newStyles = styles.filter(s => s.id !== styleId);
    if (newStyles.length === 0) {
      navigate('/styles');
    } else {
      const ids = newStyles.map(s => s.id).join(',');
      navigate(`/styles/compare?ids=${ids}`);
    }
  };

  const addMoreStyles = () => {
    const currentIds = styles.map(s => s.id).join(',');
    navigate(`/styles?compareMode=true&selected=${currentIds}`);
  };

  // レーダーチャート用のデータ準備
  const prepareRadarData = () => {
    const labels = ['計画・準備', '説明・講義', '活動・実践', '評価・振り返り'];
    
    const datasets = styles.map((style, index) => {
      const colors = ['rgba(59, 130, 246, 0.6)', 'rgba(239, 68, 68, 0.6)', 'rgba(34, 197, 94, 0.6)'];
      const borderColors = ['rgb(59, 130, 246)', 'rgb(239, 68, 68)', 'rgb(34, 197, 94)'];
      
      return {
        label: style.displayName,
        data: [
          style.timeManagement.planning,
          style.timeManagement.instruction,
          style.timeManagement.activities,
          style.timeManagement.assessment,
        ],
        backgroundColor: colors[index % colors.length],
        borderColor: borderColors[index % borderColors.length],
        borderWidth: 2,
      };
    });

    return { labels, datasets };
  };

  const radarOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.parsed.r}%`;
          },
        },
      },
    },
    scales: {
      r: {
        angleLines: {
          display: true,
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20,
        },
      },
    },
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/styles')}>
            スタイル一覧へ戻る
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* ヘッダー */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/styles')}
            sx={{ mb: 2 }}
          >
            スタイル一覧に戻る
          </Button>
          
          <Typography variant="h4" component="h1" gutterBottom>
            授業スタイル比較
          </Typography>
          <Typography variant="body1" color="text.secondary">
            選択したスタイルの特徴を比較して、最適なものを見つけましょう
          </Typography>
        </Box>

        {/* 選択中のスタイル */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1">
              比較中のスタイル（{styles.length}/3）:
            </Typography>
            {styles.map((style) => (
              <Chip
                key={style.id}
                label={style.displayName}
                onDelete={() => removeStyle(style.id)}
                color="primary"
                variant="outlined"
              />
            ))}
            {styles.length < 3 && (
              <Button
                size="small"
                startIcon={<Add />}
                onClick={addMoreStyles}
              >
                追加
              </Button>
            )}
          </Box>
        </Paper>

        {/* 基本情報比較表 */}
        <Paper elevation={2} sx={{ mb: 4, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                    項目
                  </TableCell>
                  {styles.map((style) => (
                    <TableCell key={style.id} align="center" sx={{ bgcolor: 'grey.100' }}>
                      <Box>
                        <Typography variant="subtitle2">{style.displayName}</Typography>
                        <Chip
                          label={TEACHING_STYLE_CATEGORIES[style.category].label}
                          size="small"
                          sx={{
                            mt: 1,
                            backgroundColor: TEACHING_STYLE_CATEGORIES[style.category].color,
                            color: 'white',
                          }}
                        />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {/* 説明 */}
                <TableRow>
                  <TableCell component="th" scope="row">
                    <School sx={{ mr: 1, verticalAlign: 'middle' }} />
                    説明
                  </TableCell>
                  {styles.map((style) => (
                    <TableCell key={style.id}>
                      <Typography variant="body2">{style.description}</Typography>
                    </TableCell>
                  ))}
                </TableRow>

                {/* テクノロジー使用 */}
                <TableRow>
                  <TableCell component="th" scope="row">
                    <Computer sx={{ mr: 1, verticalAlign: 'middle' }} />
                    テクノロジー使用
                  </TableCell>
                  {styles.map((style) => {
                    const techInfo = TECHNOLOGY_USE_OPTIONS.find(t => t.value === style.technologyUse);
                    return (
                      <TableCell key={style.id} align="center">
                        <Chip
                          label={techInfo?.label || style.technologyUse}
                          size="small"
                          color={style.technologyUse === 'extensive' ? 'secondary' : 'default'}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>

                {/* 評価 */}
                <TableRow>
                  <TableCell component="th" scope="row">
                    <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                    評価
                  </TableCell>
                  {styles.map((style) => (
                    <TableCell key={style.id} align="center">
                      {style.rating ? (
                        <Box>
                          <Typography variant="h6" color="primary">
                            {style.rating.toFixed(1)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            / 5.0
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          未評価
                        </Typography>
                      )}
                    </TableCell>
                  ))}
                </TableRow>

                {/* 利用者数 */}
                <TableRow>
                  <TableCell component="th" scope="row">
                    <Groups sx={{ mr: 1, verticalAlign: 'middle' }} />
                    利用者数
                  </TableCell>
                  {styles.map((style) => (
                    <TableCell key={style.id} align="center">
                      <Typography variant="body2">
                        {style.usageCount || 0}人
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* レーダーチャート */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <Timer sx={{ mr: 1, verticalAlign: 'middle' }} />
                時間配分の比較
              </Typography>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RadarChart data={prepareRadarData()} options={radarOptions} />
              </Box>
            </Paper>
          </Grid>

          {/* 生徒参加形態の比較 */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <Groups sx={{ mr: 1, verticalAlign: 'middle' }} />
                生徒参加形態の比較
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>形態</TableCell>
                      {styles.map((style) => (
                        <TableCell key={style.id} align="center">
                          {style.displayName}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>積極的参加</TableCell>
                      {styles.map((style) => (
                        <TableCell key={style.id} align="center">
                          {style.studentEngagement.activeParticipation}%
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell>グループワーク</TableCell>
                      {styles.map((style) => (
                        <TableCell key={style.id} align="center">
                          {style.studentEngagement.groupWork}%
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell>個人作業</TableCell>
                      {styles.map((style) => (
                        <TableCell key={style.id} align="center">
                          {style.studentEngagement.individualWork}%
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell>ディスカッション</TableCell>
                      {styles.map((style) => (
                        <TableCell key={style.id} align="center">
                          {style.studentEngagement.discussion}%
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* 特徴比較 */}
        <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            特徴の比較
          </Typography>
          <Grid container spacing={2}>
            {styles.map((style) => (
              <Grid item xs={12} md={4} key={style.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom color="primary">
                      {style.displayName}
                    </Typography>
                    {style.characteristics.map((char, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CheckCircle color="success" fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2">{char}</Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* 強みと課題の比較 */}
        <Grid container spacing={3} sx={{ mt: 0 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="success.main">
                強みの比較
              </Typography>
              <Grid container spacing={2}>
                {styles.map((style) => (
                  <Grid item xs={12} key={style.id}>
                    <Typography variant="subtitle2" gutterBottom>
                      {style.displayName}
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {style.strengths.slice(0, 3).map((strength, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                          • {strength}
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="error.main">
                課題の比較
              </Typography>
              <Grid container spacing={2}>
                {styles.map((style) => (
                  <Grid item xs={12} key={style.id}>
                    <Typography variant="subtitle2" gutterBottom>
                      {style.displayName}
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {style.challenges.slice(0, 3).map((challenge, index) => (
                        <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                          • {challenge}
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* アクション */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            比較結果を参考に、あなたに最適なスタイルを選んでください
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {styles.map((style) => (
              <Button
                key={style.id}
                variant="contained"
                onClick={() => navigate(`/templates/new?styleId=${style.id}`)}
              >
                {style.displayName}でテンプレート作成
              </Button>
            ))}
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default StyleComparison;