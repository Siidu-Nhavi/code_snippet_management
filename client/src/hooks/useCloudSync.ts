import { useEffect, useState } from "react";
import { api } from "../api";

export type SyncState = "SYNCED" | "LOCAL_CHANGES" | "OFFLINE";

export function useCloudSync(token: string | null) {
  const [syncState, setSyncState] = useState<SyncState>("SYNCED");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator === "undefined" ? true : navigator.onLine);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setSyncState("OFFLINE");
      return;
    }

    if (hasLocalChanges) {
      setSyncState("LOCAL_CHANGES");
      return;
    }

    setSyncState("SYNCED");
  }, [hasLocalChanges, isOnline]);

  const markLocalChanges = () => {
    setHasLocalChanges(true);
  };

  const clearLocalChanges = () => {
    setHasLocalChanges(false);
  };

  const pullFromCloud = async () => {
    if (!token) {
      return;
    }

    const snapshot = await api.pullSync(token);
    localStorage.setItem("snippet_manager_sync_snapshot", JSON.stringify(snapshot));
    setLastSync(snapshot.serverTime ?? new Date().toISOString());
    clearLocalChanges();
  };

  const pushToCloud = async () => {
    if (!token) {
      return;
    }

    const rawSnapshot = localStorage.getItem("snippet_manager_sync_snapshot");

    if (!rawSnapshot) {
      throw new Error("No local sync snapshot available. Pull from cloud first.");
    }

    const snapshot = JSON.parse(rawSnapshot) as any;

    const payload = {
      categories: (snapshot.categories ?? []).map((item: any) => ({
        id: item.id,
        name: item.name,
        deleted: Boolean(item.deletedAt)
      })),
      tags: (snapshot.tags ?? []).map((item: any) => ({
        id: item.id,
        name: item.name,
        deleted: Boolean(item.deletedAt)
      })),
      snippets: (snapshot.snippets ?? []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        language: item.language,
        code: item.code,
        categoryId: item.categoryId,
        tags: (item.tags ?? []).map((tag: any) => (typeof tag === "string" ? tag : tag.name)).filter(Boolean),
        isPublic: Boolean(item.isPublic),
        deleted: Boolean(item.deletedAt)
      })),
      favorites: (snapshot.favorites ?? []).map((item: any) => ({
        snippetId: item.snippetId,
        active: true
      }))
    };

    const result = await api.pushSync(token, payload);
    setLastSync(result.serverTime ?? new Date().toISOString());
    clearLocalChanges();
  };

  return {
    syncState,
    lastSync,
    markLocalChanges,
    clearLocalChanges,
    pullFromCloud,
    pushToCloud
  };
}
