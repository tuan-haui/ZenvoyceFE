import { Inject, Injectable, Optional } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { AiChatResponseDto, API_BASE_URL, ChatWithVertexAiCommand, Client } from './app.service';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class AiAssistantFacadeService {
  private readonly baseUrl: string;

  constructor(
    private readonly client: Client,
    private readonly http: HttpClient,
    private readonly sessionService: SessionService,
    @Optional() @Inject(API_BASE_URL) baseUrl?: string
  ) {
    this.baseUrl = baseUrl ?? '';
  }

  // ─── Endpoint cũ (không có session) ────────────────────────────────────────

  chat(message: string): Observable<AiChatResponseDto | undefined> {
    const payload = new ChatWithVertexAiCommand({ message: (message ?? '').trim() });
    return this.client.chat(payload).pipe(map((env) => env.data));
  }

  /** Stream qua `/api/Ai/chat-stream` (AI nghiệp vụ, không session server). */
  chatStream(message: string): Observable<string> {
    const token = this.sessionService.getAccessToken();
    const url = `${this.baseUrl}/api/Ai/chat-stream?message=${encodeURIComponent(message.trim())}`;
    return this._sseStream(url, token ?? undefined);
  }

  // ─── Endpoint mới: Memory + Function Calling ────────────────────────────────

  /**
   * Stream chat với memory (lịch sử hội thoại) và function calling (query DB).
   * Backend tự detect functionCall và thực thi tool, sau đó trả về text stream.
   */
  chatStreamWithMemory(sessionId: string, message: string): Observable<string> {
    const token = this.sessionService.getAccessToken();
    const url = `${this.baseUrl}/api/Ai/stream?sessionId=${encodeURIComponent(sessionId)}&message=${encodeURIComponent(message.trim())}`;
    return this._sseStream(url, token ?? undefined);
  }

  /**
   * Xoá lịch sử hội thoại của một session trên server.
   */
  clearSession(sessionId: string): Observable<void> {
    const token = this.sessionService.getAccessToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
    return this.http.delete<void>(`${this.baseUrl}/api/Ai/session/${encodeURIComponent(sessionId)}`, { headers });
  }

  // ─── Private: SSE stream helper ────────────────────────────────────────────

  private _sseStream(url: string, bearerToken?: string): Observable<string> {
    return new Observable<string>((observer) => {
      const abortController = new AbortController();

      const headers: Record<string, string> = { Accept: 'text/event-stream' };
      if (bearerToken) {
        headers['Authorization'] = `Bearer ${bearerToken}`;
      }

      fetch(url, {
        method: 'GET',
        signal: abortController.signal,
        headers,
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error('Response body is null');

          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() ?? '';

              for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

                const data = trimmedLine.substring(6);
                if (data === '[DONE]') {
                  observer.complete();
                  return;
                }

                try {
                  // Endpoint /api/Ai/stream gửi data: "text" (JSON string)
                  // Endpoint /api/Ai/chat-stream gửi data: {"text": "..."}
                  let chunk: string | null = null;
                  const parsed = JSON.parse(data);
                  if (typeof parsed === 'string') {
                    chunk = parsed;
                  } else if (parsed?.text) {
                    chunk = parsed.text;
                  } else if (parsed?.error) {
                    observer.error(new Error(parsed.error));
                    return;
                  }
                  if (chunk) observer.next(chunk);
                } catch {
                  // Dòng không parse được — bỏ qua
                }
              }
            }
            observer.complete();
          } catch (e) {
            observer.error(e);
          } finally {
            reader.releaseLock();
          }
        })
        .catch((err) => {
          if (err.name !== 'AbortError') observer.error(err);
        });

      return () => abortController.abort();
    });
  }
}
