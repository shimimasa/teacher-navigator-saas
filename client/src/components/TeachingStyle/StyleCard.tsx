import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  Rating,
  Grid,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  School,
  Category,
  Computer,
  People,
  TrendingUp,
  Info,
  CompareArrows,
  Description,
} from '@mui/icons-material';
import {
  TeachingStyle,
  TEACHING_STYLE_CATEGORIES,
} from '../../types/teachingStyle';

interface StyleCardProps {
  style: TeachingStyle;
  onCompare?: (styleId: string) => void;
  isCompareMode?: boolean;
  isSelected?: boolean;
}

const StyleCard: React.FC<StyleCardProps> = ({
  style,
  onCompare,
  isCompareMode,
  isSelected,
}) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/styles/${style.id}`);
  };

  const handleCreateTemplate = () => {
    navigate(`/templates/new?styleId=${style.id}`);
  };

  const categoryInfo = TEACHING_STYLE_CATEGORIES[style.category];

  return (
    <Card
      elevation={isSelected ? 6 : 2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s',
        border: isSelected ? 2 : 0,
        borderColor: 'primary.main',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <School color="primary" />
            <Typography variant="h6" component="h3">
              {style.displayName}
            </Typography>
          </Box>
          <Tooltip title="詳細情報">
            <IconButton size="small" onClick={handleViewDetails}>
              <Info />
            </IconButton>
          </Tooltip>
        </Box>

        {/* カテゴリーチップ */}
        <Box sx={{ mb: 2 }}>
          <Chip
            icon={<Category />}
            label={categoryInfo.label}
            size="small"
            sx={{
              backgroundColor: categoryInfo.color,
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
              size="small"
              sx={{ ml: 1 }}
              color="secondary"
            />
          )}
        </Box>

        {/* 説明 */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {style.description}
        </Typography>

        {/* 特徴 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            主な特徴
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {style.characteristics.slice(0, 3).map((char, index) => (
              <Chip
                key={index}
                label={char}
                size="small"
                variant="outlined"
              />
            ))}
            {style.characteristics.length > 3 && (
              <Chip
                label={`+${style.characteristics.length - 3}`}
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
          </Box>
        </Box>

        {/* 統計情報 */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <People fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                利用者数: {style.usageCount || 0}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            {style.rating && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Rating
                  value={style.rating}
                  readOnly
                  size="small"
                  precision={0.5}
                />
                <Typography variant="caption" color="text.secondary">
                  ({style.rating})
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>

        {/* 効果性指標 */}
        {style.feedback && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <TrendingUp fontSize="small" color="success" />
              <Typography variant="caption">
                効果性: {style.feedback.effectiveness.toFixed(1)}/5
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <People fontSize="small" color="action" />
              <Typography variant="caption">
                {style.feedback.count}件の評価
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        {isCompareMode ? (
          <Button
            fullWidth
            variant={isSelected ? "contained" : "outlined"}
            onClick={() => onCompare?.(style.id)}
            startIcon={<CompareArrows />}
          >
            {isSelected ? '選択済み' : '比較に追加'}
          </Button>
        ) : (
          <>
            <Button
              size="small"
              onClick={handleViewDetails}
              startIcon={<Info />}
            >
              詳細
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleCreateTemplate}
              startIcon={<Description />}
            >
              テンプレート作成
            </Button>
          </>
        )}
      </CardActions>
    </Card>
  );
};

export default StyleCard;