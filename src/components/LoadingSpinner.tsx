import { Loader } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  centered?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function LoadingSpinner({
  size = 'md',
  text,
  centered = true,
  className = '',
}: LoadingSpinnerProps) {
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <Loader className={`${sizeMap[size]} animate-spin text-primary`} />
      {text && <span className="text-sm text-textSecondary">{text}</span>}
    </div>
  );

  if (centered) {
    return (
      <div className="flex items-center justify-center w-full py-8">
        {content}
      </div>
    );
  }

  return content;
}
