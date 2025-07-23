import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Psychology,
  School,
  Description,
  Analytics,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: <Psychology fontSize="large" />,
      title: 'パーソナリティ診断',
      description: '教育に特化したパーソナリティ診断で、あなたの強みと特性を発見します。',
      action: () => navigate('/diagnosis'),
      buttonText: '診断を始める',
    },
    {
      icon: <School fontSize="large" />,
      title: '授業スタイル提案',
      description: '診断結果に基づいて、最適な授業スタイルを提案します。',
      action: () => navigate('/styles'),
      buttonText: 'スタイルを見る',
    },
    {
      icon: <Description fontSize="large" />,
      title: 'テンプレート生成',
      description: 'すぐに使える授業計画、ワークシート、評価基準を自動生成します。',
      action: () => navigate('/templates'),
      buttonText: 'テンプレートを作成',
    },
    {
      icon: <Analytics fontSize="large" />,
      title: '成長分析',
      description: '診断結果の推移や教材の使用状況を分析し、成長を可視化します。',
      action: () => navigate('/analytics'),
      buttonText: '分析を見る',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          教員ナビゲーター診断SaaS
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" paragraph>
          あなたのパーソナリティに最適な授業スタイルを発見し、
          効果的な教育を実現しましょう
        </Typography>

        {!user && (
          <Box sx={{ mt: 4, mb: 6, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ mr: 2 }}
            >
              無料で始める
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
            >
              ログイン
            </Button>
          </Box>
        )}

        <Grid container spacing={4} sx={{ mt: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography gutterBottom variant="h5" component="h2" align="center">
                    {feature.title}
                  </Typography>
                  <Typography align="center" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button
                    size="small"
                    onClick={feature.action}
                    disabled={!user && index > 0}
                  >
                    {feature.buttonText}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 8, p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h4" gutterBottom align="center">
            使い方
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Typography variant="h6" gutterBottom>
                1. 診断を受ける
              </Typography>
              <Typography color="text.secondary">
                40問の質問に答えて、あなたの教育スタイルを分析します。
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="h6" gutterBottom>
                2. スタイルを確認
              </Typography>
              <Typography color="text.secondary">
                診断結果から、最適な授業スタイルが提案されます。
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="h6" gutterBottom>
                3. テンプレート生成
              </Typography>
              <Typography color="text.secondary">
                選んだスタイルに基づいて、教材を自動生成します。
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="h6" gutterBottom>
                4. 実践と改善
              </Typography>
              <Typography color="text.secondary">
                生成された教材を使い、フィードバックで改善します。
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default Home;