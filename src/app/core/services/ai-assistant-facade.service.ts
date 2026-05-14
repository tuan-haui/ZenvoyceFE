import { Inject, Injectable, Optional } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AiChatResponseDto, API_BASE_URL, ChatWithVertexAiCommand, Client } from './app.service';

@Injectable({ providedIn: 'root' })
export class AiAssistantFacadeService {
  private readonly baseUrl: string;

  constructor(
    private readonly client: Client,
    @Optional() @Inject(API_BASE_URL) baseUrl?: string
  ) {
    this.baseUrl = baseUrl ?? '';
  }

  chat(message: string): Observable<AiChatResponseDto | undefined> {
    const payload = new ChatWithVertexAiCommand({ message: (message ?? '').trim() });
    return this.client.chat(payload).pipe(map((env) => env.data));
  }

  chatStream(message: string): Observable<string> {
    return new Observable<string>((observer) => {
      const url = `${this.baseUrl}/api/Ai/chat-stream?message=${encodeURIComponent(message.trim())}`;

      const abortController = new AbortController();

      fetch(url, {
        method: 'GET',
        signal: abortController.signal,
        headers: {
          'Accept': 'text/event-stream',
        },
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error! status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('Response body is null');
          }

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
                  const json = JSON.parse(data);
                  if (json.text) {
                    observer.next(json.text);
                  } else if (json.error) {
                    observer.error(new Error(json.error));
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e, data);
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
          if (err.name !== 'AbortError') {
            observer.error(err);
          }
        });

      return () => {
        abortController.abort();
      };
    });
  }
}
