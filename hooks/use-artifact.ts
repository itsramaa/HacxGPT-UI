"use client";

/**
 * Stub — Artifact panel has been removed.
 * These are no-ops kept for compilation compatibility.
 */

export type ArtifactKind = "text" | "code" | "image" | "sheet";

export type UIArtifact = {
  documentId: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  status: "idle" | "streaming";
  isVisible: boolean;
  boundingBox: { top: number; left: number; width: number; height: number };
};

export const initialArtifactData: UIArtifact = {
  documentId: "",
  title: "",
  kind: "text",
  content: "",
  status: "idle",
  isVisible: false,
  boundingBox: { top: 0, left: 0, width: 0, height: 0 },
};

export function useArtifact() {
  return {
    artifact: initialArtifactData,
    setArtifact: (_updater: any) => {},
    setMetadata: (_updater: any) => {},
  };
}

export function useArtifactSelector<T>(selector: (state: UIArtifact) => T): T {
  return selector(initialArtifactData);
}
