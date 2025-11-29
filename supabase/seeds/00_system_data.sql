-- ============================================
-- supabase/seeds/00_system_data.sql
-- 系統預設數據 (權限、角色、事件訂閱)
-- ============================================

-- ============================================
-- 1. 系統權限初始化
-- ============================================
INSERT INTO public.permissions (resource, action, scope, name, description, category) VALUES
    -- 藍圖權限
    ('blueprint', 'create', 'organization', '建立藍圖', '在組織內建立新藍圖', 'blueprint'),
    ('blueprint', 'read', 'blueprint', '檢視藍圖', '檢視藍圖基本資訊', 'blueprint'),
    ('blueprint', 'update', 'blueprint', '編輯藍圖', '編輯藍圖設定', 'blueprint'),
    ('blueprint', 'delete', 'blueprint', '刪除藍圖', '刪除藍圖', 'blueprint'),
    ('blueprint', 'manage', 'blueprint', '管理藍圖', '完全管理藍圖權限', 'blueprint'),
    
    -- 任務權限
    ('task', 'create', 'blueprint', '建立任務', '在藍圖內建立任務', 'task'),
    ('task', 'read', 'blueprint', '檢視任務', '檢視任務內容', 'task'),
    ('task', 'update', 'blueprint', '編輯任務', '編輯任務內容', 'task'),
    ('task', 'delete', 'blueprint', '刪除任務', '刪除任務', 'task'),
    ('task', 'assign', 'blueprint', '分配任務', '分配任務給成員', 'task'),
    
    -- 施工日誌權限
    ('diary', 'create', 'blueprint', '建立日誌', '建立施工日誌', 'diary'),
    ('diary', 'read', 'blueprint', '檢視日誌', '檢視日誌內容', 'diary'),
    ('diary', 'update', 'blueprint', '編輯日誌', '編輯日誌內容', 'diary'),
    ('diary', 'delete', 'blueprint', '刪除日誌', '刪除日誌', 'diary'),
    
    -- 待辦權限
    ('todo', 'create', 'blueprint', '建立待辦', '建立待辦事項', 'todo'),
    ('todo', 'read', 'blueprint', '檢視待辦', '檢視待辦事項', 'todo'),
    ('todo', 'update', 'blueprint', '編輯待辦', '編輯待辦事項', 'todo'),
    ('todo', 'delete', 'blueprint', '刪除待辦', '刪除待辦事項', 'todo'),
    
    -- 檔案權限
    ('file', 'upload', 'blueprint', '上傳檔案', '上傳檔案到藍圖', 'file'),
    ('file', 'download', 'blueprint', '下載檔案', '下載檔案', 'file'),
    ('file', 'delete', 'blueprint', '刪除檔案', '刪除檔案', 'file'),
    
    -- 成員權限
    ('member', 'invite', 'blueprint', '邀請成員', '邀請新成員加入', 'member'),
    ('member', 'remove', 'blueprint', '移除成員', '移除成員', 'member'),
    ('member', 'manage', 'blueprint', '管理成員', '管理成員權限', 'member')
ON CONFLICT (resource, action, scope) DO NOTHING;

-- ============================================
-- 2. 系統角色初始化
-- ============================================
DO $$
DECLARE
    v_owner_role_id UUID;
    v_admin_role_id UUID;
    v_editor_role_id UUID;
    v_viewer_role_id UUID;
BEGIN
    -- Owner 角色
    INSERT INTO public.roles (name, slug, scope, description, is_system)
    VALUES ('擁有者', 'owner', 'blueprint', '藍圖擁有者，擁有完全控制權', true)
    RETURNING id INTO v_owner_role_id;
    
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_owner_role_id, id FROM public.permissions;
    
    -- Admin 角色
    INSERT INTO public.roles (name, slug, scope, description, is_system)
    VALUES ('管理員', 'admin', 'blueprint', '可管理藍圖和成員', true)
    RETURNING id INTO v_admin_role_id;
    
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_admin_role_id, id FROM public.permissions 
    WHERE action != 'delete' OR resource != 'blueprint';
    
    -- Editor 角色
    INSERT INTO public.roles (name, slug, scope, description, is_system)
    VALUES ('編輯者', 'editor', 'blueprint', '可編輯內容但不能管理成員', true)
    RETURNING id INTO v_editor_role_id;
    
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_editor_role_id, id FROM public.permissions 
    WHERE action IN ('create', 'read', 'update', 'upload', 'download')
      AND resource != 'member';
    
    -- Viewer 角色
    INSERT INTO public.roles (name, slug, scope, description, is_system)
    VALUES ('檢視者', 'viewer', 'blueprint', '只能檢視內容', true)
    RETURNING id INTO v_viewer_role_id;
    
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_viewer_role_id, id FROM public.permissions 
    WHERE action IN ('read', 'download');
END $$;

-- ============================================
-- 3. 事件訂閱初始化
-- ============================================
INSERT INTO public.event_subscriptions (subscriber_module, event_pattern, is_active) VALUES
    -- 時間軸訂閱所有事件
    ('timeline', '*', true),
    
    -- 通知訂閱關鍵事件
    ('notifications', 'task.assigned', true),
    ('notifications', 'task.completed', true),
    ('notifications', 'diary.created', true),
    ('notifications', 'member.invited', true),
    
    -- 搜尋引擎訂閱內容變更
    ('search', 'task.created', true),
    ('search', 'task.updated', true),
    ('search', 'diary.created', true),
    ('search', 'diary.updated', true),
    ('search', 'file.uploaded', true)
ON CONFLICT DO NOTHING;
