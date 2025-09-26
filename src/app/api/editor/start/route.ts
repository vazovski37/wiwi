import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { startEditingSession } from '@/lib/google-cloud/editor-service';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { repoName } = await request.json();
  if (!repoName) {
    return new Response(JSON.stringify({ error: 'repoName is required' }), { status: 400 });
  }
  
  const result = await startEditingSession(repoName);

  if (result.success) {
    return NextResponse.json({ url: result.url, sessionId: result.sessionId });
  } else {
    return new Response(JSON.stringify({ error: result.error }), { status: 500 });
  }
}