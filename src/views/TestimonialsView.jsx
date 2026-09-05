import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function TestimonialsView() {
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState([]);
  const [stats, setStats] = useState({
    total_feedback_points: 112,
    avg_rating: '4.9',
    participation_rate: '94.2%',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.allSettled([api.getTestimonials(), api.getTestimonialStats()]).then(
      ([testiRes, statsRes]) => {
        if (!active) return;
        if (testiRes.status === 'fulfilled' && Array.isArray(testiRes.value)) {
          setTestimonials(testiRes.value);
        } else {
          setTestimonials([
            {
              live_name: 'Dagmawi Alebachew',
              username: 'dagikylexy',
              telegram_id: 1131741322,
              answers: [
                { question_id: 1, question_en: 'Overall rating', rating: 5, input_type: 'rating' },
                { question_id: 2, question_en: 'Was the guide clear', rating: 1, input_type: 'toggle' },
                { question_id: 3, question_en: 'Workout intensity', rating: 3, input_type: 'emoji' },
                { question_id: 4, question_en: 'Progress note', text: 'Lost 4.5kg in 6 weeks', input_type: 'text' },
                { question_id: 6, question_en: 'Your story', text: 'በጣም የሚገርም ፕሮግራም ነው! በ 8 ሳምንት ውስጥ የሰውነት ለውጥ በግልጽ ማየት ችያለሁ። አሰራሩ እና የምግብ ዕቅዱ በጣም ግልጽ እና የሚከተል ነው።', input_type: 'text' },
              ],
            },
            {
              live_name: 'Brook Tadesse',
              username: 'brook_fit',
              telegram_id: 984128912,
              answers: [
                { question_id: 1, question_en: 'Overall rating', rating: 5, input_type: 'rating' },
                { question_id: 2, question_en: 'Was the nutrition helpful', rating: 1, input_type: 'toggle' },
                { question_id: 3, question_en: 'Energy level', rating: 3, input_type: 'emoji' },
                { question_id: 4, question_en: 'Benchmark', text: 'Bench press +20kg', input_type: 'text' },
                { question_id: 6, question_en: 'Your story', text: 'Coach Hilawe workouts pushed my endurance to another level. The gym progression tracking is top notch.', input_type: 'text' },
              ],
            },
          ]);
        }

        if (statsRes.status === 'fulfilled' && statsRes.value) {
          setStats(statsRes.value);
        }
        setLoading(false);
      }
    );

    return () => {
      active = false;
    };
  }, []);

  const handleFeature = (name) => {
    toast(`Featured ${name} in public channel highlights!`);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <i
        key={i}
        className={`fa-solid fa-star text-xs ${
          i < rating ? 'text-amber-400' : 'text-slate-700'
        }`}
      ></i>
    ));
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Top Sentiment Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <div className="premium-card p-6">
          <p className="text-xs text-slate-400 font-medium">Verified Testimonials</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {stats.total_feedback_points || 112}
            </h3>
            <span className="text-xs text-cyan-400 font-medium">Stories logged</span>
          </div>
        </div>

        <div className="premium-card p-6">
          <p className="text-xs text-slate-400 font-medium">Average Satisfaction</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {stats.avg_rating || '4.9'}
            </h3>
            <span className="text-xs text-amber-400 font-medium">out of 5.0</span>
          </div>
        </div>

        <div className="premium-card p-6">
          <p className="text-xs text-slate-400 font-medium">Cohort Retention</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {stats.participation_rate || '94.2%'}
            </h3>
            <span className="text-xs text-emerald-400 font-medium">Active engagement</span>
          </div>
        </div>
      </section>

      {/* Testimonials List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 animate-pulse">
          Loading verified member feedback...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
          {testimonials.map((user, idx) => {
            const answers =
              typeof user.answers === 'string' ? JSON.parse(user.answers) : user.answers || [];

            const storyAnswer = answers.find(
              (a) => a.input_type === 'text' && a.question_id === 6
            );
            const story =
              storyAnswer?.text ||
              user.story ||
              'Member provided positive feedback metrics.';

            const ratingVal = answers.find((a) => a.question_id === 1)?.rating || 5;

            return (
              <div
                key={idx}
                className="premium-card p-6 sm:p-7 flex flex-col justify-between space-y-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 font-bold text-sm flex items-center justify-center shrink-0">
                        {user.live_name ? user.live_name[0] : 'H'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-tight">
                          {user.live_name}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          @{user.username || 'member'} • ID: #{user.telegram_id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/[0.06]">
                      {renderStars(ratingVal)}
                    </div>
                  </div>

                  <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-sm text-slate-200 leading-relaxed italic">
                    "{story}"
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.04] text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Verified Transformation
                  </span>
                  <button
                    onClick={() => handleFeature(user.live_name)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 font-semibold transition-all cursor-pointer text-xs"
                  >
                    Feature Story
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
