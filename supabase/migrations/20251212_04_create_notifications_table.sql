-- =============================================================================
-- Notification System Migration
-- =============================================================================
-- Creates notifications table for header widgets (notify.component & task.component)
-- Supports three types: 通知 (Notice), 消息 (Message), 待辦 (Todo)
-- =============================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification type (category)
  type TEXT NOT NULL CHECK (type IN ('通知', '消息', '待辦')),
  
  -- Basic information
  title TEXT NOT NULL,
  description TEXT,
  avatar TEXT, -- URL to avatar image or icon name
  
  -- Timestamp
  datetime TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Read status
  read BOOLEAN NOT NULL DEFAULT false,
  
  -- Extra fields for 待辦 (Todo) type
  extra TEXT, -- Additional status text (e.g., "未開始", "馬上到期")
  status TEXT CHECK (status IN ('todo', 'processing', 'urgent', 'doing')),
  
  -- Optional link for navigation
  link TEXT,
  
  -- Metadata timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

-- Primary query index: Get user's notifications ordered by date
CREATE INDEX idx_notifications_user_created 
  ON notifications(user_id, created_at DESC);

-- Query unread notifications
CREATE INDEX idx_notifications_user_unread 
  ON notifications(user_id, read) 
  WHERE read = false;

-- Query by type
CREATE INDEX idx_notifications_user_type 
  ON notifications(user_id, type);

-- Query todo notifications specifically
CREATE INDEX idx_notifications_todo 
  ON notifications(user_id, type) 
  WHERE type = '待辦';

-- =============================================================================
-- Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own notifications
CREATE POLICY "Users can insert their own notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own notifications
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- Trigger for automatic updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- =============================================================================
-- Realtime Publication
-- =============================================================================

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- =============================================================================
-- Sample Data (for testing)
-- =============================================================================

-- Insert sample notifications (replace with actual user_id after user creation)
-- These are examples and should be created by the application

-- Example: Insert sample notification for testing
-- IMPORTANT: Replace 'your-user-id-here' with actual auth.users.id
/*
INSERT INTO notifications (user_id, type, title, description, avatar, datetime, read) VALUES
  (
    'your-user-id-here',
    '通知',
    '系統測試通知',
    '這是一個測試通知，用於驗證通知系統功能',
    'https://gw.alipayobjects.com/zos/rmsportal/ThXAXghbEsBCCSDihZxY.png',
    now(),
    false
  ),
  (
    'your-user-id-here',
    '消息',
    '歡迎使用 GigHub',
    '歡迎使用工地施工進度追蹤管理系統',
    'https://gw.alipayobjects.com/zos/rmsportal/fcHMVNCjPOsbUGdEduuv.jpeg',
    now(),
    false
  ),
  (
    'your-user-id-here',
    '待辦',
    '待完成任務',
    '請查看您的待辦任務清單',
    NULL,
    now(),
    false,
    '未開始',
    'todo'
  );
*/

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE notifications IS 'User notifications for header widgets';
COMMENT ON COLUMN notifications.type IS 'Notification category: 通知 (Notice), 消息 (Message), 待辦 (Todo)';
COMMENT ON COLUMN notifications.status IS 'Status for todo type: todo, processing, urgent, doing';
COMMENT ON COLUMN notifications.read IS 'Whether user has read this notification';
COMMENT ON COLUMN notifications.link IS 'Optional link to navigate when notification is clicked';

-- =============================================================================
-- Migration Complete
-- =============================================================================
