import api from './client';

export function askSkulagAi(message, history = []) {
  return api.post('/ai/ask', { message, history }).then((r) => r.data);
}
