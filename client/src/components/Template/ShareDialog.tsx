import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Chip,
  Box,
  Typography,
  InputAdornment,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import {
  Person,
  Search,
  Close,
  Link as LinkIcon,
  ContentCopy,
  Public,
  Group,
  Email,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import templateService from '../../services/template';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  templateId: string;
  templateTitle: string;
  currentSharedUsers?: string[];
  isPublic?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
};

const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  templateId,
  templateTitle,
  currentSharedUsers = [],
  isPublic: initialIsPublic = false,
}) => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [sharedUsers, setSharedUsers] = useState<string[]>(currentSharedUsers);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [shareLink, setShareLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 共有リンクを生成
    const baseUrl = window.location.origin;
    setShareLink(`${baseUrl}/templates/${templateId}`);
  }, [templateId]);

  // ユーザー検索（実際の実装では API を呼び出す）
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // 仮のユーザーデータ
      const mockUsers = [
        { id: 'user1', name: '山田太郎', email: 'yamada@example.com' },
        { id: 'user2', name: '鈴木花子', email: 'suzuki@example.com' },
        { id: 'user3', name: '佐藤次郎', email: 'sato@example.com' },
      ].filter(
        user =>
          user.name.includes(searchQuery) ||
          user.email.includes(searchQuery)
      );
      
      setSearchResults(mockUsers);
      setError('');
    } catch (err) {
      setError('ユーザーの検索に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ユーザーを共有リストに追加
  const handleAddUser = async (userId: string) => {
    if (sharedUsers.includes(userId)) return;

    try {
      await templateService.shareTemplate(templateId, [userId]);
      setSharedUsers([...sharedUsers, userId]);
      setSuccess('ユーザーを追加しました');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('ユーザーの追加に失敗しました');
    }
  };

  // ユーザーを共有リストから削除
  const handleRemoveUser = async (userId: string) => {
    try {
      await templateService.unshareTemplate(templateId, userId);
      setSharedUsers(sharedUsers.filter(id => id !== userId));
      setSuccess('ユーザーを削除しました');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('ユーザーの削除に失敗しました');
    }
  };

  // 公開設定の変更
  const handlePublicToggle = async () => {
    try {
      // 実際の実装では API を呼び出して公開設定を更新
      setIsPublic(!isPublic);
      setSuccess(`テンプレートを${!isPublic ? '公開' : '非公開'}にしました`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('公開設定の変更に失敗しました');
    }
  };

  // リンクをコピー
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // メールで共有
  const handleEmailShare = () => {
    const subject = `テンプレート「${templateTitle}」の共有`;
    const body = `以下のリンクからテンプレートを確認できます：\n\n${shareLink}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        「{templateTitle}」を共有
      </DialogTitle>
      
      <Tabs
        value={tabValue}
        onChange={(_, value) => setTabValue(value)}
        sx={{ px: 3 }}
      >
        <Tab label="特定のユーザー" icon={<Group />} iconPosition="start" />
        <Tab label="リンク共有" icon={<LinkIcon />} iconPosition="start" />
        <Tab label="公開設定" icon={<Public />} iconPosition="start" />
      </Tabs>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* 特定のユーザータブ */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="名前またはメールアドレスで検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: loading && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* 検索結果 */}
          {searchResults.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                検索結果
              </Typography>
              <List>
                {searchResults.map((user) => (
                  <ListItem key={user.id}>
                    <ListItemAvatar>
                      <Avatar>
                        <Person />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.name}
                      secondary={user.email}
                    />
                    <ListItemSecondaryAction>
                      <Button
                        size="small"
                        onClick={() => handleAddUser(user.id)}
                        disabled={sharedUsers.includes(user.id)}
                      >
                        {sharedUsers.includes(user.id) ? '追加済み' : '追加'}
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* 共有中のユーザー */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              共有中のユーザー
            </Typography>
            {sharedUsers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                まだ誰とも共有していません
              </Typography>
            ) : (
              <List>
                {sharedUsers.map((userId) => (
                  <ListItem key={userId}>
                    <ListItemAvatar>
                      <Avatar>
                        <Person />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`ユーザー ${userId}`} // 実際は名前を表示
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveUser(userId)}
                      >
                        <Close />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </TabPanel>

        {/* リンク共有タブ */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              このリンクを持っている人は、テンプレートを閲覧できます
            </Typography>
            
            <TextField
              fullWidth
              value={shareLink}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={copied ? 'コピーしました！' : 'リンクをコピー'}>
                      <IconButton onClick={handleCopyLink}>
                        <ContentCopy />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            
            <Button
              variant="outlined"
              startIcon={<Email />}
              onClick={handleEmailShare}
              fullWidth
            >
              メールで共有
            </Button>
          </Box>
        </TabPanel>

        {/* 公開設定タブ */}
        <TabPanel value={tabValue} index={2}>
          <FormControlLabel
            control={
              <Switch
                checked={isPublic}
                onChange={handlePublicToggle}
              />
            }
            label="このテンプレートを公開する"
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            公開すると、すべてのユーザーがこのテンプレートを検索・閲覧できるようになります
          </Typography>
          
          {isPublic && (
            <Alert severity="info" sx={{ mt: 2 }}>
              このテンプレートは公開されています。他の教員があなたの優れた教材を活用できます。
            </Alert>
          )}
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog;