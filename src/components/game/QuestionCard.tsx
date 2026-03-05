"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type Song = {
  _id: Id<"songs">;
  title: string;
  artist: string;
  year: number;
  streamCount: number;
  genre: string[];
} | null;

export function QuestionCard({
  roundId,
  questionType,
  song,
  correctAnswer: _correctAnswer,
  onAdvancePhase,
}: {
  roundId: Id<"rounds">;
  questionType: string;
  song: Song;
  correctAnswer: unknown;
  onAdvancePhase: () => void;
}) {
  const submitAnswer = useMutation(api.roundAnswers.submit);
  void _correctAnswer;
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitted) return;
    setError(null);
    try {
      const value =
        questionType === "year" || questionType === "streamCount"
          ? Number(answer)
          : answer;
      await submitAnswer({ roundId, answer: value });
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    }
  }

  const choices =
    questionType === "songAbout" || questionType === "identifyOriginal"
      ? [
          song?.title ?? "Option A",
          "Option B",
          "Option C",
          "Option D",
        ].slice(0, 4)
      : [];

  return (
    <div className="w-full max-w-md space-y-4">
      <h3 className="text-lg font-medium text-zinc-300">
        {questionType === "artist" && "Who is the artist?"}
        {questionType === "year" && "What year was it released?"}
        {questionType === "songAbout" && "What is the song about?"}
        {questionType === "streamCount" && "How many streams (approx)?"}
        {questionType === "identifyOriginal" && "Identify the original song"}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {questionType === "artist" && (
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Artist name"
            className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-600"
            disabled={submitted}
          />
        )}
        {(questionType === "year" || questionType === "streamCount") && (
          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={questionType === "year" ? "Year" : "Streams"}
            className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-600"
            disabled={submitted}
          />
        )}
        {(questionType === "songAbout" || questionType === "identifyOriginal") && (
          <div className="space-y-2">
            {choices.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAnswer(String(i))}
                className={`block w-full px-4 py-2 rounded-lg text-left text-sm ${
                  answer === String(i)
                    ? "bg-emerald-600"
                    : "bg-zinc-800 border border-zinc-600"
                }`}
                disabled={submitted}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitted}
          className="w-full px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-medium"
        >
          {submitted ? "Answer submitted" : "Submit answer"}
        </button>
      </form>

      <p className="text-zinc-500 text-xs text-center">
        Host can advance to reveal when everyone has answered.
      </p>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onAdvancePhase}
          className="px-4 py-2 rounded-lg bg-zinc-600 hover:bg-zinc-500 text-sm"
        >
          Advance to reveal (host)
        </button>
      </div>
    </div>
  );
}
