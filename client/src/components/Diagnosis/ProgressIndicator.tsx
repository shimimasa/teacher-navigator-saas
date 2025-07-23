import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Paper,
  Grid,
  Chip,
} from '@mui/material';
import { DIAGNOSIS_CATEGORIES } from '../../types/diagnosis';

interface ProgressIndicatorProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions: number;
  categoryProgress: {
    extroversion: number;
    sensing: number;
    thinking: number;
    judging: number;
  };
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentQuestion,
  totalQuestions,
  answeredQuestions,
  categoryProgress,
}) => {
  const overallProgress = (answeredQuestions / totalQuestions) * 100;

  const getCategoryLabel = (category: keyof typeof categoryProgress, value: number) => {
    const total = 10; // 各カテゴリー10問と仮定
    return `${value}/${total}`;
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6">
            診断の進捗
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {answeredQuestions} / {totalQuestions} 問回答済み
          </Typography>
        </Box>
        
        <LinearProgress
          variant="determinate"
          value={overallProgress}
          sx={{ height: 8, borderRadius: 4 }}
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {Math.round(overallProgress)}% 完了
        </Typography>
      </Box>

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          カテゴリー別進捗
        </Typography>
        
        <Grid container spacing={2}>
          {(Object.keys(categoryProgress) as Array<keyof typeof categoryProgress>).map((category) => {
            const categoryInfo = DIAGNOSIS_CATEGORIES[category];
            const progress = categoryProgress[category];
            const progressPercentage = (progress / 10) * 100; // 各カテゴリー10問と仮定
            
            return (
              <Grid item xs={6} sm={3} key={category}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {categoryInfo.name}
                  </Typography>
                  
                  <Box sx={{ position: 'relative', display: 'inline-flex', mt: 1 }}>
                    <CircularProgressWithLabel
                      value={progressPercentage}
                      size={60}
                      thickness={4}
                    />
                  </Box>
                  
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    {getCategoryLabel(category, progress)}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {answeredQuestions >= 20 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Chip
            label="最小回答数クリア"
            color="success"
            size="small"
          />
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
            診断結果を表示できる最小回答数に達しました
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

// 円形プログレスバーコンポーネント
interface CircularProgressWithLabelProps {
  value: number;
  size?: number;
  thickness?: number;
}

const CircularProgressWithLabel: React.FC<CircularProgressWithLabelProps> = ({
  value,
  size = 40,
  thickness = 4,
}) => {
  const normalizedValue = Math.min(100, Math.max(0, value));
  const circumference = 2 * Math.PI * ((size - thickness) / 2);
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <svg width={size} height={size}>
        {/* 背景の円 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - thickness) / 2}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={thickness}
        />
        {/* プログレスの円 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size - thickness) / 2}
          fill="none"
          stroke="#3498db"
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dashoffset 0.3s ease-in-out',
          }}
        />
      </svg>
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" component="div" color="text.secondary">
          {`${Math.round(normalizedValue)}%`}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProgressIndicator;