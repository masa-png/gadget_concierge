"use client";

import { useState, useEffect } from "react";
import { historyApi, ApiError } from "@/lib/api-client";

interface HistoryItem {
  sessionId: string;
  categoryId: string;
  categoryName: string;
  status: string;
  createdAt: string;
  recommendations?: Array<{
    id: string;
    name: string;
    score: number;
  }>;
}

interface UseHistoryReturn {
  history: HistoryItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const useHistory = (): UseHistoryReturn => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await historyApi.list();
      setHistory(response.history);
    } catch (err) {
      console.error("履歴取得エラー:", err);
      setError(
        err instanceof ApiError ? err.message : "履歴の取得に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory,
  };
};

export default useHistory;
