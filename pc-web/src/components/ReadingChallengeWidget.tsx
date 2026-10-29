import type { UserProfile } from '../types';

interface ReadingChallengeWidgetProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
}

export const ReadingChallengeWidget: React.FC<ReadingChallengeWidgetProps> = ({
  user,
  onOpenAuth,
}) => {
  if (!user) {
    return (
      <div className="bg-white rounded-lg border border-[#E0DDD5] p-4 mb-4">
        <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#382110] mb-2">
          2026 READING CHALLENGE
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Challenge yourself to read more books this year!
        </p>
        <button
          onClick={onOpenAuth}
          className="text-xs font-semibold text-[#00635D] hover:underline"
        >
          Sign in to set your goal →
        </button>
      </div>
    );
  }

  const progressPercent = Math.min(
    100,
    Math.round((user.readingChallengeProgress / user.readingChallengeGoal) * 100)
  );

  return (
    <div className="bg-white rounded-lg border border-[#E0DDD5] p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#382110]">
          2026 READING CHALLENGE
        </h3>
        <span className="text-xs font-bold text-[#409D69]">{progressPercent}%</span>
      </div>

      <div className="flex items-center gap-3 my-2">
        <div className="w-12 h-12 rounded-full border-4 border-[#409D69] bg-[#F4F1EA] flex items-center justify-center shrink-0">
          <span className="font-serif font-bold text-sm text-[#382110]">
            {user.readingChallengeProgress}
          </span>
        </div>
        <div>
          <div className="text-xs text-gray-700">
            <span className="font-bold text-gray-900">{user.readingChallengeProgress}</span> of{' '}
            <span className="font-bold text-gray-900">{user.readingChallengeGoal}</span> books
            completed
          </div>
          <div className="text-[11px] text-[#409D69] font-medium mt-0.5">
            2 books ahead of schedule!
          </div>
        </div>
      </div>

      {/* Progress track */}
      <div className="w-full bg-[#EBE8DF] h-2 rounded-full overflow-hidden mt-2">
        <div
          className="bg-[#409D69] h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="mt-3 text-right">
        <a href="#challenge" className="text-[11px] text-[#00635D] hover:underline font-semibold">
          View challenge details →
        </a>
      </div>
    </div>
  );
};
