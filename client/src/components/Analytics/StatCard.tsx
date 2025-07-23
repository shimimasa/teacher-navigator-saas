import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Info,
} from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: number | string;
  unit?: string;
  change?: number;
  changeLabel?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  format?: 'number' | 'percentage' | 'currency';
  tooltip?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit = '',
  change,
  changeLabel = '前期比',
  loading = false,
  icon,
  color = 'primary',
  format = 'number',
  tooltip,
}) => {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'currency':
        return `¥${val.toLocaleString()}`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    if (!change || change === 0) return <TrendingFlat />;
    return change > 0 ? <TrendingUp /> : <TrendingDown />;
  };

  const getTrendColor = () => {
    if (!change || change === 0) return 'text.secondary';
    return change > 0 ? 'success.main' : 'error.main';
  };

  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'visible',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon && (
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: `${color}.light`,
                  color: `${color}.dark`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {icon}
              </Box>
            )}
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          {tooltip && (
            <Tooltip title={tooltip}>
              <IconButton size="small">
                <Info fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 1 }}>
              <Typography
                variant="h4"
                component="div"
                sx={{
                  fontWeight: 'bold',
                  color: `${color}.main`,
                  display: 'inline',
                }}
              >
                {formatValue(value)}
              </Typography>
              {unit && (
                <Typography
                  variant="h6"
                  component="span"
                  sx={{
                    ml: 0.5,
                    color: 'text.secondary',
                  }}
                >
                  {unit}
                </Typography>
              )}
            </Box>

            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: getTrendColor(),
                  }}
                >
                  {getTrendIcon()}
                  <Typography variant="body2" fontWeight="medium">
                    {Math.abs(change).toFixed(1)}%
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {changeLabel}
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* 背景装飾 */}
        <Box
          sx={{
            position: 'absolute',
            right: -10,
            bottom: -10,
            opacity: 0.05,
            transform: 'rotate(-15deg)',
            fontSize: 100,
            color: `${color}.main`,
          }}
        >
          {icon}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;