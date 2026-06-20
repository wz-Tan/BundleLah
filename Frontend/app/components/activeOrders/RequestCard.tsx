"use client";

import { useState } from "react";

import { isPositiveStatus, type OrderRequest } from "./types";

interface RequestCardProps {
  request: OrderRequest;
  onDelete?: (id: string) => void;
  onAccept?: (matchId: number) => void | Promise<void>;
  onReject?: (matchId: number) => void | Promise<void>;
}

export function RequestCard({
  request,
  onDelete,
  onAccept,
  onReject,
}: RequestCardProps) {
  const [busy, setBusy] = useState(false);

  const canRespond =
    request.matchId != null &&
    request.status === "pending" &&
    (onAccept != null || onReject != null);

  async function respond(action: "accept" | "reject") {
    if (request.matchId == null || busy) return;
    setBusy(true);
    try {
      if (action === "accept") await onAccept?.(request.matchId);
      else await onReject?.(request.matchId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {request.offeredBy ? "Offer From" : "Order ID"}
          </span>
          <h3 className="text-sm font-bold text-gray-900">
            {request.offeredBy ?? request.id}
          </h3>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium uppercase tracking-wide ${
            isPositiveStatus(request.status)
              ? "bg-green-100 text-green-700"
              : "bg-orange-100 text-orange-700"
          }`}
        >
          {request.status}
        </span>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div>
          <strong className="text-gray-900">Pick Up:</strong> {request.pickup}
        </div>
        <div>
          <strong className="text-gray-900">Destination:</strong>{" "}
          {request.destination}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
        <span className="text-xs text-gray-400 font-medium uppercase">
          Price
        </span>
        <span className="text-lg font-semibold text-orange-500">
          RM {request.price}
        </span>
      </div>

      {canRespond && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => respond("reject")}
            disabled={busy}
            className="flex-1 text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reject
          </button>
          <button
            onClick={() => respond("accept")}
            disabled={busy}
            className="flex-1 text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? "Working..." : "Accept"}
          </button>
        </div>
      )}

      {onDelete && (
        <button
          onClick={() => onDelete(request.id)}
          className="mt-3 self-end text-xs font-medium text-zinc-400 hover:text-red-500 transition-colors"
        >
          Delete
        </button>
      )}
    </div>
  );
}
