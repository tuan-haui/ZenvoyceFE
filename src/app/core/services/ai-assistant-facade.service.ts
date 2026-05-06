import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AiChatResponseDto, ChatWithVertexAiCommand, Client } from './app.service';

@Injectable({ providedIn: 'root' })
export class AiAssistantFacadeService {
  constructor(private readonly client: Client) {}

  chat(message: string): Observable<AiChatResponseDto | undefined> {
    const payload = new ChatWithVertexAiCommand({ message: (message ?? '').trim() });
    return this.client.chat(payload).pipe(map((env) => env.data));
  }
}
