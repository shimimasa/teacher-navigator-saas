import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  useTheme,
  Tooltip,
} from '@mui/material';
import { HeatmapData } from '../../types/analytics';

interface UsageHeatmapProps {
  data: HeatmapData[];
  title?: string;
  loading?: boolean;
}

const UsageHeatmap: React.FC<UsageHeatmapProps> = ({
  data,
  title = '使用状況ヒートマップ',
  loading = false,
}) => {
  const theme = useTheme();

  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // データを2次元配列に変換
  const heatmapMatrix = useMemo(() => {
    const matrix: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
    
    data.forEach(item => {
      if (item.day >= 0 && item.day < 7 && item.hour >= 0 && item.hour < 24) {
        matrix[item.day][item.hour] = item.value;
      }
    });
    
    return matrix;
  }, [data]);

  // 最大値を取得（色の正規化用）
  const maxValue = useMemo(() => {
    return Math.max(...data.map(item => item.value), 1);
  }, [data]);

  // 値に基づいて色を取得
  const getColor = (value: number): string => {
    if (value === 0) return theme.palette.grey[100];
    
    const intensity = value / maxValue;
    const baseColor = theme.palette.primary.main;
    
    // 色の強度を調整（0.1 ~ 1.0）
    const opacity = 0.1 + (intensity * 0.9);
    
    return `${baseColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  };

  const formatHour = (hour: number): string => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          読み込み中...
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: 800, position: 'relative' }}>
          {/* 時間ラベル（上部） */}
          <Box sx={{ display: 'flex', ml: 5, mb: 1 }}>
            {hours.map(hour => (
              <Box
                key={hour}
                sx={{
                  width: 30,
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                }}
              >
                {hour % 3 === 0 ? hour : ''}
              </Box>
            ))}
          </Box>

          {/* ヒートマップ本体 */}
          {days.map((day, dayIndex) => (
            <Box key={dayIndex} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              {/* 曜日ラベル */}
              <Box
                sx={{
                  width: 40,
                  pr: 1,
                  textAlign: 'right',
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                }}
              >
                {day}
              </Box>
              
              {/* ヒートマップセル */}
              {hours.map(hour => {
                const value = heatmapMatrix[dayIndex][hour];
                return (
                  <Tooltip
                    key={hour}
                    title={`${day}曜日 ${formatHour(hour)}: ${value}回`}
                    arrow
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: getColor(value),
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 0.5,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.2)',
                          boxShadow: 2,
                          zIndex: 1,
                        },
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          ))}

          {/* 凡例 */}
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              少ない
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {[0, 0.25, 0.5, 0.75, 1].map((intensity, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 20,
                    height: 20,
                    bgcolor: intensity === 0 
                      ? theme.palette.grey[100]
                      : `${theme.palette.primary.main}${Math.round((0.1 + intensity * 0.9) * 255).toString(16).padStart(2, '0')}`,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 0.5,
                  }}
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary">
              多い
            </Typography>
          </Box>

          {/* 説明 */}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            ※ 各セルは1時間単位での利用回数を表します
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default UsageHeatmap;