'use client';
import { cn } from '@/lib/utils';
import { useMotionValue, animate, motion } from 'motion/react';
import React, { useState, useEffect, useCallback } from 'react';
import useMeasure from 'react-use-measure';

export type InfiniteSliderProps = {
  children: React.ReactNode;
  gap?: number;
  speed?: number;
  speedOnHover?: number;
  direction?: 'horizontal' | 'vertical';
  reverse?: boolean;
  className?: string;
};

export function InfiniteSlider({
  children,
  gap = 16,
  speed = 100,
  speedOnHover,
  direction = 'horizontal',
  reverse = false,
  className,
}: InfiniteSliderProps) {
  const [currentSpeed, setCurrentSpeed] = useState(speed);
  const [containerRef, { width: containerWidth, height }] = useMeasure();
  const [contentRef, { width: contentWidth, height: contentHeight }] =
    useMeasure();
  const translation = useMotionValue(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [key, setKey] = useState(0);
  const [duplicatedContent, setDuplicatedContent] = useState<React.ReactNode[]>(
    []
  );

  // Calculate required duplicates based on container and content size
  const calculateDuplicates = useCallback(() => {
    if (!containerWidth || !contentWidth) return [];

    const requiredSize =
      direction === 'horizontal' ? containerWidth * 2 : height * 2;
    const contentSize =
      direction === 'horizontal' ? contentWidth : contentHeight;
    if (contentSize === 0) return [];

    const copiesNeeded = Math.ceil(requiredSize / contentSize) + 1; // +1 to ensure enough coverage
    return Array(copiesNeeded)
      .fill(null)
      .map((_, i) =>
        React.Children.map(children, (child, index) =>
          React.cloneElement(child as React.ReactElement, {
            key: `duplicate-${i}-${index}`,
          })
        )
      )
      .flat();
  }, [
    containerWidth,
    contentWidth,
    contentHeight,
    height,
    direction,
    children,
  ]);

  useEffect(() => {
    setDuplicatedContent(calculateDuplicates());
  }, [calculateDuplicates]);

  useEffect(() => {
    let controls;
    const contentSize =
      (direction === 'horizontal' ? contentWidth : contentHeight) + gap;
    const from = reverse ? -contentSize : 0;
    const to = reverse ? 0 : -contentSize;

    const duration = Math.abs(contentSize) / currentSpeed;

    if (isTransitioning) {
      const current = translation.get();
      controls = animate(translation, [current, to], {
        ease: 'linear',
        duration: Math.abs(to - current) / currentSpeed,
        onComplete: () => {
          setIsTransitioning(false);
          translation.set(from);
          setKey((prev) => prev + 1);
        },
      });
    } else {
      controls = animate(translation, [from, to], {
        ease: 'linear',
        duration,
        repeat: Infinity,
        repeatType: 'loop',
        onRepeat: () => {
          translation.set(from);
        },
      });
    }

    return () => controls?.stop();
  }, [
    key,
    translation,
    currentSpeed,
    contentWidth,
    contentHeight,
    gap,
    isTransitioning,
    direction,
    reverse,
  ]);

  const hoverProps = speedOnHover
    ? {
        onHoverStart: () => {
          setIsTransitioning(true);
          setCurrentSpeed(speedOnHover);
        },
        onHoverEnd: () => {
          setIsTransitioning(true);
          setCurrentSpeed(speed);
        },
      }
    : {};

  return (
    <motion.div
      className={cn('overflow-hidden', className)}
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      {/* Hidden measurement element */}
      <div
        ref={contentRef}
        style={{ position: 'absolute', visibility: 'hidden' }}
      >
        {children}
      </div>

      {/* Actual slider */}
      <motion.div
        key={key}
        className='flex w-max'
        style={{
          [direction === 'horizontal' ? 'x' : 'y']: translation,
          gap: `${gap}px`,
          flexDirection: direction === 'horizontal' ? 'row' : 'column',
        }}
        {...hoverProps}
      >
        {duplicatedContent}
      </motion.div>
    </motion.div>
  );
}
