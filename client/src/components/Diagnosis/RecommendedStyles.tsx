import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Rating,
} from '@mui/material';
import {
  School,
  CheckCircle,
  ArrowForward,
  LocalOffer,
} from '@mui/icons-material';
import { RecommendedStyle } from '../../types/diagnosis';

interface RecommendedStylesProps {
  styles: RecommendedStyle[];
  diagnosisId: string;
}

const RecommendedStyles: React.FC<RecommendedStylesProps> = ({ styles, diagnosisId }) => {
  const navigate = useNavigate();

  const handleStyleClick = (styleId: string) => {
    navigate(`/styles/${styleId}?diagnosisId=${diagnosisId}`);
  };

  const handleCreateTemplate = (styleId: string) => {
    navigate(`/templates/new?styleId=${styleId}&diagnosisId=${diagnosisId}`);
  };

  return (
    <Card elevation={3}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            あなたに推奨される授業スタイル
          </Typography>
          <Typography variant="body2" color="text.secondary">
            診断結果に基づいて、最適な授業スタイルを提案します
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {styles.map((style, index) => (
            <Grid item xs={12} key={style.id}>
              <Card
                variant="outlined"
                sx={{
                  p: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  border: index === 0 ? 2 : 1,
                  borderColor: index === 0 ? 'primary.main' : 'divider',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => handleStyleClick(style.id)}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <School color="primary" />
                      <Typography variant="h6">
                        {style.displayName}
                      </Typography>
                      {index === 0 && (
                        <Chip
                          label="最もおすすめ"
                          color="primary"
                          size="small"
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {style.description}
                    </Typography>
                  </Box>
                  
                  {style.recommendationScore && (
                    <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                      <Typography variant="h4" color="primary">
                        {style.recommendationScore}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        適合度
                      </Typography>
                    </Box>
                  )}
                </Box>

                {style.matchingReasons && style.matchingReasons.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      推奨理由
                    </Typography>
                    <List dense>
                      {style.matchingReasons.slice(0, 3).map((reason, idx) => (
                        <ListItem key={idx} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 30 }}>
                            <CheckCircle color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={reason}
                            primaryTypographyProps={{
                              variant: 'body2',
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Button
                    variant="text"
                    endIcon={<ArrowForward />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStyleClick(style.id);
                    }}
                  >
                    詳細を見る
                  </Button>
                  
                  <Button
                    variant="contained"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateTemplate(style.id);
                    }}
                  >
                    テンプレート作成
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LocalOffer color="action" />
            <Typography variant="subtitle2">
              授業スタイルの活用方法
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            1. 詳細を確認して、あなたに合ったスタイルを選択
          </Typography>
          <Typography variant="body2" color="text.secondary">
            2. テンプレートを作成して、実際の授業に活用
          </Typography>
          <Typography variant="body2" color="text.secondary">
            3. 実践後のフィードバックで、さらに改善
          </Typography>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/styles')}
          >
            すべての授業スタイルを見る
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RecommendedStyles;