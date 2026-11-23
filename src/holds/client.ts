// Klient catalog-api: rezerwacje przechowuje serwis katalogu, tutaj trafiają przez HTTP.
export interface Hold { id: number; bookId: number; readerId: number }

export interface HoldsClient {
  // Wszystkie aktywne rezerwacje książki, w tym rezerwacja samego czytelnika.
  // Timeout zapytania 2 s, bez ponownych prób.
  activeForBook(bookId: number): Promise<Hold[]>;
}

export const HOLDS_TIMEOUT_MS = 2000;

export function createHoldsClient(
  baseUrl: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = HOLDS_TIMEOUT_MS,
): HoldsClient {
  return {
    async activeForBook(bookId) {
      const res = await fetchImpl(`${baseUrl}/books/${bookId}/holds?status=active`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`catalog-api responded ${res.status}`);
      return (await res.json()) as Hold[];
    },
  };
}
