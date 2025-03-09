import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  initialRating?: number;
  value?: number;
  readOnly?: boolean;
  onRatingChange?: (rating: number) => void;
  onChange?: (rating: number) => void;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  initialRating = 0,
  value,
  readOnly = false,
  onRatingChange,
  onChange
}) => {
  // Use value prop if provided, otherwise use initialRating
  const [rating, setRating] = useState<number>(value !== undefined ? value : initialRating);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  // Update rating when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setRating(value);
    }
  }, [value]);

  // Update rating when initialRating changes (for backward compatibility)
  useEffect(() => {
    if (value === undefined && initialRating !== undefined) {
      setRating(initialRating);
    }
  }, [initialRating, value]);

  const handleRatingClick = (selectedRating: number) => {
    if (readOnly) return;
    
    setRating(selectedRating);
    
    // Support both callback patterns
    if (onChange) {
      onChange(selectedRating);
    }
    if (onRatingChange) {
      onRatingChange(selectedRating);
    }
  };

  const renderStars = () => {
    const stars = [];
    const displayRating = hoveredRating !== null ? hoveredRating : rating;

    for (let i = 1; i <= 5; i++) {
      const filled = i <= displayRating;

      stars.push(
        <button
          key={i}
          type="button"
          disabled={readOnly}
          className={`text-2xl focus:outline-none transition-colors ${
            filled 
              ? 'text-yellow-400' 
              : 'text-gray-300'
          } ${!readOnly ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
          onClick={() => handleRatingClick(i)}
          onMouseEnter={() => !readOnly && setHoveredRating(i)}
          onMouseLeave={() => !readOnly && setHoveredRating(null)}
          aria-label={`Rate ${i} out of 5 stars`}
        >
          <Star fill={filled ? 'currentColor' : 'none'} />
        </button>
      );
    }

    return stars;
  };

  return (
    <div className="flex items-center space-x-1">
      {renderStars()}
    </div>
  );
};

export default RatingStars;
