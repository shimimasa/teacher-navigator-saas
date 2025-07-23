import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  MoreVert,
  Download,
  Fullscreen,
  Refresh,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { ChartData } from '../../types/analytics';

// Chart.js の登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartCardProps {
  title: string;
  subtitle?: string;
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: ChartData;
  loading?: boolean;
  height?: number;
  onRefresh?: () => void;
  onDownload?: () => void;
  onFullscreen?: () => void;
  options?: any;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  type,
  data,
  loading = false,
  height = 300,
  onRefresh,
  onDownload,
  onFullscreen,
  options: customOptions,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
        padding: 10,
        cornerRadius: 4,
      },
    },
    scales: type === 'line' || type === 'bar' ? {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          borderDash: [2, 2],
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    } : undefined,
  };

  const chartOptions = customOptions || defaultOptions;

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={data} options={chartOptions} />;
      case 'bar':
        return <Bar data={data} options={chartOptions} />;
      case 'pie':
        return <Pie data={data} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut data={data} options={chartOptions} />;
      default:
        return null;
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={title}
        subheader={subtitle}
        action={
          <>
            <IconButton onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              {onRefresh && (
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    onRefresh();
                  }}
                >
                  <Refresh fontSize="small" sx={{ mr: 1 }} />
                  更新
                </MenuItem>
              )}
              {onDownload && (
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    onDownload();
                  }}
                >
                  <Download fontSize="small" sx={{ mr: 1 }} />
                  ダウンロード
                </MenuItem>
              )}
              {onFullscreen && (
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    onFullscreen();
                  }}
                >
                  <Fullscreen fontSize="small" sx={{ mr: 1 }} />
                  全画面表示
                </MenuItem>
              )}
            </Menu>
          </>
        }
      />
      <CardContent sx={{ flexGrow: 1, position: 'relative', p: 2 }}>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: height,
            }}
          >
            <CircularProgress />
          </Box>
        ) : data.datasets.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: height,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              データがありません
            </Typography>
          </Box>
        ) : (
          <Box sx={{ height: height }}>
            {renderChart()}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartCard;