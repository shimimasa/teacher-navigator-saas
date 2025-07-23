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
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Avatar,
  Rating,
} from '@mui/material';
import {
  Description,
  Assignment,
  Grading,
  AccessTime,
  School,
  Grade,
  Person,
  MoreVert,
  Edit,
  ContentCopy,
  Share,
  Delete,
  Download,
  FavoriteBorder,
  Favorite,
  Public,
  Lock,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Template,
  TEMPLATE_TYPES,
  TEMPLATE_SUBJECTS,
  TEMPLATE_GRADE_LEVELS,
} from '../../types/template';

interface TemplateCardProps {
  template: Template;
  onEdit?: (id: string) => void;
  onCopy?: (id: string) => void;
  onShare?: (id: string) => void;
  onDelete?: (id: string) => void;
  onLike?: (id: string) => void;
  isLiked?: boolean;
  showActions?: boolean;
  isOwner?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onEdit,
  onCopy,
  onShare,
  onDelete,
  onLike,
  isLiked = false,
  showActions = true,
  isOwner = false,
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetail = () => {
    navigate(`/templates/${template.id}`);
  };

  const getTypeIcon = () => {
    switch (template.type) {
      case 'lesson_plan':
        return <Description />;
      case 'worksheet':
        return <Assignment />;
      case 'assessment':
        return <Grading />;
      default:
        return <Description />;
    }
  };

  const typeInfo = TEMPLATE_TYPES[template.type];
  const subjectInfo = TEMPLATE_SUBJECTS.find(s => s.value === template.subject);
  const gradeLevelInfo = TEMPLATE_GRADE_LEVELS.find(g => g.value === template.gradeLevel);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
      onClick={handleViewDetail}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getTypeIcon()}
            <Typography variant="h6" component="h3" sx={{ fontSize: '1.1rem' }}>
              {template.title}
            </Typography>
          </Box>
          {showActions && (
            <IconButton
              size="small"
              onClick={handleMenuOpen}
            >
              <MoreVert />
            </IconButton>
          )}
        </Box>

        {/* タイプとプライバシー */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
          <Chip
            icon={getTypeIcon()}
            label={typeInfo.label}
            size="small"
            sx={{
              backgroundColor: typeInfo.color,
              color: 'white',
              '& .MuiChip-icon': {
                color: 'white',
              },
            }}
          />
          {template.isPublic ? (
            <Tooltip title="公開">
              <Public fontSize="small" color="action" />
            </Tooltip>
          ) : (
            <Tooltip title="非公開">
              <Lock fontSize="small" color="action" />
            </Tooltip>
          )}
        </Box>

        {/* 説明 */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.5em',
          }}
        >
          {template.description}
        </Typography>

        {/* メタ情報 */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Chip
            icon={<School />}
            label={subjectInfo?.label || template.subject}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<Grade />}
            label={gradeLevelInfo?.label || template.gradeLevel}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<AccessTime />}
            label={`${template.duration}分`}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* タグ */}
        {template.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {template.tags.slice(0, 3).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            ))}
            {template.tags.length > 3 && (
              <Chip
                label={`+${template.tags.length - 3}`}
                size="small"
                color="primary"
                sx={{ fontSize: '0.75rem' }}
              />
            )}
          </Box>
        )}

        {/* 作成者と日時 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 24, height: 24 }}>
              <Person fontSize="small" />
            </Avatar>
            <Typography variant="caption" color="text.secondary">
              {template.userName || '匿名'}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {formatDistanceToNow(new Date(template.updatedAt), {
              addSuffix: true,
              locale: ja,
            })}
          </Typography>
        </Box>
      </CardContent>

      {/* 統計情報 */}
      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onLike?.(template.id);
              }}
            >
              {isLiked ? <Favorite color="error" /> : <FavoriteBorder />}
            </IconButton>
            <Typography variant="caption">
              {template.likes || 0}
            </Typography>
          </Box>
          
          {template.rating && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Rating
                value={template.rating}
                readOnly
                size="small"
                precision={0.5}
              />
              <Typography variant="caption">
                ({template.ratingCount || 0})
              </Typography>
            </Box>
          )}
          
          <Box sx={{ flexGrow: 1 }} />
          
          {template.downloads !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Download fontSize="small" />
              <Typography variant="caption">
                {template.downloads}
              </Typography>
            </Box>
          )}
        </Box>
      </CardActions>

      {/* メニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        {isOwner && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onEdit?.(template.id);
            }}
          >
            <Edit fontSize="small" sx={{ mr: 1 }} />
            編集
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            handleMenuClose();
            onCopy?.(template.id);
          }}
        >
          <ContentCopy fontSize="small" sx={{ mr: 1 }} />
          コピー
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            onShare?.(template.id);
          }}
        >
          <Share fontSize="small" sx={{ mr: 1 }} />
          共有
        </MenuItem>
        {isOwner && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onDelete?.(template.id);
            }}
            sx={{ color: 'error.main' }}
          >
            <Delete fontSize="small" sx={{ mr: 1 }} />
            削除
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};

export default TemplateCard;