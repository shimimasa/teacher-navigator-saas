import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  LinearProgress,
  useTheme,
} from '@mui/material';
import { DIAGNOSIS_CATEGORIES } from '../../types/diagnosis';

interface ScoreChartProps {
  scores: {
    extroversion: number;
    sensing: number;
    thinking: number;
    judging: number;
  };
}

interface ScoreBarProps {
  label: string;
  score: number;
  leftLabel: string;
  rightLabel: string;
  description: string;
}

const ScoreBar: React.FC<ScoreBarProps> = ({
  label,
  score,
  leftLabel,
  rightLabel,
  description,
}) => {
  const theme = useTheme();
  const isHighScore = score >= 60;
  
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        {label}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
      
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: !isHighScore ? 'bold' : 'normal',
              color: !isHighScore ? theme.palette.primary.main : 'text.secondary',
            }}
          >
            {leftLabel}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: isHighScore ? 'bold' : 'normal',
              color: isHighScore ? theme.palette.primary.main : 'text.secondary',
            }}
          >
            {rightLabel}
          </Typography>
        </Box>
        
        <Box sx={{ position: 'relative', height: 40 }}>
          {/* 背景のグラデーション */}
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              background: `linear-gradient(to right, ${theme.palette.grey[200]}, ${theme.palette.grey[200]} 50%, ${theme.palette.primary.light} 50%, ${theme.palette.primary.light})`,
              borderRadius: 1,
              overflow: 'hidden',
            }}
          />
          
          {/* スコアインジケーター */}
          <Box
            sx={{
              position: 'absolute',
              left: `${score}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 20,
              height: 20,
              bgcolor: theme.palette.primary.main,
              borderRadius: '50%',
              border: '3px solid white',
              boxShadow: 2,
              zIndex: 1,
            }}
          />
          
          {/* 中央線 */}
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: 2,
              bgcolor: 'divider',
              transform: 'translateX(-50%)',
            }}
          />
          
          {/* スコア表示 */}
          <Box
            sx={{
              position: 'absolute',
              left: `${score}%`,
              top: -25,
              transform: 'translateX(-50%)',
              bgcolor: theme.palette.primary.main,
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
              fontWeight: 'bold',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: `4px solid ${theme.palette.primary.main}`,
              },
            }}
          >
            {score}%
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const ScoreChart: React.FC<ScoreChartProps> = ({ scores }) => {
  const theme = useTheme();
  
  const chartData = [
    {
      key: 'extroversion' as const,
      score: scores.extroversion,
      ...DIAGNOSIS_CATEGORIES.extroversion,
    },
    {
      key: 'sensing' as const,
      score: scores.sensing,
      ...DIAGNOSIS_CATEGORIES.sensing,
    },
    {
      key: 'thinking' as const,
      score: scores.thinking,
      ...DIAGNOSIS_CATEGORIES.thinking,
    },
    {
      key: 'judging' as const,
      score: scores.judging,
      ...DIAGNOSIS_CATEGORIES.judging,
    },
  ];

  // レーダーチャート用のデータ変換
  const radarData = chartData.map(item => ({
    axis: item.name,
    value: item.score,
  }));

  return (
    <Card elevation={3}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          詳細スコア分析
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          {chartData.map((item) => (
            <ScoreBar
              key={item.key}
              label={item.name}
              score={item.score}
              leftLabel={item.lowLabel}
              rightLabel={item.highLabel}
              description={item.description}
            />
          ))}
        </Box>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            スコアの見方
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                • 60%以上：その特性が強く表れています
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 40-60%：バランス型です
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                • 40%未満：反対の特性が強く表れています
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 中央値（50%）に近いほど柔軟性があります
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ScoreChart;