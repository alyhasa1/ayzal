import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/components/admin/Toast";

export default function AdminReviews() {
  const reviewsQuery = useQuery(api.reviews.adminList);
  const questionsQuery = useQuery(api.reviews.adminListQuestions);
  const moderateReview = useMutation(api.reviews.adminModerate);
  const answerQuestion = useMutation(api.reviews.answerQuestion);
  const updateQuestionStatus = useMutation(api.reviews.adminUpdateQuestionStatus);
  const updateAnswerStatus = useMutation(api.reviews.adminUpdateAnswerStatus);
  const { toast } = useToast();

  const [tab, setTab] = useState<"reviews" | "questions">("reviews");
  const [statusFilter, setStatusFilter] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});

  const filteredReviews = useMemo(() => {
    const reviewRows = reviewsQuery ?? [];
    if (!statusFilter) return reviewRows;
    return reviewRows.filter((review: any) => review.status === statusFilter);
  }, [reviewsQuery, statusFilter]);

  const filteredQuestions = useMemo(() => {
    const questionRows = questionsQuery ?? [];
    if (!statusFilter) return questionRows;
    return questionRows.filter((question: any) => question.status === statusFilter);
  }, [questionsQuery, statusFilter]);

  const runWithBusy = async (key: string, action: () => Promise<void>) => {
    setBusyKey(key);
    try {
      await action();
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex border border-[#111]/10">
          <button
            className={`px-4 py-2 text-xs uppercase tracking-widest ${
              tab === "reviews" ? "bg-[#111] text-white" : "bg-white text-[#111]"
            }`}
            onClick={() => setTab("reviews")}
          >
            Reviews
          </button>
          <button
            className={`px-4 py-2 text-xs uppercase tracking-widest ${
              tab === "questions" ? "bg-[#111] text-white" : "bg-white text-[#111]"
            }`}
            onClick={() => setTab("questions")}
          >
            Q&A
          </button>
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-[#6E6E6E]">Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border border-[#111]/10 px-3 py-2 text-sm bg-white"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="published">Published</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {tab === "reviews" ? (
        <div className="space-y-3">
          {filteredReviews.length === 0 ? (
            <div className="bg-white border border-[#111]/10 p-6 text-sm text-[#6E6E6E]">
              No reviews in this view.
            </div>
          ) : (
            filteredReviews.map((review: any) => (
              <article key={review._id} className="bg-white border border-[#111]/10 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {review.title || "Untitled review"} • {review.rating}/5
                    </p>
                    <p className="text-xs text-[#6E6E6E]">
                      Product {review.product_id} • {review.guest_name || "Customer"} •{" "}
                      {new Date(review.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest border border-[#111]/10 px-2 py-1">
                    {review.status}
                  </span>
                </div>

                {review.body ? <p className="text-sm text-[#6E6E6E]">{review.body}</p> : null}

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#111]/10">
                  {["pending", "published", "rejected"].map((status) => (
                    <button
                      key={status}
                      className={`text-xs border px-3 py-1 uppercase tracking-widest ${
                        review.status === status
                          ? "border-[#111] bg-[#111] text-white"
                          : "border-[#111]/10 hover:border-[#D4A05A]"
                      }`}
                      disabled={busyKey === review._id}
                      onClick={() =>
                        runWithBusy(review._id, async () => {
                          try {
                            await moderateReview({
                              review_id: review._id,
                              status,
                              verified_purchase:
                                status === "published"
                                  ? review.verified_purchase ?? true
                                  : review.verified_purchase,
                            });
                            toast(`Review marked ${status}`);
                          } catch (error: any) {
                            toast(error?.message ?? "Unable to update review", "error");
                          }
                        })
                      }
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.length === 0 ? (
            <div className="bg-white border border-[#111]/10 p-6 text-sm text-[#6E6E6E]">
              No questions in this view.
            </div>
          ) : (
            filteredQuestions.map((question: any) => (
              <article key={question._id} className="bg-white border border-[#111]/10 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{question.question}</p>
                    <p className="text-xs text-[#6E6E6E]">
                      {question.product_name || question.product_id} •{" "}
                      {question.guest_name || "Customer"} •{" "}
                      {new Date(question.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest border border-[#111]/10 px-2 py-1">
                    {question.status}
                  </span>
                </div>

                {(question.answers ?? []).length > 0 ? (
                  <div className="space-y-2 border border-[#111]/10 p-3">
                    {(question.answers ?? []).map((answer: any) => (
                      <div key={answer._id} className="text-sm text-[#6E6E6E]">
                        <div className="flex items-center justify-between gap-2">
                          <p>{answer.answer}</p>
                          <button
                            className="text-xs border border-[#111]/10 px-2 py-1"
                            onClick={() =>
                              runWithBusy(answer._id, async () => {
                                try {
                                  await updateAnswerStatus({
                                    answer_id: answer._id,
                                    status:
                                      answer.status === "published" ? "rejected" : "published",
                                  });
                                  toast("Answer status updated");
                                } catch (error: any) {
                                  toast(error?.message ?? "Unable to update answer", "error");
                                }
                              })
                            }
                          >
                            {answer.status === "published" ? "Reject" : "Publish"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {["pending", "published", "rejected"].map((status) => (
                    <button
                      key={status}
                      className={`text-xs border px-3 py-1 uppercase tracking-widest ${
                        question.status === status
                          ? "border-[#111] bg-[#111] text-white"
                          : "border-[#111]/10 hover:border-[#D4A05A]"
                      }`}
                      onClick={() =>
                        runWithBusy(question._id, async () => {
                          try {
                            await updateQuestionStatus({
                              question_id: question._id,
                              status,
                            });
                            toast(`Question marked ${status}`);
                          } catch (error: any) {
                            toast(error?.message ?? "Unable to update question", "error");
                          }
                        })
                      }
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 pt-2 border-t border-[#111]/10">
                  <textarea
                    value={answerDrafts[question._id] ?? ""}
                    onChange={(event) =>
                      setAnswerDrafts((prev) => ({
                        ...prev,
                        [question._id]: event.target.value,
                      }))
                    }
                    className="flex-1 border border-[#111]/10 px-3 py-2 text-sm min-h-20"
                    placeholder="Write answer..."
                  />
                  <button
                    className="btn-primary text-xs px-3 py-2 self-start"
                    disabled={busyKey === question._id}
                    onClick={() =>
                      runWithBusy(question._id, async () => {
                        const answer = (answerDrafts[question._id] ?? "").trim();
                        if (!answer) {
                          toast("Enter an answer", "error");
                          return;
                        }
                        try {
                          await answerQuestion({
                            question_id: question._id,
                            answer,
                            publish: true,
                          });
                          setAnswerDrafts((prev) => ({ ...prev, [question._id]: "" }));
                          toast("Answer published");
                        } catch (error: any) {
                          toast(error?.message ?? "Unable to answer question", "error");
                        }
                      })
                    }
                  >
                    {busyKey === question._id ? "Saving..." : "Answer"}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
