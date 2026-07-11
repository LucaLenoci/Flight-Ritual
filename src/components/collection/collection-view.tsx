"use client";

import { Cards } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { Skeleton } from "../ui/skeleton";
import type { CardAlbumResponse } from "../../lib/api-types";
import { CollectionAlbum } from "./collection-album";

export function CollectionView() {
  const [album, setAlbum] = useState<CardAlbumResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cards")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Couldn't load your collection");
        if (!cancelled) setAlbum(body as CardAlbumResponse);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-danger sm:px-6">{error}</p>;
  }

  if (!album) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const hasAnyOwned = [...album.airports, ...album.aircraft, ...album.airlines].some((entry) => entry.owned);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl italic text-text-primary">My Collection</h1>
      <p className="mt-1 text-sm text-text-secondary">Every airport, aircraft, and airline you&apos;ve flown.</p>

      {!hasAnyOwned ? (
        <div className="mt-8">
          <EmptyState
            icon={<Cards aria-hidden="true" />}
            title="Your album starts with your first flight"
            description="Log a flight to unlock your first Airport, Aircraft, and Airline cards."
            action={
              <Link href="/add-flight">
                <Button>Log a flight</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6">
          <CollectionAlbum album={album} />
        </div>
      )}
    </div>
  );
}
