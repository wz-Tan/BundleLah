"use client";

import { isPositiveStatus, type OrderRequest } from "./types";

interface RequestCardProps {
  request: OrderRequest;
}

export function RequestCard({ request }: RequestCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Order ID
          </span>
          <h3 className="text-sm font-bold text-gray-900">{request.id}</h3>
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
    </div>
  );
}
