import { supabase } from './supabase';

export type ContextType = 'tbs' | 'mcq' | 'sprint' | 'concept' | 'general';

export interface HarryMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface HarryConversation {
  id: string;
  user_id: string;
  context_type: ContextType;
  context_id: string | null;
  context_name: string | null;
  messages: HarryMessage[];
  created_at: string;
  updated_at: string;
}

// Load a conversation by context (returns null if none exists)
export async function loadConversation(
  userId: string,
  contextType: ContextType,
  contextId: string | null,
): Promise<HarryConversation | null> {
  let query = supabase
    .from('harry_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('context_type', contextType);

  if (contextId) {
    query = query.eq('context_id', contextId);
  } else {
    query = query.is('context_id', null);
  }

  const { data, error } = await query.maybeSingle();
  if (error) { console.error('[harryHistory] load error', error); return null; }
  return data as HarryConversation | null;
}

// Upsert conversation (insert or update messages)
export async function saveConversation(
  userId: string,
  contextType: ContextType,
  contextId: string | null,
  contextName: string | null,
  messages: HarryMessage[],
): Promise<string | null> {
  const { data, error } = await supabase
    .from('harry_conversations')
    .upsert(
      {
        user_id: userId,
        context_type: contextType,
        context_id: contextId,
        context_name: contextName,
        messages,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,context_type,context_id' }
    )
    .select('id')
    .maybeSingle();

  if (error) { console.error('[harryHistory] save error', error); return null; }
  return data?.id ?? null;
}

// Delete a conversation
export async function deleteConversation(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('harry_conversations')
    .delete()
    .eq('id', id);
  if (error) { console.error('[harryHistory] delete error', error); return false; }
  return true;
}

// List all conversations for a user (latest first)
export async function listConversations(
  userId: string,
  contextType?: ContextType,
  search?: string,
  contextName?: string,
  limit = 50,
): Promise<HarryConversation[]> {
  let query = supabase
    .from('harry_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (contextType) query = query.eq('context_type', contextType);
  if (contextName) query = query.eq('context_name', contextName);
  if (search?.trim()) {
    query = query.ilike('messages::text', `%${search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) { console.error('[harryHistory] list error', error); return []; }
  return (data ?? []) as HarryConversation[];
}
