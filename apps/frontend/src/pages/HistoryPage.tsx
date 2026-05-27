import { useMemo, useState } from "react";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import { mockRecords } from "../data/mockData";

const PAGE_SIZE = 4;

export default function HistoryPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(mockRecords.length / PAGE_SIZE);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;

    return mockRecords.slice(startIndex, endIndex);
  }, [currentPage]);

  const handlePrev = () => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((page) => Math.min(page + 1, totalPages));
  };

  return (
    <div>
      <PageHeader
        title="Learning History"
        description="Review your writing corrections, conversations, and level test records."
      />

      <Card>
        <div className="mb-5 flex flex-wrap gap-3">
          <select className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <option value="all">All Types</option>
            <option value="correction">Correction</option>
            <option value="conversation">Conversation</option>
            <option value="level-test">Level Test</option>
          </select>

          <select className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        <div className="space-y-4">
          {paginatedRecords.map((record) => (
            <article
              key={record.recordId}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone={record.type === "correction" ? "blue" : "green"}>
                  {record.type}
                </Badge>

                {record.level && <Badge>{record.level}</Badge>}

                <span className="text-xs text-slate-400">
                  {new Date(record.createdAt).toLocaleString()}
                </span>
              </div>

              {record.topic && (
                <p className="mb-2 text-sm font-semibold text-slate-700">
                  Topic: {record.topic}
                </p>
              )}

              <p className="text-sm font-semibold text-slate-900">Input</p>
              <p className="mt-1 text-sm text-slate-600">{record.inputText}</p>

              <p className="mt-4 text-sm font-semibold text-slate-900">Output</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                {record.outputText}
              </p>
            </article>
          ))}
        </div>

        {mockRecords.length > PAGE_SIZE && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5">
            <p className="text-sm text-slate-500">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handlePrev}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <Button
                variant="secondary"
                onClick={handleNext}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}