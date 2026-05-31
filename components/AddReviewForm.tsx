"use client";

import React, { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface AddReviewFormProps {
  productId: string;
}

const AddReviewForm = ({ productId }: AddReviewFormProps) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      toast.error("Please login to submit a review");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          rating,
          comment,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Review submitted successfully");
        setRating(0);
        setComment("");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to submit review");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5 mt-6 text-center">
        <p className="font-semibold text-zinc-950">Write a review</p>
        <p className="mt-1 text-sm text-zinc-500 mb-3">You must be logged in and have purchased this product to leave a review.</p>
        <button onClick={() => router.push("/login")} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700">Login to Review</button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5 mt-6">
      <h3 className="font-bold text-zinc-950 mb-4">Write a Review</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-zinc-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-zinc-700 mb-1">Comment (Optional)</label>
          <textarea
            id="comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 focus:border-purple-500 focus:ring-purple-500"
            placeholder="What did you like or dislike about this product?"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
          ) : (
            "Submit Review"
          )}
        </button>
      </form>
    </div>
  );
};

export default AddReviewForm;
